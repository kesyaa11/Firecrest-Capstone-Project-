using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Firecrest.Api.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace Firecrest.Tests;

[TestFixture]
public class FortnightHoursServiceTests
{
    private FirecrestDbContext _context = null!;
    private FortnightHoursService _service = null!;
    private readonly DateOnly _periodStart = new(2026, 9, 15);

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<FirecrestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new FirecrestDbContext(options);
        _service = new FortnightHoursService(_context);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Test]
    public async Task CalculateAsync_ShiftOnDay1_IsIncluded()
    {
        await AddShift(1, _periodStart, 8, 10);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(2m);
    }

    [Test]
    public async Task CalculateAsync_ShiftOnDay14_IsIncluded()
    {
        await AddShift(1, _periodStart.AddDays(13), 8, 10);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(2m);
        result.period_end.Should().Be(_periodStart.AddDays(13));
    }

    [Test]
    public async Task CalculateAsync_ShiftOnDay15_IsExcluded()
    {
        await AddShift(1, _periodStart.AddDays(14), 8, 10);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(0m);
    }

    [Test]
    public async Task CalculateAsync_ShiftBeforePeriod_IsExcluded()
    {
        await AddShift(1, _periodStart.AddDays(-1), 8, 10);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(0m);
    }

    [Test]
    public async Task CalculateAsync_OtherEmployeesShifts_AreExcluded()
    {
        await AddShift(2, _periodStart, 8, 10);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(0m);
    }

    [Test]
    public async Task CalculateAsync_ShiftsAcrossBothWeeks_AreSummed()
    {
        await AddShift(1, _periodStart.AddDays(1), 8, 10);
        await AddShift(1, _periodStart.AddDays(8), 10, 12);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(4m);
    }

    [Test]
    public async Task CalculateAsync_NoShifts_ReturnsZero()
    {
        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(0m);
    }

    [Test]
    public async Task CalculateAsync_MultipleShiftsOnOneDay_AreSummed()
    {
        await AddShift(1, _periodStart, 8, 10);
        await AddShift(1, _periodStart, 10, 12);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(4m);
    }

    [Test]
    public async Task CalculateAsync_UsesStartAndEndInsteadOfStoredDuration()
    {
        await AddShift(1, _periodStart, 8, 10, duration: 99);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(2m);
    }

    [Test]
    public async Task CalculateAsync_WorkTypeDoesNotAffectResult()
    {
        await AddShift(1, _periodStart, 8, 10, workType: "Testing");
        await AddShift(1, _periodStart.AddDays(1), 8, 10, workType: "Meeting");

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(4m);
    }

    [Test]
    public async Task CalculateAsync_OddHours_PreservesRawHoursAndReportsRemainder()
    {
        await AddShift(1, _periodStart, 8, 10);
        await AddShift(1, _periodStart, 10, 12);
        await AddShift(1, _periodStart, 12, 15);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(7m);
        result.complete_sprints.Should().Be(3);
        result.development_days.Should().Be(1);
        result.remainder_hours.Should().Be(1m);
    }

    [Test]
    public async Task CalculateAsync_RemainderHoursOnDifferentDays_CombineIntoSprint()
    {
        await AddShift(1, _periodStart, 8, 9);
        await AddShift(1, _periodStart.AddDays(1), 8, 9);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(2m);
        result.complete_sprints.Should().Be(1);
        result.remainder_hours.Should().Be(0m);
    }

    [TestCase("Approved", 1)]
    [TestCase("Pending", 0)]
    [TestCase("Rejected", 0)]
    public async Task CalculateAsync_LeaveStatus_OnlyApprovedIsReported(string status, int expectedEntries)
    {
        await AddLeave(1, _periodStart.AddDays(2), _periodStart.AddDays(3), status);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.approved_leave.Should().HaveCount(expectedEntries);
        result.approved_leave_calendar_days.Should().Be(expectedEntries == 1 ? 2 : 0);
        result.leave_hours.Should().Be(expectedEntries == 1 ? 16m : 0m);
    }

    [TestCase(1, 8, TestName = "1 approved leave day -> 8 leave hours")]
    [TestCase(2, 16, TestName = "2 approved leave days -> 16 leave hours")]
    [TestCase(3, 24, TestName = "3 approved leave days -> 24 leave hours")]
    public async Task CalculateAsync_ApprovedLeaveDays_AreEightHoursEach(int days, int expectedHours)
    {
        await AddLeave(1, _periodStart, _periodStart.AddDays(days - 1), "Approved");

        var result = await _service.CalculateAsync(1, _periodStart);

        result.leave_hours.Should().Be(expectedHours);
        result.approved_leave.Single().leave_hours.Should().Be(expectedHours);
    }

    [Test]
    public async Task CalculateAsync_WeekendLeaveDays_StillCount()
    {
        // 19 and 20 September 2026 are a Saturday and Sunday
        var saturday = new DateOnly(2026, 9, 19);
        await AddLeave(1, saturday, saturday.AddDays(1), "Approved");

        var result = await _service.CalculateAsync(1, _periodStart);

        saturday.DayOfWeek.Should().Be(DayOfWeek.Saturday);
        result.approved_leave_calendar_days.Should().Be(2);
        result.leave_hours.Should().Be(16m);
    }

    [Test]
    public async Task CalculateAsync_PublicHolidayDuringLeave_StillCounts()
    {
        await AddUser(1, "NZ");
        await AddHoliday("NZ", _periodStart.AddDays(1), isNational: true);
        await AddLeave(1, _periodStart, _periodStart.AddDays(2), "Approved");

        var result = await _service.CalculateAsync(1, _periodStart);

        result.approved_leave_calendar_days.Should().Be(3);
        result.leave_hours.Should().Be(24m);
        result.public_holiday_hours.Should().Be(0m);
    }

    [Test]
    public async Task CalculateAsync_MultipleApprovedLeaveRequests_AreSummed()
    {
        await AddLeave(1, _periodStart, _periodStart, "Approved");
        await AddLeave(1, _periodStart.AddDays(5), _periodStart.AddDays(6), "Approved");
        await AddLeave(1, _periodStart.AddDays(8), _periodStart.AddDays(8), "Pending");

        var result = await _service.CalculateAsync(1, _periodStart);

        result.leave_hours.Should().Be(24m);
    }

    [Test]
    public async Task CalculateAsync_ApprovedLeave_DoesNotChangeRawHours()
    {
        await AddShift(1, _periodStart, 8, 10);
        await AddLeave(1, _periodStart.AddDays(1), _periodStart.AddDays(1), "Approved");

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(2m);
        result.approved_leave_calendar_days.Should().Be(1);
        result.leave_hours.Should().Be(8m);
    }

    [Test]
    public async Task CalculateAsync_LeaveOverlappingPeriodEdges_IsClippedToFortnight()
    {
        await AddLeave(1, _periodStart.AddDays(-3), _periodStart.AddDays(1), "Approved");
        await AddLeave(1, _periodStart.AddDays(12), _periodStart.AddDays(20), "Approved");

        var result = await _service.CalculateAsync(1, _periodStart);

        result.approved_leave.Should().HaveCount(2);
        result.approved_leave[0].calendar_days_in_period.Should().Be(2);
        result.approved_leave[0].start_date.Should().Be(_periodStart.AddDays(-3));
        result.approved_leave[1].calendar_days_in_period.Should().Be(2);
        result.approved_leave_calendar_days.Should().Be(4);
        result.leave_hours.Should().Be(32m);
    }

    [Test]
    public async Task CalculateAsync_TuesdayStart_EndsOnMondayAfterFourteenDays()
    {
        var result = await _service.CalculateAsync(1, _periodStart);

        result.period_start.DayOfWeek.Should().Be(DayOfWeek.Tuesday);
        result.period_end.DayOfWeek.Should().Be(DayOfWeek.Monday);
        (result.period_end.DayNumber - result.period_start.DayNumber + 1).Should().Be(14);
    }

    [Test]
    public async Task CalculateAsync_ShiftOnFollowingTuesday_IsExcluded()
    {
        await AddShift(1, _periodStart.AddDays(13), 8, 10);
        await AddShift(1, _periodStart.AddDays(14), 8, 10);

        var result = await _service.CalculateAsync(1, _periodStart);

        _periodStart.AddDays(14).DayOfWeek.Should().Be(DayOfWeek.Tuesday);
        result.raw_hours.Should().Be(2m);
    }

    [Test]
    public async Task CalculateAsync_RemainderFromPreviousFortnight_IsNotCarriedOver()
    {
        await AddShift(1, _periodStart, 8, 15);
        await AddShift(1, _periodStart.AddDays(14), 8, 10);

        var firstFortnight = await _service.CalculateAsync(1, _periodStart);
        var secondFortnight = await _service.CalculateAsync(1, _periodStart.AddDays(14));

        firstFortnight.raw_hours.Should().Be(7m);
        firstFortnight.remainder_hours.Should().Be(1m);
        secondFortnight.raw_hours.Should().Be(2m);
        secondFortnight.complete_sprints.Should().Be(1);
        secondFortnight.remainder_hours.Should().Be(0m);
    }

    [Test]
    public async Task CalculateAsync_WorkedNationalPublicHoliday_IsTimeAndAHalfWithoutChangingRawHours()
    {
        await AddUser(1, "NZ");
        await AddHoliday("NZ", _periodStart.AddDays(1), isNational: true);
        await AddShift(1, _periodStart, 8, 10);
        await AddShift(1, _periodStart.AddDays(1), 8, 10);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(4m);
        result.public_holiday_hours.Should().Be(2m);
        result.holiday_adjusted_hours.Should().Be(5m);
    }

    [Test]
    public async Task CalculateAsync_OtherCountrysPublicHoliday_IsNotApplied()
    {
        await AddUser(1, "NZ");
        await AddHoliday("PH", _periodStart, isNational: true);
        await AddShift(1, _periodStart, 8, 10);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.public_holiday_hours.Should().Be(0m);
        result.holiday_adjusted_hours.Should().Be(2m);
    }

    [Test]
    public async Task CalculateAsync_PhilippinesUserOnPhilippinesHoliday_IsTimeAndAHalf()
    {
        await AddUser(1, "PH");
        await AddHoliday("PH", _periodStart, isNational: true);
        await AddHoliday("NZ", _periodStart.AddDays(1), isNational: true);
        await AddShift(1, _periodStart, 8, 11);
        await AddShift(1, _periodStart.AddDays(1), 8, 10);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(5m);
        result.public_holiday_hours.Should().Be(3m);
        result.holiday_adjusted_hours.Should().Be(6.5m);
    }

    [Test]
    public async Task CalculateAsync_RegionalPublicHoliday_IsNotApplied()
    {
        await AddUser(1, "NZ");
        await AddHoliday("NZ", _periodStart, isNational: false);
        await AddShift(1, _periodStart, 8, 10);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.public_holiday_hours.Should().Be(0m);
        result.holiday_adjusted_hours.Should().Be(2m);
    }

    [Test]
    public async Task CalculateAsync_SixTwentyMinuteShifts_TotalExactlyTwoHours()
    {
        // Three shifts per day across two days, within the daily shift limit
        await AddTwentyMinuteShifts(1, _periodStart);
        await AddTwentyMinuteShifts(1, _periodStart.AddDays(1));

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(2m);
        result.complete_sprints.Should().Be(1);
        result.development_days.Should().Be(0);
        result.remainder_hours.Should().Be(0m);
    }

    [Test]
    public async Task CalculateAsync_ThreeTwentyMinuteShifts_TotalExactlyOneHour()
    {
        await AddTwentyMinuteShifts(1, _periodStart);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(1m);
        result.complete_sprints.Should().Be(0);
        result.remainder_hours.Should().Be(1m);
    }

    [Test]
    public async Task CalculateAsync_TwentyMinuteShiftsOnPublicHoliday_TotalExactlyOneHour()
    {
        await AddUser(1, "NZ");
        await AddHoliday("NZ", _periodStart, isNational: true);
        await AddTwentyMinuteShifts(1, _periodStart);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.public_holiday_hours.Should().Be(1m);
        result.holiday_adjusted_hours.Should().Be(1.5m);
    }

    [TestCase(8, 13.5, 0, TestName = "5.5 worked hours -> no break, 5.5 after breaks")]
    [TestCase(8, 14, 0.5, TestName = "6 worked hours -> 0.5 break, 5.5 after breaks")]
    [TestCase(8, 15, 0.5, TestName = "7 worked hours -> 0.5 break, 6.5 after breaks")]
    [TestCase(8, 16, 0.5, TestName = "8 worked hours -> 0.5 break, 7.5 after breaks")]
    public async Task CalculateAsync_SingleShiftDay_AppliesBreakRule(double startHour, double endHour, decimal expectedBreak)
    {
        await AddShiftAt(1, _periodStart, TimeSpan.FromHours(startHour), TimeSpan.FromHours(endHour));

        var result = await _service.CalculateAsync(1, _periodStart);

        var worked = (decimal)(endHour - startHour);
        result.raw_hours.Should().Be(worked);
        result.break_hours.Should().Be(expectedBreak);
        result.hours_after_breaks.Should().Be(worked - expectedBreak);
    }

    [Test]
    public async Task CalculateAsync_ShiftsCombiningToSixHours_DeductOneBreak()
    {
        await AddShift(1, _periodStart, 8, 10);
        await AddShiftAt(1, _periodStart, TimeSpan.FromHours(10.5), TimeSpan.FromHours(12.5));
        await AddShift(1, _periodStart, 13, 15);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(6m);
        result.break_hours.Should().Be(0.5m);
        result.hours_after_breaks.Should().Be(5.5m);
    }

    [Test]
    public async Task CalculateAsync_BreakRule_IsAppliedPerDayAndSummed()
    {
        await AddShift(1, _periodStart, 8, 15);             // 7 hours -> break
        await AddShift(1, _periodStart.AddDays(1), 8, 13);  // 5 hours -> no break
        await AddShift(1, _periodStart.AddDays(2), 8, 14);  // 6 hours -> break

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(18m);
        result.break_hours.Should().Be(1m);
        result.hours_after_breaks.Should().Be(17m);
    }

    [Test]
    public async Task CalculateAsync_FractionalShiftsReachingSixHours_DeductBreakExactly()
    {
        // 3h + 2h 40m + 20m = exactly 6 hours
        await AddShift(1, _periodStart, 8, 11);
        await AddShiftAt(1, _periodStart, TimeSpan.FromHours(11), new TimeSpan(13, 40, 0));
        await AddShiftAt(1, _periodStart, new TimeSpan(14, 0, 0), new TimeSpan(14, 20, 0));

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(6m);
        result.break_hours.Should().Be(0.5m);
        result.hours_after_breaks.Should().Be(5.5m);
    }

    [Test]
    public async Task CalculateAsync_SixHoursSplitAcrossDays_HasNoBreak()
    {
        await AddShift(1, _periodStart, 8, 11);
        await AddShift(1, _periodStart.AddDays(1), 8, 11);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(6m);
        result.break_hours.Should().Be(0m);
    }

    [Test]
    public async Task CalculateAsync_BreakOnWorkedPublicHoliday_KeepsHolidayValuesSeparate()
    {
        await AddUser(1, "NZ");
        await AddHoliday("NZ", _periodStart, isNational: true);
        await AddShift(1, _periodStart, 8, 15);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(7m);
        result.public_holiday_hours.Should().Be(7m);
        result.holiday_adjusted_hours.Should().Be(10.5m);
        result.break_hours.Should().Be(0.5m);
        result.hours_after_breaks.Should().Be(6.5m);
    }

    [Test]
    public async Task CalculateAsync_LeaveDays_DoNotCreateBreaks()
    {
        await AddLeave(1, _periodStart, _periodStart.AddDays(1), "Approved");

        var result = await _service.CalculateAsync(1, _periodStart);

        result.leave_hours.Should().Be(16m);
        result.break_hours.Should().Be(0m);
    }

    [Test]
    public async Task CalculateAsync_OverlappingApprovedLeave_CountsEachDateOnce()
    {
        await AddLeave(1, _periodStart.AddDays(2), _periodStart.AddDays(4), "Approved");
        await AddLeave(1, _periodStart.AddDays(3), _periodStart.AddDays(5), "Approved");

        var result = await _service.CalculateAsync(1, _periodStart);

        result.approved_leave.Should().HaveCount(2);
        result.approved_leave[0].calendar_days_in_period.Should().Be(3);
        result.approved_leave[1].calendar_days_in_period.Should().Be(1);
        result.approved_leave_calendar_days.Should().Be(4);
        result.leave_hours.Should().Be(32m);
        result.approved_leave.Sum(leave => leave.leave_hours).Should().Be(result.leave_hours);
    }

    [Test]
    public async Task CalculateAsync_IdenticalApprovedLeaveRequests_CountOnce()
    {
        await AddLeave(1, _periodStart.AddDays(1), _periodStart.AddDays(1), "Approved");
        await AddLeave(1, _periodStart.AddDays(1), _periodStart.AddDays(1), "Approved");

        var result = await _service.CalculateAsync(1, _periodStart);

        result.leave_hours.Should().Be(8m);
        result.approved_leave_calendar_days.Should().Be(1);
    }

    [TestCase("Pending")]
    [TestCase("Rejected")]
    public async Task CalculateAsync_NonApprovedOverlappingLeave_AddsNothing(string status)
    {
        await AddLeave(1, _periodStart.AddDays(2), _periodStart.AddDays(3), "Approved");
        await AddLeave(1, _periodStart.AddDays(1), _periodStart.AddDays(4), status);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.approved_leave.Should().HaveCount(1);
        result.leave_hours.Should().Be(16m);
    }

    [Test]
    public async Task CalculateAsync_IncludesUserNameAndLeaveBalance()
    {
        await AddUser(1, "NZ");
        _context.leaveBalances.Add(new LeaveBalance { user_id = 1, al_outstanding = 40m, sick_days = 5 });
        await _context.SaveChangesAsync();

        var result = await _service.CalculateAsync(1, _periodStart);

        result.user_name.Should().Be("User 1");
        result.leave_balance.Should().NotBeNull();
        result.leave_balance!.al_outstanding.Should().Be(40m);
    }

    [Test]
    public async Task CalculateAsync_NoLeaveBalance_ReturnsNullBalance()
    {
        var result = await _service.CalculateAsync(1, _periodStart);

        result.leave_balance.Should().BeNull();
    }

    private async Task AddShiftAt(int userId, DateOnly date, TimeSpan start, TimeSpan end)
    {
        _context.shifts.Add(new Shift
        {
            user_id = userId,
            date = date,
            shift_start = start,
            shift_end = end,
            work_type = "Development"
        });

        await _context.SaveChangesAsync();
    }

    private async Task AddTwentyMinuteShifts(int userId, DateOnly date)
    {
        foreach (var startHour in new[] { 8, 9, 10 })
        {
            _context.shifts.Add(new Shift
            {
                user_id = userId,
                date = date,
                shift_start = TimeSpan.FromHours(startHour),
                shift_end = TimeSpan.FromHours(startHour) + TimeSpan.FromMinutes(20),
                work_type = "Development"
            });
        }

        await _context.SaveChangesAsync();
    }

    private async Task AddUser(int userId, string country)
    {
        _context.users.Add(new User { region = "NZ-WGN", id = userId, name = $"User {userId}", role = "Dev", country = country });
        await _context.SaveChangesAsync();
    }

    private async Task AddHoliday(string country, DateOnly date, bool isNational)
    {
        _context.publicHolidays.Add(new PublicHoliday
        {
            name = "Test Holiday",
            date = date,
            country = country,
            is_national = isNational
        });

        await _context.SaveChangesAsync();
    }

    [Test]
    public async Task CalculateAsync_LeaveOutsidePeriod_IsExcluded()
    {
        await AddLeave(1, _periodStart.AddDays(-5), _periodStart.AddDays(-1), "Approved");
        await AddLeave(1, _periodStart.AddDays(14), _periodStart.AddDays(16), "Approved");

        var result = await _service.CalculateAsync(1, _periodStart);

        result.approved_leave.Should().BeEmpty();
        result.approved_leave_calendar_days.Should().Be(0);
    }

    [Test]
    public async Task CalculateAsync_OtherEmployeesLeave_IsExcluded()
    {
        await AddLeave(2, _periodStart, _periodStart.AddDays(1), "Approved");

        var result = await _service.CalculateAsync(1, _periodStart);

        result.approved_leave.Should().BeEmpty();
    }

    private async Task AddLeave(int userId, DateOnly start, DateOnly end, string status)
    {
        _context.leaveRequests.Add(new LeaveRequest
        {
            user_id = userId,
            approver_id = 99,
            start_date = start,
            end_date = end,
            leave_type = "Annual Leave",
            status = status
        });

        await _context.SaveChangesAsync();
    }

    private async Task AddShift(
        int userId,
        DateOnly date,
        int startHour,
        int endHour,
        int? duration = 2,
        string workType = "Development")
    {
        _context.shifts.Add(new Shift
        {
            user_id = userId,
            date = date,
            shift_start = TimeSpan.FromHours(startHour),
            shift_end = TimeSpan.FromHours(endHour),
            duration = duration,
            work_type = workType
        });

        await _context.SaveChangesAsync();
    }
}

using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Firecrest.Api.Services;
using Firecrest.Api.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Tests;

[TestFixture]
public class HoursControllerTests
{
    private FirecrestDbContext _context = null!;
    private HoursController _controller = null!;
    private readonly DateOnly _periodStart = new(2026, 9, 15);

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<FirecrestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new FirecrestDbContext(options);
        _controller = new HoursController(_context, new FortnightHoursService(_context));

        _context.users.AddRange(
            new User { id = 1, name = "First User", role = "Dev", country = "NZ", region = "NZ-WGN" },
            new User { id = 2, name = "Second User", role = "SD", country = "PH", region = "PH-AUR" });
        _context.shifts.Add(new Shift
        {
            user_id = 2,
            date = _periodStart,
            shift_start = TimeSpan.FromHours(8),
            shift_end = TimeSpan.FromHours(10),
            work_type = "Development"
        });
        _context.SaveChanges();
    }

    [TearDown]
    public void TearDown()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Test]
    public async Task GetFortnightHoursForAllUsers_ReturnsOneResultPerUser()
    {
        var result = await _controller.GetFortnightHoursForAllUsers(_periodStart);

        var results = result.Value!.ToList();
        results.Select(r => r.user_id).Should().Equal(1, 2);
        results[0].raw_hours.Should().Be(0m);
        results[1].raw_hours.Should().Be(2m);
        results[1].complete_sprints.Should().Be(1);
    }

    [Test]
    public async Task GetFortnightHoursForAllUsers_MissingPeriodStart_ReturnsBadRequest()
    {
        var result = await _controller.GetFortnightHoursForAllUsers(null);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Test]
    public async Task GetFortnightHours_PeriodStartNotTuesday_ReturnsBadRequest()
    {
        var monday = _periodStart.AddDays(-1);

        var single = await _controller.GetFortnightHours(1, monday);
        var all = await _controller.GetFortnightHoursForAllUsers(monday);

        single.Result.Should().BeOfType<BadRequestObjectResult>();
        all.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Test]
    public async Task GetFortnightHours_TuesdayStart_ReturnsResult()
    {
        var result = await _controller.GetFortnightHours(2, _periodStart);

        result.Value!.period_start.Should().Be(_periodStart);
        result.Value.period_end.Should().Be(_periodStart.AddDays(13));
        result.Value.raw_hours.Should().Be(2m);
    }

    [Test]
    public async Task GetFortnightHoursForAllUsers_ReportMatchesIndividualResults()
    {
        // 7 hours on day 1, 2 hours on a national holiday, 2 approved leave days and a balance
        _context.shifts.AddRange(
            new Shift { user_id = 1, date = _periodStart, shift_start = TimeSpan.FromHours(8), shift_end = TimeSpan.FromHours(15), work_type = "Development" },
            new Shift { user_id = 1, date = _periodStart.AddDays(13), shift_start = TimeSpan.FromHours(8), shift_end = TimeSpan.FromHours(10), work_type = "Testing" });
        _context.publicHolidays.Add(new PublicHoliday { name = "Test Holiday", date = _periodStart.AddDays(13), country = "NZ", is_national = true });
        _context.leaveRequests.Add(new LeaveRequest
        {
            user_id = 1,
            approver_id = 2,
            start_date = _periodStart.AddDays(4),
            end_date = _periodStart.AddDays(5),
            leave_type = "Annual Leave",
            status = "Approved"
        });
        _context.leaveBalances.Add(new LeaveBalance { user_id = 1, al_outstanding = 64m, al_taken_accured = 16m });
        await _context.SaveChangesAsync();

        var all = (await _controller.GetFortnightHoursForAllUsers(_periodStart)).Value!.ToList();
        var single = (await _controller.GetFortnightHours(1, _periodStart)).Value!;
        var fromReport = all.Single(result => result.user_id == 1);

        fromReport.Should().BeEquivalentTo(single);
        fromReport.user_name.Should().Be("First User");
        fromReport.raw_hours.Should().Be(9m);
        fromReport.complete_sprints.Should().Be(4);
        fromReport.development_days.Should().Be(1);
        fromReport.remainder_hours.Should().Be(1m);
        fromReport.break_hours.Should().Be(0.5m);
        fromReport.hours_after_breaks.Should().Be(8.5m);
        fromReport.public_holiday_hours.Should().Be(2m);
        fromReport.holiday_adjusted_hours.Should().Be(10m);
        fromReport.approved_leave_calendar_days.Should().Be(2);
        fromReport.leave_hours.Should().Be(16m);
        fromReport.leave_balance!.al_outstanding.Should().Be(64m);
    }

    [Test]
    public async Task GetFortnightHours_UnknownUser_ReturnsNotFound()
    {
        var result = await _controller.GetFortnightHours(42, _periodStart);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }
}

using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Firecrest.Api.Services;

public class FortnightHoursService
{
    // Fortnights run Tuesday (day 1) to Monday (day 14)
    public const DayOfWeek PeriodStartDay = DayOfWeek.Tuesday;

    // Every approved leave day counts as 8 hours, weekends and public holidays included
    public const decimal LeaveHoursPerDay = 8m;

    // Hours worked on a public holiday are paid at time and a half
    public const decimal PublicHolidayMultiplier = 1.5m;

    private readonly FirecrestDbContext _context;

    public FortnightHoursService(FirecrestDbContext context)
    {
        _context = context;
    }

    public async Task<FortnightHoursResult> CalculateAsync(int userId, DateOnly periodStart)
    {
        var periodEndExclusive = periodStart.AddDays(14);

        var shifts = await _context.shifts
            .Where(shift =>
                shift.user_id == userId &&
                shift.date >= periodStart &&
                shift.date < periodEndExclusive)
            .ToListAsync();

        var periodEnd = periodStart.AddDays(13);

        var user = await _context.users
            .Where(existingUser => existingUser.id == userId)
            .Select(existingUser => new { existingUser.name, existingUser.country })
            .FirstOrDefaultAsync();

        var publicHolidayDates = await GetPublicHolidayDatesAsync(user?.country, periodStart, periodEnd);

        // Durations are summed exactly and converted to hours once, so odd minutes
        // (eg three 20 minute shifts) add up to whole hours without drifting
        var workedDuration = TimeSpan.Zero;
        var publicHolidayDuration = TimeSpan.Zero;

        // Worked time per calendar day, used for the daily break rule
        var dailyDurations = new Dictionary<DateOnly, TimeSpan>();

        foreach (var shift in shifts)
        {
            if (shift.shift_start == null || shift.shift_end == null)
            {
                throw new InvalidOperationException($"Shift {shift.id} does not have a start and end time");
            }

            var shiftDuration = shift.shift_end.Value - shift.shift_start.Value;
            workedDuration += shiftDuration;
            dailyDurations[shift.date] = dailyDurations.GetValueOrDefault(shift.date) + shiftDuration;

            if (publicHolidayDates.Contains(shift.date))
            {
                publicHolidayDuration += shiftDuration;
            }
        }

        var rawHours = ToHours(workedDuration);
        var publicHolidayHours = ToHours(publicHolidayDuration);
        var breakHours = dailyDurations.Values.Sum(duration => BreakPolicy.BreakHoursForDay(ToHours(duration)));

        var approvedLeave = await GetApprovedLeaveAsync(userId, periodStart, periodEnd);

        var leaveBalance = await _context.leaveBalances
            .AsNoTracking()
            .Where(balance => balance.user_id == userId)
            .OrderBy(balance => balance.id)
            .FirstOrDefaultAsync();

        return new FortnightHoursResult
        {
            user_id = userId,
            user_name = user?.name,
            period_start = periodStart,
            period_end = periodEnd,
            raw_hours = rawHours,
            complete_sprints = SprintCalculator.CompleteSprints(rawHours),
            development_days = SprintCalculator.DevelopmentDays(rawHours),
            remainder_hours = SprintCalculator.RemainderHours(rawHours),
            break_hours = breakHours,
            hours_after_breaks = rawHours - breakHours,
            public_holiday_hours = publicHolidayHours,
            holiday_adjusted_hours = rawHours + publicHolidayHours * (PublicHolidayMultiplier - 1),
            approved_leave = approvedLeave,
            approved_leave_calendar_days = approvedLeave.Sum(leave => leave.calendar_days_in_period),
            leave_hours = approvedLeave.Sum(leave => leave.leave_hours),
            leave_balance = leaveBalance
        };
    }

    private static decimal ToHours(TimeSpan duration)
    {
        return (decimal)duration.Ticks / TimeSpan.TicksPerHour;
    }

    // National public holidays for the user's country (NZ or PH).
    // Regional holidays are not included because the user's region is not available on the User model.
    private async Task<HashSet<DateOnly>> GetPublicHolidayDatesAsync(string? country, DateOnly periodStart, DateOnly periodEnd)
    {
        if (country == null) return [];

        var dates = await _context.publicHolidays
            .Where(holiday =>
                holiday.country == country &&
                holiday.is_national &&
                holiday.date >= periodStart &&
                holiday.date <= periodEnd)
            .Select(holiday => holiday.date)
            .ToListAsync();

        return dates.ToHashSet();
    }

    // Only approved leave counts, pending and rejected requests are ignored.
    // Leave that starts before or ends after the fortnight is clipped to the period.
    // When approved requests overlap, each date is counted once, against the earliest request.
    private async Task<List<FortnightLeaveEntry>> GetApprovedLeaveAsync(int userId, DateOnly periodStart, DateOnly periodEnd)
    {
        var leaveRequests = await _context.leaveRequests
            .Where(leaveRequest =>
                leaveRequest.user_id == userId &&
                leaveRequest.status == "Approved" &&
                leaveRequest.start_date <= periodEnd &&
                leaveRequest.end_date >= periodStart)
            .OrderBy(leaveRequest => leaveRequest.start_date)
            .ThenBy(leaveRequest => leaveRequest.id)
            .ToListAsync();

        var countedDates = new HashSet<DateOnly>();

        return leaveRequests.Select(leaveRequest =>
        {
            var start = leaveRequest.start_date > periodStart ? leaveRequest.start_date : periodStart;
            var end = leaveRequest.end_date < periodEnd ? leaveRequest.end_date : periodEnd;

            var days = 0;
            for (var date = start; date <= end; date = date.AddDays(1))
            {
                if (countedDates.Add(date)) days++;
            }

            return new FortnightLeaveEntry
            {
                leave_request_id = leaveRequest.id,
                leave_type = leaveRequest.leave_type,
                start_date = leaveRequest.start_date,
                end_date = leaveRequest.end_date,
                calendar_days_in_period = days,
                leave_hours = days * LeaveHoursPerDay
            };
        }).ToList();
    }
}

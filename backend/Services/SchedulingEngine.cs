using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Firecrest.Api.Services;

public class SchedulingEngine
{
    // The engine reads existing shifts so it can enforce rules across a user's day.
    private readonly FirecrestDbContext _context;

    public SchedulingEngine(FirecrestDbContext context)
    {
        _context = context;
    }

    // Returns null when the shift is valid, or a short message explaining the failed rule.
    // When updating a shift, excludedShiftId prevents that shift from counting itself.
    public async Task<string?> ValidateShift(Shift shift, int? excludedShiftId = null)
    {
        // SD schedules contain four valid daily slots, numbered 1 through 4.
        if (shift.slot_number is null or < 1 or > 4)
        {
            return "Invalid shift slot";
        }

        // Shift lengths are flexible, but both times must exist and the shift must end after it starts.
        if (shift.shift_start == null || shift.shift_end == null)
        {
            return "Shift start and end times are required";
        }

        if (shift.shift_end.Value <= shift.shift_start.Value)
        {
            return "Shift must end after it starts";
        }

        // Do not schedule a user on any date covered by their approved leave.
        if (await _context.leaveRequests.AnyAsync(leaveRequest =>
            leaveRequest.user_id == shift.user_id &&
            leaveRequest.status == "Approved" &&
            leaveRequest.start_date <= shift.date &&
            leaveRequest.end_date >= shift.date))
        {
            return "User is on approved leave for this date";
        }

        // Compare only this user's other shifts on the requested date.
        var shiftsForUserOnDate = _context.shifts.Where(existingShift =>
            existingShift.user_id == shift.user_id &&
            existingShift.date == shift.date &&
            (!excludedShiftId.HasValue || existingShift.id != excludedShiftId.Value));

        // Report an exact duplicate before the broader overlap check for a clearer message.
        if (await shiftsForUserOnDate.AnyAsync(existingShift =>
            existingShift.shift_start == shift.shift_start &&
            existingShift.shift_end == shift.shift_end))
        {
            return "Shift already exists for this user at this time";
        }

        // Two shifts overlap when each one starts before the other one finishes.
        if (await shiftsForUserOnDate.AnyAsync(existingShift =>
            existingShift.shift_start != null &&
            existingShift.shift_end != null &&
            shift.shift_start < existingShift.shift_end &&
            shift.shift_end > existingShift.shift_start))
        {
            return "Shift overlaps with an existing shift for this user";
        }

        // Count only this user's other shifts on the requested date.
        var shiftsToday = await shiftsForUserOnDate.CountAsync();

        // A user may already have zero, one, or two shifts before another is added.
        if (shiftsToday >= 3)
        {
            return "User cannot have more than 3 shifts per day";
        }

        // These values are derived by the server instead of trusted from the request body.
        // duration is stored as whole hours, so it is left empty for part-hour shifts.
        // Worked hours are always calculated from the start and end times.
        var shiftHours = (shift.shift_end.Value - shift.shift_start.Value).TotalHours;
        shift.duration = shiftHours % 1 == 0 ? (int)shiftHours : null;
        shift.shifts_count = shiftsToday + 1;

        return null;
    }
}

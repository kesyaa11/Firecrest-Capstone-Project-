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

        // Both times must exist and the difference between them must be exactly two hours.
        if (shift.shift_start == null || shift.shift_end == null ||
            (shift.shift_end.Value - shift.shift_start.Value).TotalHours != 2)
        {
            return "Shift must be 2 hours";
        }

        // Count only this user's other shifts on the requested date.
        var shiftsToday = await _context.shifts.CountAsync(existingShift =>
            existingShift.user_id == shift.user_id &&
            existingShift.date == shift.date &&
            (!excludedShiftId.HasValue || existingShift.id != excludedShiftId.Value));

        // A user may already have zero, one, or two shifts before another is added.
        if (shiftsToday >= 3)
        {
            return "User cannot have more than 3 shifts per day";
        }

        // These values are derived by the server instead of trusted from the request body.
        shift.duration = 2;
        shift.shifts_count = shiftsToday + 1;

        return null;
    }
}

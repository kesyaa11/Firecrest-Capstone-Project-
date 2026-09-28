using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Firecrest.Api.Services;

public class FortnightHoursService
{
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

        decimal rawHours = 0;

        foreach (var shift in shifts)
        {
            if (shift.shift_start == null || shift.shift_end == null)
            {
                throw new InvalidOperationException($"Shift {shift.id} does not have a start and end time");
            }

            rawHours += (decimal)(shift.shift_end.Value - shift.shift_start.Value).TotalHours;
        }

        return new FortnightHoursResult
        {
            user_id = userId,
            period_start = periodStart,
            period_end = periodStart.AddDays(13),
            raw_hours = rawHours
        };
    }
}

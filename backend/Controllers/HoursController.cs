using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Firecrest.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Firecrest.Api.Controllers;

[Route("admin/hours")]
[ApiController]
public class HoursController : ControllerBase
{
    private readonly FirecrestDbContext _context;
    private readonly FortnightHoursService _fortnightHoursService;

    public HoursController(FirecrestDbContext context, FortnightHoursService fortnightHoursService)
    {
        _context = context;
        _fortnightHoursService = fortnightHoursService;
    }

    [HttpGet("fortnight")]
    public async Task<ActionResult<FortnightHoursResult>> GetFortnightHours(
        [FromQuery] int userId,
        [FromQuery] DateOnly? periodStart)
    {
        if (periodStart == null)
            return BadRequest(new { message = "Period start is required" });

        if (!IsPeriodStartDay(periodStart.Value))
            return BadRequest(new { message = $"Period start must be a {FortnightHoursService.PeriodStartDay}" });

        if (!await _context.users.AnyAsync(user => user.id == userId))
            return NotFound(new { message = "User not found" });

        return await _fortnightHoursService.CalculateAsync(userId, periodStart.Value);
    }

    // Same fortnight calculation for every user, used by the timesheet overview
    [HttpGet("fortnight/all")]
    public async Task<ActionResult<IEnumerable<FortnightHoursResult>>> GetFortnightHoursForAllUsers(
        [FromQuery] DateOnly? periodStart)
    {
        if (periodStart == null)
            return BadRequest(new { message = "Period start is required" });

        if (!IsPeriodStartDay(periodStart.Value))
            return BadRequest(new { message = $"Period start must be a {FortnightHoursService.PeriodStartDay}" });

        var userIds = await _context.users
            .OrderBy(user => user.id)
            .Select(user => user.id)
            .ToListAsync();

        var results = new List<FortnightHoursResult>();
        foreach (var userId in userIds)
        {
            results.Add(await _fortnightHoursService.CalculateAsync(userId, periodStart.Value));
        }

        return results;
    }

    private static bool IsPeriodStartDay(DateOnly periodStart)
    {
        return periodStart.DayOfWeek == FortnightHoursService.PeriodStartDay;
    }
}

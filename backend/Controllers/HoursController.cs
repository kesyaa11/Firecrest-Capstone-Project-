using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Firecrest.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Firecrest.Controllers;

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

        if (!await _context.users.AnyAsync(user => user.id == userId))
            return NotFound(new { message = "User not found" });

        return await _fortnightHoursService.CalculateAsync(userId, periodStart.Value);
    }
}

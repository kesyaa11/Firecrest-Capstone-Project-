using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Firecrest.Api.Services;

namespace Firecrest.Controllers;

[Route("admin/shifts")]
[ApiController]
public class ShiftsController : ControllerBase
{
    private static readonly string[] ValidWorkTypes =
        { "Testing", "Development", "Meeting", "Documentation", "Other" };

    // The controller handles database operations and delegates SD rules to the engine.
    private readonly FirecrestDbContext _context;
    private readonly SchedulingEngine _schedulingEngine;

    public ShiftsController(FirecrestDbContext context, SchedulingEngine schedulingEngine)
    {
        _context = context;
        _schedulingEngine = schedulingEngine;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Shift>>> GetShifts()
    {
        return await _context.shifts.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Shift>> GetShiftById(int id)
    {
        var shift = await _context.shifts.SingleOrDefaultAsync(existingShift => existingShift.id == id);
        return shift == null ? NotFound(new { message = "Shift not found" }) : shift;
    }

    [HttpPost]
    public async Task<ActionResult<Shift>> CreateShift(Shift shift)
    {
        // Do not save anything until both request checks and scheduling rules pass.
        var validationResult = await ValidateAndPrepareShift(shift);
        if (validationResult != null) return validationResult;

        _context.shifts.Add(shift);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetShiftById), new { id = shift.id }, shift);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateShift(int id, Shift shiftUpdated)
    {
        // A full replacement must identify the same shift in the URL and request body.
        if (id != shiftUpdated.id)
            return BadRequest(new { message = "The route ID must match the shift ID" });

        var existingShift = await _context.shifts.FindAsync(id);
        if (existingShift == null) return NotFound(new { message = "Shift not found" });

        // Exclude the existing record while checking daily limits and time conflicts.
        var validationResult = await ValidateAndPrepareShift(shiftUpdated, id);
        if (validationResult != null) return validationResult;

        _context.Entry(existingShift).CurrentValues.SetValues(shiftUpdated);
        await _context.SaveChangesAsync();
        return Ok(existingShift);
    }

    [HttpPatch("{id}")]
    public async Task<ActionResult> PatchShift(int id, ShiftPatchRequest patch)
    {
        var shift = await _context.shifts.FindAsync(id);
        if (shift == null) return NotFound(new { message = "Shift not found" });

        // Only copy fields that were supplied, leaving every other value unchanged.
        if (patch.user_id.HasValue) shift.user_id = patch.user_id.Value;
        if (patch.date.HasValue) shift.date = patch.date.Value;
        if (patch.shift_start.HasValue) shift.shift_start = patch.shift_start.Value;
        if (patch.shift_end.HasValue) shift.shift_end = patch.shift_end.Value;
        if (patch.slot_number.HasValue) shift.slot_number = patch.slot_number.Value;
        if (patch.work_type != null) shift.work_type = patch.work_type;

        // Updates must obey the same rules as newly created shifts.
        var validationResult = await ValidateAndPrepareShift(shift, id);
        if (validationResult != null) return validationResult;

        await _context.SaveChangesAsync();
        return Ok(shift);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteShift(int id)
    {
        var shift = await _context.shifts.FindAsync(id);
        if (shift == null) return NotFound(new { message = "Shift not found" });

        _context.shifts.Remove(shift);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Shift deleted" });
    }

    // Handles basic request and data-integrity checks before scheduling validation.
    private async Task<ActionResult?> ValidateAndPrepareShift(Shift shift, int? excludedShiftId = null)
    {
        // A shift cannot reference a user that is not in the database.
        if (!await _context.users.AnyAsync(user => user.id == shift.user_id))
            return NotFound(new { message = "User not found" });

        if (shift.date == default)
            return BadRequest(new { message = "Shift date is required" });

        // if (shift.shift_start == null || shift.shift_end == null)
        //     return BadRequest(new { message = "Shift start and end times are required" });

        if (shift.shift_start >= shift.shift_end)
            return BadRequest(new { message = "Shift start time must be before shift end time" });

        if (!ValidWorkTypes.Contains(shift.work_type))
            return BadRequest(new { message = "Invalid work type" });

        // The engine owns all scheduling-specific validation.
        var schedulingError = await _schedulingEngine.ValidateShift(shift, excludedShiftId);
        if (schedulingError != null)
            return BadRequest(new { message = schedulingError });

        return null;
    }

    // Nullable properties allow PATCH requests to contain only the fields being changed.
    public sealed class ShiftPatchRequest
    {
        public int? user_id { get; set; }
        public DateOnly? date { get; set; }
        public TimeSpan? shift_start { get; set; }
        public TimeSpan? shift_end { get; set; }
        public int? slot_number { get; set; }
        public string? work_type { get; set; }
    }
}

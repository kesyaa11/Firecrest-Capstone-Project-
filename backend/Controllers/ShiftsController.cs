using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Data;
using Firecrest.Api.Models;

namespace Firecrest.Controllers;

// What the url is going to look like, admin/shifts is so only admins can access this part of the system
[Route("admin/shifts")]
[ApiController]
public class ShiftsController : ControllerBase
{
    // Read context in database
    private readonly FirecrestDbContext _context;

    // Initialize the controller with database context
   public ShiftsController(FirecrestDbContext context)
   {
       _context = context;
   }

    // Get all shifts from the database returned in list
   [HttpGet]
   public async Task<ActionResult<IEnumerable<Shift>>> GetShifts()
   {
       return await _context.shifts.ToListAsync();
   }

    // Get shift searched via ID and return error 404 shift not found if id does not exist with a shift
   [HttpGet("{id}")]
   public async Task<ActionResult<Shift>> GetShiftById(int id)
   {
       var shift = await _context.shifts
           .SingleOrDefaultAsync(existingShift => existingShift.id == id);

       if (shift == null)
       {
           return NotFound(new { message = "Shift not found" });
       }
       return shift;
   }

    // HTTP Post allows the creation of a new shift in the database
   [HttpPost]
   public async Task<ActionResult<Shift>> CreateShift(Shift shift)
    {
        // Check the user the shift is being assigned to exists in the database
        var user = await _context.users.FindAsync(shift.user_id);
        if (user == null)
        {
            // Return 404 user not found if user does not exist
            return NotFound(new { message = "User not found" });
        }

        // check shift date 
        if (shift.date == default)
        {
            return BadRequest(new { message = "Shift date is required" });
        }

        // check shift start and end are required 
        if (shift.shift_start == null || shift.shift_end == null)
        {
            return BadRequest(new { message = "Shift start and end times are required" });
        } 

        // start time must be before end time
        if (shift.shift_start >= shift.shift_end)
        {
            //return 400 bad request if shift start time is after or equal to shift end time
            return BadRequest(new { message = "Shift start time must be before shift end time" });
        }

        // slot number must be valid (temp) 
        if (shift.slot_number < 1 || shift.slot_number <= 0)
        {
            return BadRequest(new { message = "A valid slot number is required" });
        }

        // slot number must be between 1 - 3 (days worth maximum of 3 shifts per day)
        if (shift.slot_number == null || shift.slot_number < 1 || shift.slot_number > 4)
        {
            return BadRequest(new { message = "Slot number must be between 1 and 4" });
        }

        // calculate shift duration 
        var duration = (shift.shift_end.Value - shift.shift_start.Value);

        // Check how many shifts the user already has on this date
        var shiftsToday = await _context.shifts.CountAsync(existingShift =>
            existingShift.user_id == shift.user_id &&
            existingShift.date == shift.date
        );
        

        // SD shifts must be exactly 2 hours
        // This should eventually only apply to SD users
        if (duration.TotalHours != 2)
        {
        return BadRequest(new{message = "SD shifts must be exactly 2 hours long"});
        }

        // shift duration is calculated and stored in the database for reporting purposes
        shift .duration = (int)duration.TotalHours;

        //FR: 03 
        if (shiftsToday >= 3)
        {
            return BadRequest(new { message = "This employee already has the maximum of 3 shifts for this day" });
        }


        // check for dupes 
        var duplicateShift = await _context.shifts.AnyAsync(existingShift =>
           existingShift.user_id == shift.user_id &&
           existingShift.date == shift.date &&
           existingShift.shift_start == shift.shift_start &&
           existingShift.shift_end == shift.shift_end
        );
        if (duplicateShift)
        {
            return BadRequest(new { message = "Shift already exists for this user at this time" });
        }

        // check if the shift overlaps with any existing shifts for the same user
        var overlappingShift = await _context.shifts.AnyAsync(existingShift =>
            existingShift.user_id == shift.user_id &&
            existingShift.date == shift.date &&
            existingShift.shift_start != null &&
            existingShift.shift_end != null &&
            shift.shift_start < existingShift.shift_end &&
            shift.shift_end > existingShift.shift_start
        ); 
        if (overlappingShift)
        {
            return BadRequest(new { message = "Shift overlaps with an existing shift for this user" });
        }

        // Set shift count automatically
        shift.shifts_count = shiftsToday + 1;


        // if all checks pass, add the shift to the database and save changes
        // Add shift to database and save changes
        _context.shifts.Add(shift);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetShiftById), new { id = shift.id }, shift);
    }

    // HTTP Put replaces shift with a new shift object
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateShift(int id, Shift shiftUpdated)
    {
        // Check the ID matches the shift ID
        if (id != shiftUpdated.id)
        {
            return NotFound(new { message = "Shift not found" });
        }

        // Update the shift in the database and save changes
        _context.Entry(shiftUpdated).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        // Return confirmation of shift being updated
        return Ok(new { message = "Shift updated" });
    }

    // HTTP Patch endpoint updates shift by ID by modifying them instead of replacing
    [HttpPatch("{id}")]
    public async Task<ActionResult> PatchShift(int id, Shift shiftUpdated)
    {
        // Check the ID matches the shift ID
        if (id != shiftUpdated.id)
        {
            return NotFound(new { message = "Shift not found" });
        }

        // Update the shift in the database and save changes
        _context.Entry(shiftUpdated).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        // Return confirmation of shift being updated
        return Ok(new { message = "Shift updated" });
    }

    // HTTP Delete will remove a shift from the database
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteShift(int id)
    {
        // Find the shift by ID
        var shift = await _context.shifts.FindAsync(id);

        // If shift does not exist return 404 not found
        if (shift == null)
        {
            return NotFound(new { message = "Shift not found" });
        }

        // Remove shift and save changes
        _context.shifts.Remove(shift);
        await _context.SaveChangesAsync();

        // Return message confirming deletion of shift
        return Ok(new { message = "Shift Deleted" });
    }
}
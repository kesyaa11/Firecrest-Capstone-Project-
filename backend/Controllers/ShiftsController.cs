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
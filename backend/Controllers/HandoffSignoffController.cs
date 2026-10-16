using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Data;
using Firecrest.Api.Models;

namespace Firecrest.Controllers;

// Handoff signoffs are managed under the handoff API area.
[Route("admin/handoff-signoffs")]
[ApiController]
public class HandoffSignoffController : ControllerBase
{
    // Read context in database
    private readonly FirecrestDbContext _context;

    // Initialize the controller with database context
    public HandoffSignoffController(FirecrestDbContext context)
    {
        _context = context;
    }

    // Get all handoff signoffs from the databaes returned in a list
    [HttpGet]
    public async Task<ActionResult<IEnumerable<HandoffSignoff>>> GetHandoffSignoff()
    {
        return await _context.handoffSignoffs.ToListAsync();
    }

    // Get handoff signoff via ID and return error 404 if it does not exist.
    [HttpGet("{id}")]
    public async Task<ActionResult<HandoffSignoff>> GetHandoffSignoffById(int id)
    {
        var handoffSignoff = await _context.handoffSignoffs
            .SingleOrDefaultAsync(existingHandoffSignoff => existingHandoffSignoff.id == id);

        if (handoffSignoff == null)
        {
            return NotFound(new { message = "Handoff Signoff not found" });
        }

        return handoffSignoff;
    }

    // HTTP Post allows the creation of a new handoff signoff in the database
    [HttpPost]
    public async Task<ActionResult<HandoffSignoff>> CreateHandoffSignoff(HandoffSignoff handoffSignoff)
    {
        // Check the handoff exists before creating the signoff
        var handoffExists = await _context.specificationHandoffs.AnyAsync(handoff => handoff.id == handoffSignoff.handoff_id);
        if (!handoffExists)
        {
            return NotFound(new { message = "Handoff not found" });
        }

        // Check the signer exists before creating the signoff
        var signerExists = await _context.users.AnyAsync(user => user.id == handoffSignoff.signer_id);
        if (!signerExists)
        {
            return NotFound(new { message = "Signer not found" });
        }

        _context.handoffSignoffs.Add(handoffSignoff);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetHandoffSignoffById), new { id = handoffSignoff.id }, handoffSignoff);
    }

    // HTTP PUT replaces an existing handoff signoff
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateHandoffSignoff(int id, HandoffSignoff handoffSignoffUpdated)
    {
        // Check the ID matches the handoff signoff ID
        if (id != handoffSignoffUpdated.id)
        {
            return NotFound(new { message = "Handoff Signoff not found" });
        }

        var handoffSignoffExists = await _context.handoffSignoffs.AnyAsync(existing => existing.id == id);
        if (!handoffSignoffExists)
        {
            return NotFound(new { message = "Handoff Signoff not found" });
        }

        // Update the project in the database and save changes
        _context.Entry(handoffSignoffUpdated).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        // Return confirmation of project being updated
        return Ok(new { message = "Handoff Signoff updated" });
    }

    // Delete an existing handoff signoff.
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteHandoffSignoff(int id)
    {
        // Find the project by ID
        var handoffSignoff = await _context.handoffSignoffs.FindAsync(id);

        // If project does not exist return 404 not found
        if (handoffSignoff == null)
        {
            return NotFound(new { message = "Handoff Signoff not found" });
        }

        // Remove project and save changes
        _context.handoffSignoffs.Remove(handoffSignoff);
        await _context.SaveChangesAsync();

        // Return message confirming deletion of project
        return Ok(new { message = "Handoff Signoff Deleted" });
    }
}
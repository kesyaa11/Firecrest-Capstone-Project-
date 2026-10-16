using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Data;
using Firecrest.Api.Models;

namespace Firecrest.Api.Controllers;

// What the url is going to look like, admin/projects is so only admins can access this part of the system
[Route("admin/handoffdelays")]
[ApiController]
public class HandoffDelaysController : ControllerBase
{
    // Read context in database
    private readonly FirecrestDbContext _context;

    // Initialize the controller with database context
    public HandoffDelaysController(FirecrestDbContext context)
    {
        _context = context;
    }

    // Get all handoff delays from the database returned in list
    [HttpGet]
    public async Task<ActionResult<IEnumerable<HandoffDelay>>> GetHandoffDelays()
    {
        return await _context.handoffDelays.ToListAsync();
    }

    // Get handoff delay via ID and return error 404 if it does not exist.
    [HttpGet("{id}")]
    public async Task<ActionResult<HandoffDelay>> GetHandoffDelayById(int id)
    {
        var handoffDelay = await _context.handoffDelays
            .SingleOrDefaultAsync(existingHandoffDelay => existingHandoffDelay.id == id);

        if (handoffDelay == null)
        {
            return NotFound(new { message = "Handoff Delay not found" });
        }

        return handoffDelay;
    }

    // HTTP Post allows the creation of a new handoff delay in the database
    [HttpPost]
    public async Task<ActionResult<HandoffDelay>> CreateHandoffDelay(HandoffDelay handoffDelay)
    {
        // Check that the handoff exists before creating the delay then save changes when it's added to the database
        var handoffExists = await _context.specificationHandoffs.AnyAsync(handoff => handoff.id == handoffDelay.handoff_id);
        if (!handoffExists)
        {
            return NotFound(new { message = "Handoff not found" });
        }

        _context.handoffDelays.Add(handoffDelay);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetHandoffDelayById), new { id = handoffDelay.id }, handoffDelay);
    }

    // HTTP PUT replaces an existing handoff delay with a new one
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateHandoffDelay(int id, HandoffDelay handoffDelayUpdated)
    {
        // Check the ID matches the handoff delay ID
        if (id != handoffDelayUpdated.id)
        {
            return NotFound(new { message = "Handoff Delay not found" });
        }

        // Check that the handoff delay exists before updating it
        var handoffDelayExists = await _context.handoffDelays.AnyAsync(existing => existing.id == id);
        if (!handoffDelayExists)
        {
            return NotFound(new { message = "Handoff Delay not found" });
        }

        // Update the project in the database and save changes
        _context.Entry(handoffDelayUpdated).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        // Return confirmation of project being updated
        return Ok(new { message = "Handoff Delay updated" });
    }

    // HTTP Delete will remove an existing handoff delay from the database
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteHandoffDelay(int id)
    {
        // Find the project by ID
        var handoffDelay = await _context.handoffDelays.FindAsync(id);

        // If project does not exist return 404 not found
        if (handoffDelay == null)
        {
            return NotFound(new { message = "Handoff Delay not found" });
        }

        // Remove project and save changes
        _context.handoffDelays.Remove(handoffDelay);
        await _context.SaveChangesAsync();

        // Return message confirming deletion of project
        return Ok(new { message = "Handoff Delay Deleted" });
    }
}
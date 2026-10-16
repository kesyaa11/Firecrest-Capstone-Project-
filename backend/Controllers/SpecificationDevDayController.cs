using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Data;
using Firecrest.Api.Models;

namespace Firecrest.Api.Controllers;

// What the url is going to look like, admin/projects is so only admins can access this part of the system
[Route("admin/specificationdevdays")]
[ApiController]
public class SpecificationDevDaysController : ControllerBase
{
    // Read context in database
    private readonly FirecrestDbContext _context;

    // Initialize the controller with database context
    public SpecificationDevDaysController(FirecrestDbContext context)
    {
        _context = context;
    }

    // Get all dev days for the specification from the database returned in list
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SpecificationDevDay>>> GetSpecificationDevDays()
    {
        return await _context.specificationDevDays.ToListAsync();
    }

    // Get project searched via ID and return error 404 project not found if id does not exist with a project
    [HttpGet("{id}")]
    public async Task<ActionResult<SpecificationDevDay>> GetSpecificationDevDayById(int id)
    {
        var project = await _context.specificationDevDays
            .SingleOrDefaultAsync(existingSpecificationDevDay => existingSpecificationDevDay.id == id);

        if (project == null)
        {
            return NotFound(new { message = "Dev Days not found" });
        }

        return project;
    }

    // HTTP Post allows the creation of a new dev days in the database
    [HttpPost]
    public async Task<ActionResult<SpecificationDevDay>> CreateSpecificationDevDay(SpecificationDevDay specificationDevDay)
    {
        // Add project to database and save changes
        _context.specificationDevDays.Add(specificationDevDay);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSpecificationDevDayById), new { id = specificationDevDay.id }, specificationDevDay);
    }

    // HTTP Put replaces dev days with a new dev days object
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateSpecificationDevDay(int id, SpecificationDevDay specificationDevDayUpdated)
    {
        // Check the ID matches the project ID
        if (id != specificationDevDayUpdated.id)
        {
            return NotFound(new { message = "Dev Days not found" });
        }

        // Update the project in the database and save changes
        _context.Entry(specificationDevDayUpdated).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        // Return confirmation of project being updated
        return Ok(new { message = "Dev Days updated" });
    }

    // HTTP Delete will remove a project from the database
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteDevDays(int id)
    {
        // Find the project by ID
        var project = await _context.specificationDevDays.FindAsync(id);

        // If project does not exist return 404 not found
        if (project == null)
        {
            return NotFound(new { message = "Dev Days not found" });
        }

        // Remove project and save changes
        _context.specificationDevDays.Remove(project);
        await _context.SaveChangesAsync();

        // Return message confirming deletion of project
        return Ok(new { message = "Dev Days Deleted" });
    }
}
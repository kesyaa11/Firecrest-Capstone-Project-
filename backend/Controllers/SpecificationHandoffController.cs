using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Data;
using Firecrest.Api.Models;

namespace Firecrest.Controllers;

// What the url is going to look like, admin/projects is so only admins can access this part of the system
[Route("admin/specificationhandoffs")]
[ApiController]
public class SpecificationHandoffsController : ControllerBase
{
    // Read context in database
    private readonly FirecrestDbContext _context;

    // Initialize the controller with database context
   public SpecificationHandoffsController(FirecrestDbContext context)
   {
       _context = context;
   }

    // Get all projects from the database returned in list
   [HttpGet]
   public async Task<ActionResult<IEnumerable<SpecificationHandoff>>> GetSpecificationHandoffs()
   {
       return await _context.specificationHandoffs.ToListAsync();
   }

    // Get project searched via ID and return error 404 project not found if id does not exist with a project
   [HttpGet("{id}")]
   public async Task<ActionResult<SpecificationHandoff>> GetSpecificationHandoffById(int id)
   {
       var project = await _context.specificationHandoffs
           .SingleOrDefaultAsync(existingProject => existingProject.id == id);

       if (project == null)
       {
           return NotFound(new { message = "Handoff not found" });
       }
       
       return project;
   }

    // HTTP Post allows the creation of a new project in the database
   [HttpPost]
   public async Task<ActionResult<SpecificationHandoff>> CreateSpecificationHandoff(SpecificationHandoff specificationHandoff)
    {
        // Add project to database and save changes
        _context.specificationHandoffs.Add(specificationHandoff);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSpecificationHandoffById), new { id = specificationHandoff.id }, specificationHandoff);
    }

    // HTTP Put replaces project with a new project object
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateSpecificationHandoff(int id, SpecificationHandoff specificationHandoffUpdated)
    {
        // Check the ID matches the project ID
        if (id != specificationHandoffUpdated.id)
        {
            return NotFound(new { message = "Handoff not found" });
        }

        // Update the project in the database and save changes
        _context.Entry(specificationHandoffUpdated).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        // Return confirmation of project being updated
        return Ok(new { message = "Handoff updated" });
    }

    // HTTP Delete will remove a project from the database
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSpecificationHandoff(int id)
    {
        // Find the project by ID
        var project = await _context.specificationHandoffs.FindAsync(id);

        // If project does not exist return 404 not found
        if (project == null)
        {
            return NotFound(new { message = "Handoff not found" });
        }

        // Remove project and save changes
        _context.specificationHandoffs.Remove(project);
        await _context.SaveChangesAsync();

        // Return message confirming deletion of project
        return Ok(new { message = "Handoff Deleted" });
    }
}
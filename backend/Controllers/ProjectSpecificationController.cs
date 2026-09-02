using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Data;
using Firecrest.Api.Models;

namespace Firecrest.Controllers;

// What the url is going to look like, admin/projectspecifications is so only admins can access this part of the system
[Route("admin/projectspecifications")]
[ApiController]
public class ProjectSpecificationsController : ControllerBase
{
    // Read context in database
    private readonly FirecrestDbContext _context;

    // Initialize the controller with database context
   public ProjectSpecificationsController(FirecrestDbContext context)
   {
       _context = context;
   }

    // Get all project specifications from the database returned in list
   [HttpGet]
   public async Task<ActionResult<IEnumerable<ProjectSpecification>>> GetProjectSpecifications()
   {
       return await _context.projectSpecifications.ToListAsync();
   }

    // Get project specification searched via ID and return error 404 if id does not exist
   [HttpGet("{id}")]
   public async Task<ActionResult<ProjectSpecification>> GetProjectSpecificationById(int id)
   {
       var projectSpecification = await _context.projectSpecifications
           .SingleOrDefaultAsync(existingProjectSpecification => existingProjectSpecification.id == id);

       if (projectSpecification == null)
       {
           return NotFound(new { message = "Project specification not found" });
       }
       return projectSpecification;
   }

    // HTTP Post allows the creation of a new project specification in the database
   [HttpPost]
   public async Task<ActionResult<ProjectSpecification>> CreateProjectSpecification(ProjectSpecification projectSpecification)
    {
        // Check the project the specification is being assigned to exists in the database
        var project = await _context.projects.FindAsync(projectSpecification.project_id);
        if (project == null)
        {
            // Return 404 project not found if project does not exist
            return NotFound(new { message = "Project not found" });
        }

        // Add project to database and save changes
        _context.projects.Add(project);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProjectSpecificationById), new { id = projectSpecification.id }, projectSpecification);
    }

    // HTTP Put replaces project with a new project object
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateProjectSpecification(int id, ProjectSpecification projectSpecificationUpdated)
    {
        // Check the ID matches the project specification ID
        if (id != projectSpecificationUpdated.id)
        {
            return NotFound(new { message = "Project specification not found" });
        }

        // Update the project specification in the database and save changes
        _context.Entry(projectSpecificationUpdated).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        // Return confirmation of project specification being updated
        return Ok(new { message = "Project specification updated" });
    }

    // HTTP Patch endpoint updates project by ID by modifying them instead of replacing
    [HttpPatch("{id}")]
    public async Task<ActionResult> PatchProjectSpecification(int id, ProjectSpecification projectSpecificationUpdated)
    {
        // Check the ID matches the project specification ID
        if (id != projectSpecificationUpdated.id)
        {
            return NotFound(new { message = "Project specification not found" });
        }

        // Update the project specification in the database and save changes
        _context.Entry(projectSpecificationUpdated).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        // Return confirmation of project specification being updated
        return Ok(new { message = "Project specification updated" });
    }

    // HTTP Delete will remove a project from the database
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteProjectSpecification(int id)
    {
        // Find the project specification by ID
        var projectSpecification = await _context.projectSpecifications.FindAsync(id);

        // If project specification does not exist return 404 not found
        if (projectSpecification == null)
        {
            return NotFound(new { message = "Project specification not found" });
        }

        // Remove project specification and save changes
        _context.projectSpecifications.Remove(projectSpecification);
        await _context.SaveChangesAsync();

        // Return message confirming deletion of project specification
        return Ok(new { message = "Project Deleted" });
    }
}
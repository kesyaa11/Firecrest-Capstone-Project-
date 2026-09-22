using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Data;
using Firecrest.Api.Models;

namespace Firecrest.Controllers;

// What the url is going to look like, admin/projects is so only admins can access this part of the system
[Route("admin/projects")]
[ApiController]
public class ProjectsController : ControllerBase
{
    // Read context in database
    private readonly FirecrestDbContext _context;

    // Initialize the controller with database context
   public ProjectsController(FirecrestDbContext context)
   {
       _context = context;
   }

    // Get all projects from the database returned in list
   [HttpGet]
   public async Task<ActionResult<IEnumerable<Project>>> GetProjects()
   {
       return await _context.projects.ToListAsync();
   }

    // Get project searched via ID and return error 404 project not found if id does not exist with a project
   [HttpGet("{id}")]
   public async Task<ActionResult<Project>> GetProjectById(int id)
   {
       var project = await _context.projects
           .SingleOrDefaultAsync(existingProject => existingProject.id == id);

       if (project == null)
       {
           return NotFound(new { message = "Project not found" });
       }
       
       return project;
   }

    // HTTP Post allows the creation of a new project in the database
   [HttpPost]
   public async Task<ActionResult<Project>> CreateProject(Project project)
    {
        // Add project to database and save changes
        _context.projects.Add(project);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProjectById), new { id = project.id }, project);
    }

    // HTTP PUT replaces an existing project with a new one
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateProject(int id, Project projectUpdated)
    {
        // Check the ID matches the project ID
        if (id != projectUpdated.id)
        {
            return NotFound(new { message = "Project not found" });
        }

        // Update the project in the database and save changes
        _context.Entry(projectUpdated).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        // Return confirmation of project being updated
        return Ok(new { message = "Project updated" });
    }

    // HTTP Delete will remove a project from the database
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteProject(int id)
    {
        // Find the project by ID
        var project = await _context.projects.FindAsync(id);

        // If project does not exist return 404 not found
        if (project == null)
        {
            return NotFound(new { message = "Project not found" });
        }

        // Remove project and save changes
        _context.projects.Remove(project);
        await _context.SaveChangesAsync();

        // Return message confirming deletion of project
        return Ok(new { message = "Project Deleted" });
    }
}
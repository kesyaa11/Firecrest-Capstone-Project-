using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Data;
using Firecrest.Api.Models;

namespace Firecrest.Controllers;

// What the url is going to look like, admin/specificationusers is so only admins can access this part of the system
[Route("admin/specificationusers")]
[ApiController]
public class SpecificationUsersController : ControllerBase
{
    // Read context in database
    private readonly FirecrestDbContext _context;

    // Initialize the controller with database context
    public SpecificationUsersController(FirecrestDbContext context)
    {
        _context = context;
    }

    // Get all projects and specification that have users assigned from the database returned in list
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SpecificationUsers>>> GetSpecificationUsers()
    {
        return await _context.specificationUsers.ToListAsync();
    }

    // Get the project / specification that has a user assigned, searched via ID and return error 404 project not found if id does not exist
    [HttpGet("{id}")]
    public async Task<ActionResult<SpecificationUsers>> GetSpecificationUserById(int id)
    {
        var specificationUser = await _context.specificationUsers.FindAsync(id);

        if (specificationUser == null)
        {
            return NotFound(new { message = "Can't find project / specification with user assigned" });
        }

        return specificationUser;
    }

    // HTTP Post allows the creation of a user to be assigned to a project / specification in the database
    [HttpPost]
    public async Task<ActionResult<SpecificationUsers>> CreateSpecificationUser(SpecificationUsers specificationUser)
    {
        // Add to database and save
        _context.specificationUsers.Add(specificationUser);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSpecificationUserById), new { id = specificationUser.id }, specificationUser);
    }

    // Update the current table using the ID of the project / specification with a user assigned
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateSpecificationUser(int id, SpecificationUsers specificationUserUpdated)
    {
        // Check the ID is valid
        if (id != specificationUserUpdated.id)
        {
            return NotFound(new { message = "Specification user assignment not found" });
        }

        // Update the table
        _context.Entry(specificationUserUpdated).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        // Return confirmation of update
        return Ok(new { message = "Specification user assignment updated" });
    }

    // Delete the table entry from the database
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSpecificationUser(int id)
    {
        var specificationUser = await _context.specificationUsers.FindAsync(id);

        if (specificationUser == null)
        {
            return NotFound(new { message = "Specification user assignment not found" });
        }

        _context.specificationUsers.Remove(specificationUser);
        await _context.SaveChangesAsync();

        // Return confirmation of deletion
        return Ok(new { message = "Specification user assignment deleted" });
    }
}
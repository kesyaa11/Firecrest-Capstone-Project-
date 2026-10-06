using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Data;
using Firecrest.Api.Models;

namespace Firecrest.Controllers;

[Route("admin/specification-change-requests")]
[ApiController]
public class SpecificationChangeRequestsController : ControllerBase
{
    private readonly FirecrestDbContext _context;

    public SpecificationChangeRequestsController(FirecrestDbContext context)
    {
        _context = context;
    }

    // Get all specification change requests
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SpecificationChangeRequest>>> GetSpecificationChangeRequests()
    {
        return await _context.specificationChangeRequests.ToListAsync();
    }

    // Get a specification change request by ID
    [HttpGet("{id}")]
    public async Task<ActionResult<SpecificationChangeRequest>> GetSpecificationChangeRequestById(int id)
    {
        var changeRequest = await _context.specificationChangeRequests
            .SingleOrDefaultAsync(existingRequest => existingRequest.id == id);

        if (changeRequest == null)
        {
            return NotFound(new
            {
                message = "Specification change request not found"
            });
        }

        return changeRequest;
    }

    // Create a new specification change request
    [HttpPost]
    public async Task<ActionResult<SpecificationChangeRequest>> CreateSpecificationChangeRequest(
        SpecificationChangeRequest changeRequest)
    {
        _context.specificationChangeRequests.Add(changeRequest);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetSpecificationChangeRequestById),
            new { changeRequest.id },
            changeRequest
        );
    }

    // Update an existing specification change request
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateSpecificationChangeRequest(
        int id,
        SpecificationChangeRequest changeRequestUpdated)
    {
        var existingRequest = await _context.specificationChangeRequests
            .SingleOrDefaultAsync(request => request.id == id);

        if (existingRequest == null)
        {
            return NotFound(new
            {
                message = "Specification change request not found"
            });
        }

        existingRequest.resolved = changeRequestUpdated.resolved;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Specification change request updated"
        });
    }

    // Delete a specification change request
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSpecificationChangeRequest(int id)
    {
        var changeRequest = await _context.specificationChangeRequests
            .SingleOrDefaultAsync(existingRequest => existingRequest.id == id);

        if (changeRequest == null)
        {
            return NotFound(new
            {
                message = "Specification change request not found"
            });
        }

        _context.specificationChangeRequests.Remove(changeRequest);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Specification change request deleted"
        });
    }
}
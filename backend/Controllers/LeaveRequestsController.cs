using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Data;
using Firecrest.Api.Models;

namespace Firecrest.Controllers;

// What the url is going to look like, admin/leave-requests is so only admins can access this part of the system
[Route("admin/leave-requests")]
[ApiController]
public class LeaveRequestsController : ControllerBase
{
    // Read context in database
    private readonly FirecrestDbContext _context;

    // Initialize the controller with database context
   public LeaveRequestsController(FirecrestDbContext context)
   {
       _context = context;
   }

    // Get all leave requests from the database returned in list
   [HttpGet]
   public async Task<ActionResult<IEnumerable<LeaveRequest>>> GetLeaveRequests()
   {
       return await _context.leaveRequests.ToListAsync();
   }

    // Get leave request searched via ID and return error 404 leave request not found if id does not exist with a leave request
   [HttpGet("{id}")]
   public async Task<ActionResult<LeaveRequest>> GetLeaveRequestById(int id)
   {
       var leaveRequest = await _context.leaveRequests
           .SingleOrDefaultAsync(existingLeaveRequest => existingLeaveRequest.id == id);

       if (leaveRequest == null)
       {
           return NotFound(new { message = "Leave request not found" });
       }
       return leaveRequest;
   }

    // HTTP Post allows the creation of a new leave request in the database
   [HttpPost]
   public async Task<ActionResult<LeaveRequest>> CreateLeaveRequest(LeaveRequest leaveRequest)
    {
        // Check the user the leave request is being assigned to exists in the database
        var user = await _context.users.FindAsync(leaveRequest.user_id);
        if (user == null)
        {
            // Return 404 user not found if user does not exist
            return NotFound(new { message = "User not found" });
        }

        // Add leave request to database and save changes
        _context.leaveRequests.Add(leaveRequest);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetLeaveRequestById), new { id = leaveRequest.id }, leaveRequest);
    }

    // HTTP Put replaces leave request with a new leave request object
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateLeaveRequest(int id, LeaveRequest leaveRequestUpdated)
    {
        // Check the ID matches the leave request ID
        if (id != leaveRequestUpdated.id)
        {
            return NotFound(new { message = "Leave request not found" });
        }

        // Update the leave request in the database and save changes
        _context.Entry(leaveRequestUpdated).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        // Return confirmation of leave request being updated
        return Ok(new { message = "Leave request updated" });
    }

    // HTTP Delete will remove a leave request from the database
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteLeaveRequest(int id)
    {
        // Find the leave request by ID
        var leaveRequest = await _context.leaveRequests.FindAsync(id);

        // If leave request does not exist return 404 not found
        if (leaveRequest == null)
        {
            return NotFound(new { message = "Leave request not found" });
        }

        // Remove leave request and save changes
        _context.leaveRequests.Remove(leaveRequest);
        await _context.SaveChangesAsync();

        // Return message confirming deletion of leave request
        return Ok(new { message = "Leave Request Deleted" });
    }
}
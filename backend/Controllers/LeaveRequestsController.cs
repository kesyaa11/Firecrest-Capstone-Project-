using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Firecrest.Api.Services;

namespace Firecrest.Api.Controllers;

// What the url is going to look like, admin/leave-requests is so only admins can access this part of the system
[Route("admin/leave-requests")]
[ApiController]
public class LeaveRequestsController(FirecrestDbContext context, LeaveBalanceService leaveBalanceService) : ControllerBase
{
    private static readonly string[] ValidStatuses = ["Pending", "Approved", "Rejected"];
    private static readonly string[] ValidLeaveTypes = ["Annual Leave", "Sick Leave", "Personal Leave"];

    // Read context in database
    private readonly FirecrestDbContext _context = context;
    private readonly LeaveBalanceService _leaveBalanceService = leaveBalanceService;

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
            return NotFound(new { message = "ILeave request not found" });
        }
        return leaveRequest;
    }

    // HTTP Post allows the creation of a new leave request in the database
    [HttpPost]
    public async Task<ActionResult<LeaveRequest>> CreateLeaveRequest(LeaveRequest leaveRequest)
    {
        var validationResult = await ValidateLeaveRequest(leaveRequest);
        if (validationResult != null) return validationResult;

        // Add leave request to database and save changes, deducting the balance if it is already approved
        _context.leaveRequests.Add(leaveRequest);
        await _leaveBalanceService.ApplyChangeAsync(null, leaveRequest);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetLeaveRequestById), new { leaveRequest.id }, leaveRequest);
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

        var existingLeaveRequest = await _context.leaveRequests.FindAsync(id);
        if (existingLeaveRequest == null)
        {
            return NotFound(new { message = "Leave request not found" });
        }

        var validationResult = await ValidateLeaveRequest(leaveRequestUpdated);
        if (validationResult != null) return validationResult;

        // Update the leave request in the database and save changes
        var before = (LeaveRequest)_context.Entry(existingLeaveRequest).OriginalValues.ToObject();
        _context.Entry(existingLeaveRequest).CurrentValues.SetValues(leaveRequestUpdated);
        await _leaveBalanceService.ApplyChangeAsync(before, existingLeaveRequest);
        await _context.SaveChangesAsync();

        // Return confirmation of leave request being updated
        return Ok(new { message = "Leave request updated" });
    }

    // HTTP Patch endpoint updates leave request by ID by modifying them instead of replacing
    [HttpPatch("{id}")]
    public async Task<ActionResult> PatchLeaveRequest(int id, LeaveRequestPatchRequest patch)
    {
        var leaveRequest = await _context.leaveRequests.FindAsync(id);
        if (leaveRequest == null)
        {
            return NotFound(new { message = "Leave request not found" });
        }

        // Apply only supplied values and leave all other fields unchanged.
        if (patch.user_id.HasValue) leaveRequest.user_id = patch.user_id.Value;
        if (patch.approver_id.HasValue) leaveRequest.approver_id = patch.approver_id.Value;
        if (patch.start_date.HasValue) leaveRequest.start_date = patch.start_date.Value;
        if (patch.end_date.HasValue) leaveRequest.end_date = patch.end_date.Value;
        if (patch.leave_type != null) leaveRequest.leave_type = patch.leave_type;
        if (patch.status != null) leaveRequest.status = patch.status;

        // Validate the complete result after applying the supplied changes.
        var validationResult = await ValidateLeaveRequest(leaveRequest);
        if (validationResult != null) return validationResult;

        var before = (LeaveRequest)_context.Entry(leaveRequest).OriginalValues.ToObject();
        await _leaveBalanceService.ApplyChangeAsync(before, leaveRequest);
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

        // Remove leave request and save changes, giving back any approved leave
        await _leaveBalanceService.ApplyChangeAsync(leaveRequest, null);
        _context.leaveRequests.Remove(leaveRequest);
        await _context.SaveChangesAsync();

        // Return message confirming deletion of leave request
        return Ok(new { message = "Leave Request Deleted" });
    }

    private async Task<ActionResult?> ValidateLeaveRequest(LeaveRequest leaveRequest)
    {
        if (!await _context.users.AnyAsync(user => user.id == leaveRequest.user_id))
            return NotFound(new { message = "User not found" });

        if (!await _context.users.AnyAsync(user => user.id == leaveRequest.approver_id))
            return NotFound(new { message = "Approver not found" });

        if (leaveRequest.start_date == default || leaveRequest.end_date == default)
            return BadRequest(new { message = "Leave start and end dates are required" });

        if (leaveRequest.start_date > leaveRequest.end_date)
            return BadRequest(new { message = "Leave start date must not be after leave end date" });

        if (!ValidStatuses.Contains(leaveRequest.status))
            return BadRequest(new { message = "Invalid leave status" });

        if (!ValidLeaveTypes.Contains(leaveRequest.leave_type))
            return BadRequest(new { message = "Invalid leave type" });

        return null;
    }

    // Nullable properties allow PATCH requests to contain only the fields being changed.
    public sealed class LeaveRequestPatchRequest
    {
        public int? user_id { get; set; }
        public int? approver_id { get; set; }
        public DateOnly? start_date { get; set; }
        public DateOnly? end_date { get; set; }
        public string? leave_type { get; set; }
        public string? status { get; set; }
    }
}

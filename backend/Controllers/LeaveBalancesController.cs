using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Data;
using Firecrest.Api.Models;

namespace Firecrest.Api.Controllers;

// Leave balances are stored values, approved leave is not deducted automatically
[Route("admin/leave-balances")]
[ApiController]
public class LeaveBalancesController : ControllerBase
{
    private readonly FirecrestDbContext _context;

    public LeaveBalancesController(FirecrestDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LeaveBalance>>> GetLeaveBalances()
    {
        return await _context.leaveBalances.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<LeaveBalance>> GetLeaveBalanceById(int id)
    {
        var leaveBalance = await _context.leaveBalances.FindAsync(id);
        return leaveBalance == null ? NotFound(new { message = "Leave balance not found" }) : leaveBalance;
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<LeaveBalance>> GetLeaveBalanceForUser(int userId)
    {
        var leaveBalance = await _context.leaveBalances
            .SingleOrDefaultAsync(balance => balance.user_id == userId);

        return leaveBalance == null ? NotFound(new { message = "Leave balance not found" }) : leaveBalance;
    }

    [HttpPost]
    public async Task<ActionResult<LeaveBalance>> CreateLeaveBalance(LeaveBalance leaveBalance)
    {
        if (!await _context.users.AnyAsync(user => user.id == leaveBalance.user_id))
            return NotFound(new { message = "User not found" });

        // Each user has a single leave balance record
        if (await _context.leaveBalances.AnyAsync(balance => balance.user_id == leaveBalance.user_id))
            return Conflict(new { message = "User already has a leave balance" });

        _context.leaveBalances.Add(leaveBalance);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetLeaveBalanceById), new { id = leaveBalance.id }, leaveBalance);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateLeaveBalance(int id, LeaveBalance leaveBalanceUpdated)
    {
        if (id != leaveBalanceUpdated.id)
            return BadRequest(new { message = "The route ID must match the leave balance ID" });

        var existingLeaveBalance = await _context.leaveBalances.FindAsync(id);
        if (existingLeaveBalance == null) return NotFound(new { message = "Leave balance not found" });

        // A balance stays with the user it was created for
        if (existingLeaveBalance.user_id != leaveBalanceUpdated.user_id)
            return BadRequest(new { message = "Leave balance user cannot be changed" });

        _context.Entry(existingLeaveBalance).CurrentValues.SetValues(leaveBalanceUpdated);
        await _context.SaveChangesAsync();
        return Ok(existingLeaveBalance);
    }
}

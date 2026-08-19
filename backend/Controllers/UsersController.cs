using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Data;
using Firecrest.Api.Models;

namespace Firecrest.Controllers;

// What the url is going to look like, admin/users is so only admins can access this part of the system
[Route("admin/users")]
[ApiController]
public class UsersController : ControllerBase
{
    // Read context in database
   private readonly FirecrestDbContext _context;

    // Initialize the controller with database context
   public UsersController(FirecrestDbContext context)
   {
       _context = context;
   }

    // Get all users from the database returned in list
   [HttpGet]
   public async Task<ActionResult<IEnumerable<User>>> GetUsers()
   {
       return await _context.users.ToListAsync();
   }

    // Get user searched via ID and return error 404 user not found if id does not exist with a user
   [HttpGet("{id}")]
   public async Task<ActionResult<User>> GetUserById(int id)
   {
       var user = await _context.users.FindAsync(id);
       if (user == null)
       {
           return NotFound(new { message = "User not found"});
       }
       return user;
   }

    // HTTP Post allows the creation of a new user in the database
   [HttpPost]
   public async Task<ActionResult<User>> CreateUser(User user)
    {
        _context.users.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUserById), new { id = user.id }, user);
    }

    // HTTP Put replaces user with a new user object
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateUser(int id, User userUpdated)
    {
        return Ok(new { message = "Not implemented yet" });
    }

    // HTTP Patch endpoint updates user by ID by modifying them instead of replacing
    [HttpPatch("{id}")]
    public async Task<ActionResult> PatchUser(int id, User userUpdated)
    {
        return Ok(new { message = "Not implemented yet" });
    }

    // HTTP Delete will remove a user from the database
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteUser(int id)
    {
        // Find the user by ID
        var user = await _context.users.FindAsync(id);

        // If user does not exist return 404 not found
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        // Remove user and save changes
        _context.users.Remove(user);
        await _context.SaveChangesAsync();

        // Return message confirming deletion of user
        return Ok(new { message = "User Deleted" });
    }
}
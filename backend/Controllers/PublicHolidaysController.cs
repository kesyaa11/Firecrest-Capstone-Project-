using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Data;
using Firecrest.Api.Models;

namespace Firecrest.Controllers;

// What the url is going to look like, admin/publicholidays is so only admins can access this part of the system
[Route("admin/publicholidays")]
[ApiController]
public class PublicHolidaysController : ControllerBase
{
    // Read context from database
    private readonly FirecrestDbContext _context;

    // Initialize the controller with database context
    public PublicHolidaysController(FirecrestDbContext context)
    {
        _context = context;
    }
}
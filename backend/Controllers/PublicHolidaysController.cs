using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Firecrest.Api.Services;

namespace Firecrest.Controllers;

// What the url is going to look like, admin/publicholidays is so only admins can access this part of the system
[Route("admin/publicholidays")]
[ApiController]
public class PublicHolidaysController : ControllerBase
{
    // Read context from database
    private readonly FirecrestDbContext _context;
    private readonly PublicHolidaySync _publicHolidaySync;

    // Initialize the controller with database context
    public PublicHolidaysController(FirecrestDbContext context, PublicHolidaySync publicHolidaySync)
    {
        _context = context;
        _publicHolidaySync = publicHolidaySync;
    }

    // Sync Public Holidays for given year and country
    [HttpPost("sync/{year}/{country}")]
    public async Task<IActionResult> SyncPublicHolidays(int year, string country)
    {
        await _publicHolidaySync.SyncPublicHolidays(
            HttpContext.RequestServices.GetRequiredService<IHttpClientFactory>(), 
            year, 
            country);

        return Ok($"Public holidays for {country} in {year} have been synced successfully.");
    }

    // Get all public holidays in database
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PublicHoliday>>> GetPublicHolidays()
    {
        // Get all public holidays from the database
        return await _context.publicHolidays.ToListAsync();
    }

    // Get specific public holiday by id
    [HttpGet("{id}")]
    public async Task<ActionResult<PublicHoliday>> GetPublicHoliday(int id)
    {
        // Get the public holiday from the database by id
        var publicHoliday = await _context.publicHolidays.FindAsync(id);

        // If the public holiday doesn't exist return not found
        if (publicHoliday == null)
        {
            return NotFound();
        }

        // Return the public holiday
        return publicHoliday;
    }

    // Get public holiday by country code
    [HttpGet("country/{country}")]
    public async Task<ActionResult<IEnumerable<PublicHoliday>>> GetPublicHolidaysByCountry(string country)
    {
        // Get all public holidays from the database by country code
        var publicHolidays = await _context.publicHolidays
            .Where(h => h.country == country)
            .ToListAsync();

        // If no public holidays found for the country code return not found
        if (publicHolidays.Count == 0)
        {
            return NotFound();
        }

        // Return the public holidays
        return publicHolidays;
    }

    // Get all public holidays by country and date
    [HttpGet("country/{country}/date/{date}")]
    public async Task<ActionResult<IEnumerable<PublicHoliday>>> GetPublicHolidaysByCountryAndDate(string country, DateOnly date)
    {
        // Get all public holidays from the database by country code and date
        var publicHolidays = await _context.publicHolidays
            .Where(h => h.country == country && h.date == date)
            .ToListAsync();

        // If no public holidays found for the country code and date return not found
        if (publicHolidays.Count == 0)
        {
            return NotFound();
        }

        // Return the public holidays
        return publicHolidays;
    }
}
using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Firecrest.Api.Services;

public class PublicHolidaySync
{
    // Database Context gives context to what's in the database
    private readonly FirecrestDbContext _context;

    public PublicHolidaySync(FirecrestDbContext context)
    {
        _context = context;
    }

    // Sync public holidays from Nager API to database for NZ and Philippines
    public async Task SyncPublicHolidays(IHttpClientFactory httpClientFactory, int year, string country)
    {
        // Create the client configed in Program.cs for Nager Holiday API
        var client = httpClientFactory.CreateClient("NagerAPI");

        // Get response from Nager API for given country code and year
        var response = await client.GetAsync($"{year}/{country}");

        // Check if the response was successful or not
        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"Failed to fetch public holidays for {country} in {year}. Status code: {response.StatusCode}");
        }

        // Get response from Nager Holidays API
        var nagerHolidays = await response.Content.ReadFromJsonAsync<List<NagerHoliday>>();

        // Check if the response is valid
        if (nagerHolidays == null)
        {
            throw new Exception($"Failed to deserialize public holidays for {country} in {year}.");
        }

        // If the response is valid loop through the holidays adding to the database
        foreach (var nagerHoliday in nagerHolidays)
        {
            // Check for already existing holiday in the database as to not duplicate
            var holiday = await _context.publicHolidays
                .FirstOrDefaultAsync(existing =>
                existing.date == nagerHoliday.Date && 
                existing.country == nagerHoliday.CountryCode &&
                existing.name == nagerHoliday.Name);

            // If the holiday is new then add it to the database
            if (holiday == null)
            {
                holiday = new PublicHoliday
                {
                    name = nagerHoliday.Name,
                    date = nagerHoliday.Date,
                    country = nagerHoliday.CountryCode,
                    is_national = nagerHoliday.Global ? true : false,
                    regions = nagerHoliday.Counties ?? new List<string>()
                };

                _context.publicHolidays.Add(holiday);
            }

            // If it already exists then update the existing holiday with the new data
            else
            {
                holiday.name = nagerHoliday.Name;
                holiday.date = nagerHoliday.Date;
                holiday.country = nagerHoliday.CountryCode;
                holiday.is_national = nagerHoliday.Global ? true : false;
                holiday.regions = nagerHoliday.Counties ?? new List<string>();
            }
        }

        // Save changes to the database
        await _context.SaveChangesAsync();
    }
}
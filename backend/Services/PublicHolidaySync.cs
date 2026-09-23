using System.Net.Http.Json;
using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Microsoft.EntityFrameworkCore;

public class PublicHolidaySync
{
    // Sync public holidays from Nager API to database for NZ and Philippines
    public static async Task SyncPublicHolidays(IHttpClientFactory httpClientFactory, int year, string countryCode)
    {
        // Create the client configed in Program.cs for Nager Holiday API
        var client = httpClientFactory.CreateClient("NagerAPI");

        // Get response from Nager API for given country code and year
        var response = await client.GetAsync($"/{year}/{countryCode}");

        // Check if the response was successful or not
        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"Failed to fetch public holidays for {countryCode} in {year}. Status code: {response.StatusCode}");
        }
    }
}
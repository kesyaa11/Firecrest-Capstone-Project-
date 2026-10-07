using Firecrest.Api.Services;
using Firecrest.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Firecrest.Api.Services;

public class HeartbeatService : BackgroundService
{
    private readonly ILogger<HeartbeatService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public HeartbeatService(ILogger<HeartbeatService> logger, IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var timer = new PeriodicTimer(TimeSpan.FromDays(7));

        // Run the heartbeat on startup
        await DoWorkAsync();

        // Run the heartbeat every 7 days as indicated by timer
        while (!stoppingToken.IsCancellationRequested
               && await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                _logger.LogInformation("Heartbeat: {Time}", DateTime.UtcNow);
                await DoWorkAsync();
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Heartbeat failed");
            }
        }
    }

    private async Task DoWorkAsync()
    {
        // Try except to catch exceptions and log to console
        try
        {
            // Create a scope to get the PublicHolidaySync Service and the HTTPClientFactory service
            using var scope = _scopeFactory.CreateScope();
            var publicHolidaySync = scope.ServiceProvider.GetRequiredService<PublicHolidaySync>();
            var _httpClientFactory = scope.ServiceProvider.GetRequiredService<IHttpClientFactory>();

            // Get the database context so we can find old holidays and delete them
            var dbContext = scope.ServiceProvider.GetRequiredService<FirecrestDbContext>();

            // Remove holidays from years that are no longer needed after March.
            if (DateTime.UtcNow.Date.Month > 3)
            {
                // Find all holidays before the start of this year and store in list
                var currentYearStart = new DateOnly(DateTime.UtcNow.Date.Year, 1, 1);
                var previousHolidays = await dbContext.publicHolidays
                    .Where(holiday => holiday.date < currentYearStart)
                    .ToListAsync();

                // If there are holidays found before this current year remove them
                if (previousHolidays.Count > 0)
                {
                    dbContext.publicHolidays.RemoveRange(previousHolidays);
                    await dbContext.SaveChangesAsync();
                    _logger.LogInformation(
                        "Deleted {Count} public holidays from years before {Year}.",
                        previousHolidays.Count,
                        DateTime.UtcNow.Date.Year);
                }
            }

            // Get user's country codes from the database and sync for each unique country code
            var countryCodes = await dbContext.users
                .Select(user => user.country)
                .Distinct()
                .ToListAsync();

            // Go through the list of country codes and sync each public holiday for them current year and next year
            foreach (var countryCode in countryCodes)
            {
                await publicHolidaySync.SyncPublicHolidays(_httpClientFactory, DateTime.UtcNow.Date.Year, countryCode);
                await publicHolidaySync.SyncPublicHolidays(_httpClientFactory, DateTime.UtcNow.Date.Year + 1, countryCode);
                _logger.LogInformation("Public Holidays synced Successfully for {countryCode}", countryCode);
            }
        }
        
        catch (Exception ex)
        {
            _logger.LogError(ex, "Heartbeat failed");
        }
    }
}
using Firecrest.Api.Services;

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

            // Await the sync of public holidays for NZ for current year and next year
            await publicHolidaySync.SyncPublicHolidays(_httpClientFactory, DateTime.UtcNow.Year, "NZ");
            await publicHolidaySync.SyncPublicHolidays(_httpClientFactory, DateTime.UtcNow.Year + 1, "NZ");

            // Await the sync of public holidays for PH for current year and next year
            await publicHolidaySync.SyncPublicHolidays(_httpClientFactory, DateTime.UtcNow.Year, "PH");
            await publicHolidaySync.SyncPublicHolidays(_httpClientFactory, DateTime.UtcNow.Year + 1, "PH");

            _logger.LogInformation("Public Holidays synced Successfully");
        }
        
        catch (Exception ex)
        {
            _logger.LogError(ex, "Heartbeat failed");
        }
    }
}
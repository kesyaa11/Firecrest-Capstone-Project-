using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Firecrest.Api.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace Firecrest.Tests;

[TestFixture]
public class FortnightHoursServiceTests
{
    private FirecrestDbContext _context = null!;
    private FortnightHoursService _service = null!;
    private readonly DateOnly _periodStart = new(2026, 9, 14);

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<FirecrestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new FirecrestDbContext(options);
        _service = new FortnightHoursService(_context);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Test]
    public async Task CalculateAsync_ShiftOnDay1_IsIncluded()
    {
        await AddShift(1, _periodStart, 8, 10);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(2m);
    }

    [Test]
    public async Task CalculateAsync_ShiftOnDay14_IsIncluded()
    {
        await AddShift(1, _periodStart.AddDays(13), 8, 10);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(2m);
        result.period_end.Should().Be(_periodStart.AddDays(13));
    }

    [Test]
    public async Task CalculateAsync_ShiftOnDay15_IsExcluded()
    {
        await AddShift(1, _periodStart.AddDays(14), 8, 10);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(0m);
    }

    [Test]
    public async Task CalculateAsync_ShiftBeforePeriod_IsExcluded()
    {
        await AddShift(1, _periodStart.AddDays(-1), 8, 10);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(0m);
    }

    [Test]
    public async Task CalculateAsync_OtherEmployeesShifts_AreExcluded()
    {
        await AddShift(2, _periodStart, 8, 10);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(0m);
    }

    [Test]
    public async Task CalculateAsync_ShiftsAcrossBothWeeks_AreSummed()
    {
        await AddShift(1, _periodStart.AddDays(1), 8, 10);
        await AddShift(1, _periodStart.AddDays(8), 10, 12);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(4m);
    }

    [Test]
    public async Task CalculateAsync_NoShifts_ReturnsZero()
    {
        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(0m);
    }

    [Test]
    public async Task CalculateAsync_MultipleShiftsOnOneDay_AreSummed()
    {
        await AddShift(1, _periodStart, 8, 10);
        await AddShift(1, _periodStart, 10, 12);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(4m);
    }

    [Test]
    public async Task CalculateAsync_UsesStartAndEndInsteadOfStoredDuration()
    {
        await AddShift(1, _periodStart, 8, 10, duration: 99);

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(2m);
    }

    [Test]
    public async Task CalculateAsync_WorkTypeDoesNotAffectResult()
    {
        await AddShift(1, _periodStart, 8, 10, workType: "Testing");
        await AddShift(1, _periodStart.AddDays(1), 8, 10, workType: "Meeting");

        var result = await _service.CalculateAsync(1, _periodStart);

        result.raw_hours.Should().Be(4m);
    }

    private async Task AddShift(
        int userId,
        DateOnly date,
        int startHour,
        int endHour,
        int? duration = 2,
        string workType = "Development")
    {
        _context.shifts.Add(new Shift
        {
            user_id = userId,
            date = date,
            shift_start = TimeSpan.FromHours(startHour),
            shift_end = TimeSpan.FromHours(endHour),
            duration = duration,
            work_type = workType
        });

        await _context.SaveChangesAsync();
    }
}

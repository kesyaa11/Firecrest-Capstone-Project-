using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Firecrest.Api.Services;
using Firecrest.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Firecrest.Tests;

[TestFixture]
public class HoursControllerTests
{
    private FirecrestDbContext _context = null!;
    private HoursController _controller = null!;
    private readonly DateOnly _periodStart = new(2026, 9, 15);

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<FirecrestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new FirecrestDbContext(options);
        _controller = new HoursController(_context, new FortnightHoursService(_context));

        _context.users.AddRange(
            new User { id = 1, name = "First User", role = "Dev", country = "NZ" },
            new User { id = 2, name = "Second User", role = "SD", country = "PH" });
        _context.shifts.Add(new Shift
        {
            user_id = 2,
            date = _periodStart,
            shift_start = TimeSpan.FromHours(8),
            shift_end = TimeSpan.FromHours(10),
            work_type = "Development"
        });
        _context.SaveChanges();
    }

    [TearDown]
    public void TearDown()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Test]
    public async Task GetFortnightHoursForAllUsers_ReturnsOneResultPerUser()
    {
        var result = await _controller.GetFortnightHoursForAllUsers(_periodStart);

        var results = result.Value!.ToList();
        results.Select(r => r.user_id).Should().Equal(1, 2);
        results[0].raw_hours.Should().Be(0m);
        results[1].raw_hours.Should().Be(2m);
        results[1].complete_sprints.Should().Be(1);
    }

    [Test]
    public async Task GetFortnightHoursForAllUsers_MissingPeriodStart_ReturnsBadRequest()
    {
        var result = await _controller.GetFortnightHoursForAllUsers(null);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Test]
    public async Task GetFortnightHours_PeriodStartNotTuesday_ReturnsBadRequest()
    {
        var monday = _periodStart.AddDays(-1);

        var single = await _controller.GetFortnightHours(1, monday);
        var all = await _controller.GetFortnightHoursForAllUsers(monday);

        single.Result.Should().BeOfType<BadRequestObjectResult>();
        all.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Test]
    public async Task GetFortnightHours_TuesdayStart_ReturnsResult()
    {
        var result = await _controller.GetFortnightHours(2, _periodStart);

        result.Value!.period_start.Should().Be(_periodStart);
        result.Value.period_end.Should().Be(_periodStart.AddDays(13));
        result.Value.raw_hours.Should().Be(2m);
    }

    [Test]
    public async Task GetFortnightHours_UnknownUser_ReturnsNotFound()
    {
        var result = await _controller.GetFortnightHours(42, _periodStart);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }
}

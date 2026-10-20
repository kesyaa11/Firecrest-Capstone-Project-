using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Firecrest.Api.Services;
using Firecrest.Api.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Tests;

[TestFixture]
public class ShiftsControllerTests
{
    private FirecrestDbContext _context = null!;
    private ShiftsController _controller = null!;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<FirecrestDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

        _context = new FirecrestDbContext(options);
        _controller = new ShiftsController(
            _context,
            new SchedulingEngine(_context));
    }

    [TearDown]
    public void TearDown()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    // ****** Test Cases for Shifts Controller, below are the expected cases *******

    // Test creating a shift should show a shift created
    [Test]
    public async Task CreateShift()
    {
        await SeedData();

        var result = await _controller.CreateShift(new Shift
        {
            id = 2,
            user_id = 1,
            date = new DateOnly(2026, 10, 17),
            shift_start = new TimeSpan(8, 0, 0),
            shift_end = new TimeSpan(16, 0, 0),
            work_type = "Development",
            slot_number = 2
        });

        var createdShift = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;

        createdShift.Value.Should().BeOfType<Shift>();
        _context.shifts.Should().ContainSingle(shift => shift.id == 2);
        _context.shifts.Single(shift => shift.id == 2).date.Should().Be(new DateOnly(2026, 10, 17));
    }

    // This test will test the GetShifts function in ShiftsController, should return a list of all shifts in the system
    [Test]
    public async Task GetAllShifts()
    {
        await SeedData();

        var result = await _controller.GetShifts();

        result.Value.Should().NotBeNull();
        result.Value.Should().BeOfType<List<Shift>>();
    }

    // Test GetShiftById should return singular shift
    [Test]
    public async Task GetShiftViaID()
    {
        await SeedData();

        var result = await _controller.GetShiftById(1);

        result.Value.Should().NotBeNull();
        result.Value.Should().BeOfType<Shift>();
        result.Value!.id.Should().Be(1);
    }

    // Try updating a shift should return updated shift
    [Test]
    public async Task UpdateShift()
    {
        await SeedData();

        var updatedShift = new Shift
        {
            id = 1,
            user_id = 1,
            date = new DateOnly(2026, 10, 20),
            slot_number = 1,
            shift_start = new TimeSpan(9, 0, 0),
            shift_end = new TimeSpan(11, 0, 0),
            work_type = "Testing"
        };

        var result = await _controller.UpdateShift(1, updatedShift);

        result.Should().BeOfType<OkObjectResult>();
        _context.shifts.Single().work_type.Should().Be("Testing");
        _context.shifts.Single().date.Should().Be(new DateOnly(2026, 10, 20));
    }

    // Try deleting a shift should not return anything
    [Test]
    public async Task DeleteShift()
    {
        await SeedData();

        var result = await _controller.DeleteShift(1);

        result.Should().BeOfType<OkObjectResult>();
        _context.shifts.Should().BeEmpty();
    }

    // ********************************** Boundary Tests *************************************************

    // Create Shift Boundary Test: Create a shift that overlaps with an existing shift
    // public async Task CreateShift_Overlapping()
    // {
    //     await SeedData();

    //     var overlappingShift = new Shift
    //     {
    //         id = 3,

    //     };
    // }


    // Unexpected Testing should return bad request


    // Seed Data for testing data that requires a shift already created
    private async Task SeedData()
    {
        // Create a user to associate with shift
        var user = new User
        {
            id = 1,
            name = "Test User",
            role = "Dev",
            country = "NZ",
            region = "NZ-MWT",
            team = "Test Team",
            is_active = true
        };

        var shift = new Shift
        {
            id = 1,
            user_id = 1,
            date = new DateOnly(2026, 10, 16),
            shift_start = new TimeSpan(8, 0, 0),
            shift_end = new TimeSpan(10, 0, 0),
            work_type = "Development",
            slot_number = 1
        };

        await _context.users.AddAsync(user);
        await _context.shifts.AddAsync(shift);
        await _context.SaveChangesAsync();
    }
}
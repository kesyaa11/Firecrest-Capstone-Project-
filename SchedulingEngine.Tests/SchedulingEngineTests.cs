using NUnit.Framework;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Firecrest.Api.Services;


namespace Firecrest.Tests;

[TestFixture]
public class SchedulingEngineTests
{
    private FirecrestDbContext _context = null!;
    private SchedulingEngine _engine = null!;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<FirecrestDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

        _context = new FirecrestDbContext(options);
        _engine = new SchedulingEngine(_context);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [TestCase(null, TestName = "Slot number is null -> Invalid shift slot")]
    [TestCase(0, TestName = "Slot number is 0 -> Invalid shift slot")]
    [TestCase(5, TestName = "Slot number is 5 -> Invalid shift slot")]
    public async Task ValidateShift_InvalidSlotNumber_ReturnsErrorMessage(int? slotNumber)
    {
        // Arrange
        var shift = new Shift
        {
            user_id = 1,
            work_type = "Development",
            slot_number = slotNumber,
            shift_start = TimeSpan.FromHours(8),  // 08:00:00
            shift_end = TimeSpan.FromHours(10)   // 10:00:00
        };

        // Act
        var result = await _engine.ValidateShift(shift);

        // Assert
        result.Should().Be("Invalid shift slot");
    }

    [Test]
    public async Task ValidateShift_ThreeHourShift_IsAllowed()
    {
        // Arrange
        var shift = new Shift
        {
            user_id = 1,
            work_type = "Development",
            slot_number = 1,
            shift_start = TimeSpan.FromHours(8),
            shift_end = TimeSpan.FromHours(11) // 3 hours duration
        };

        // Act
        var result = await _engine.ValidateShift(shift);

        // Assert
        result.Should().BeNull();
        shift.duration.Should().Be(3);
    }

    [Test]
    public async Task ValidateShift_PartHourShift_IsAllowedWithoutRoundingDuration()
    {
        // Arrange
        var shift = new Shift
        {
            user_id = 1,
            work_type = "Development",
            slot_number = 1,
            shift_start = TimeSpan.FromHours(8),
            shift_end = TimeSpan.FromHours(10.5) // 2.5 hours duration
        };

        // Act
        var result = await _engine.ValidateShift(shift);

        // Assert
        result.Should().BeNull();
        shift.duration.Should().BeNull();
    }

    [Test]
    public async Task ValidateShift_MissingTimes_ReturnsErrorMessage()
    {
        // Arrange
        var shift = new Shift
        {
            user_id = 1,
            work_type = "Development",
            slot_number = 1,
            shift_start = TimeSpan.FromHours(8)
        };

        // Act
        var result = await _engine.ValidateShift(shift);

        // Assert
        result.Should().Be("Shift start and end times are required");
    }

    [TestCase(10, 8, TestName = "End before start -> Shift must end after it starts")]
    [TestCase(8, 8, TestName = "End equal to start -> Shift must end after it starts")]
    public async Task ValidateShift_EndNotAfterStart_ReturnsErrorMessage(int startHour, int endHour)
    {
        // Arrange
        var shift = new Shift
        {
            user_id = 1,
            work_type = "Development",
            slot_number = 1,
            shift_start = TimeSpan.FromHours(startHour),
            shift_end = TimeSpan.FromHours(endHour)
        };

        // Act
        var result = await _engine.ValidateShift(shift);

        // Assert
        result.Should().Be("Shift must end after it starts");
    }

    [Test]
    public async Task ValidateShift_DuplicateShift_ReturnsErrorMessage()
    {
        // Arrange
        var shiftDate = DateOnly.FromDateTime(DateTime.Today);

        _context.shifts.Add(new Shift
        {
            id = 1,
            user_id = 1,
            work_type = "Development",
            date = shiftDate,
            shift_start = TimeSpan.FromHours(8),
            shift_end = TimeSpan.FromHours(10)
        });
        await _context.SaveChangesAsync();

        var duplicateShift = new Shift
        {
            user_id = 1,
            work_type = "Testing",
            date = shiftDate,
            slot_number = 1,
            shift_start = TimeSpan.FromHours(8),
            shift_end = TimeSpan.FromHours(10)
        };

        // Act
        var result = await _engine.ValidateShift(duplicateShift);

        // Assert
        result.Should().Be("Shift already exists for this user at this time");
    }

    [Test]
    public async Task ValidateShift_LongerShiftOverlappingExisting_ReturnsErrorMessage()
    {
        // Arrange
        var shiftDate = DateOnly.FromDateTime(DateTime.Today);

        _context.shifts.Add(new Shift
        {
            id = 1,
            user_id = 1,
            work_type = "Development",
            date = shiftDate,
            shift_start = TimeSpan.FromHours(10.5),
            shift_end = TimeSpan.FromHours(12.5)
        });
        await _context.SaveChangesAsync();

        // 08:00 to 11:00 runs into the existing 10:30 shift
        var longShift = new Shift
        {
            user_id = 1,
            work_type = "Development",
            date = shiftDate,
            slot_number = 1,
            shift_start = TimeSpan.FromHours(8),
            shift_end = TimeSpan.FromHours(11)
        };

        // Act
        var result = await _engine.ValidateShift(longShift);

        // Assert
        result.Should().Be("Shift overlaps with an existing shift for this user");
    }

    [Test]
    public async Task ValidateShift_UserOnApprovedLeave_ReturnsErrorMessage()
    {
        // Arrange
        var shiftDate = DateOnly.FromDateTime(DateTime.Today);

        _context.leaveRequests.Add(new LeaveRequest
        {
            user_id = 1,
            status = "Approved",
            leave_type = "Annual Leave",
            start_date = shiftDate.AddDays(-1),
            end_date = shiftDate.AddDays(1)
        });
        await _context.SaveChangesAsync();

        var shift = new Shift
        {
            user_id = 1,
            work_type = "Development",
            slot_number = 1,
            date = shiftDate,
            shift_start = TimeSpan.FromHours(8),
            shift_end = TimeSpan.FromHours(10)
        };

        // Act
        var result = await _engine.ValidateShift(shift);

        // Assert
        result.Should().Be("User is on approved leave for this date");
    }

    [Test]
    public async Task ValidateShift_OverlappingTimes_ReturnsErrorMessage()
    {
        // Arrange
        var shiftDate = DateOnly.FromDateTime(DateTime.Today);

        // Existing shift in DB: 8:00 AM to 10:00 AM
        _context.shifts.Add(new Shift
        {
            id = 1,
            user_id = 1,
            work_type = "Development",
            date = shiftDate,
            shift_start = TimeSpan.FromHours(8),
            shift_end = TimeSpan.FromHours(10)
        });
        await _context.SaveChangesAsync();

        // New shift attempting to be scheduled: 9:00 AM to 11:00 AM
        var overlappingShift = new Shift
        {
            user_id = 1,
            work_type = "Development",
            date = shiftDate,
            slot_number = 2,
            shift_start = TimeSpan.FromHours(9),
            shift_end = TimeSpan.FromHours(11)
        };

        // Act
        var result = await _engine.ValidateShift(overlappingShift);

        // Assert
        result.Should().Be("Shift overlaps with an existing shift for this user");
    }

    [Test]
    public async Task ValidateShift_MoreThan3ShiftsPerDay_ReturnsErrorMessage()
    {
        // Arrange
        var shiftDate = DateOnly.FromDateTime(DateTime.Today);

        // Seed 3 existing shifts for user 1 on this day
        _context.shifts.AddRange(
            new Shift { id = 1, user_id = 1, work_type = "Development", date = shiftDate, shift_start = TimeSpan.FromHours(8), shift_end = TimeSpan.FromHours(10) },
            new Shift { id = 2, user_id = 1, work_type = "Development", date = shiftDate, shift_start = TimeSpan.FromHours(10), shift_end = TimeSpan.FromHours(12) },
            new Shift { id = 3, user_id = 1, work_type = "Development", date = shiftDate, shift_start = TimeSpan.FromHours(12), shift_end = TimeSpan.FromHours(14) }
        );
        await _context.SaveChangesAsync();

        // Attempt to add a 4th shift
        var fourthShift = new Shift
        {
            user_id = 1,
            work_type = "Development",
            date = shiftDate,
            slot_number = 4,
            shift_start = TimeSpan.FromHours(14),
            shift_end = TimeSpan.FromHours(16)
        };

        // Act
        var result = await _engine.ValidateShift(fourthShift);

        // Assert
        result.Should().Be("User cannot have more than 3 shifts per day");
    }

    [Test]
    public async Task ValidateShift_ValidShift_ReturnsNullAndPopulatesProperties()
    {
        // Arrange
        var shiftDate = DateOnly.FromDateTime(DateTime.Today);
        var validShift = new Shift
        {
            user_id = 1,
            work_type = "Development",
            date = shiftDate,
            slot_number = 1,
            shift_start = TimeSpan.FromHours(8),
            shift_end = TimeSpan.FromHours(10)
        };

        // Act
        var result = await _engine.ValidateShift(validShift);

        // Assert
        result.Should().BeNull();
        validShift.duration.Should().Be(2);
        validShift.shifts_count.Should().Be(1);
    }

}





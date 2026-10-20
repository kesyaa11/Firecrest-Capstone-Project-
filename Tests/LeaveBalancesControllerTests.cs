using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Firecrest.Api.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Tests;

[TestFixture]
public class LeaveBalancesControllerTests
{
    private FirecrestDbContext _context = null!;
    private LeaveBalancesController _controller = null!;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<FirecrestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new FirecrestDbContext(options);
        _controller = new LeaveBalancesController(_context);

        _context.users.Add(new User { id = 1, name = "Test User", role = "Dev", country = "NZ", region = "NZ-WGN" });
        _context.SaveChanges();
    }

    [TearDown]
    public void TearDown()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Test]
    public async Task GetLeaveBalanceForUser_ExistingBalance_ReturnsBalance()
    {
        await _controller.CreateLeaveBalance(NewBalance(1));

        var result = await _controller.GetLeaveBalanceForUser(1);

        result.Value.Should().NotBeNull();
        result.Value!.user_id.Should().Be(1);
        result.Value.al_outstanding.Should().Be(7.5m);
    }

    [Test]
    public async Task GetLeaveBalanceForUser_NoBalance_ReturnsNotFound()
    {
        var result = await _controller.GetLeaveBalanceForUser(1);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Test]
    public async Task CreateLeaveBalance_UnknownUser_ReturnsNotFound()
    {
        var result = await _controller.CreateLeaveBalance(NewBalance(42));

        result.Result.Should().BeOfType<NotFoundObjectResult>();
        _context.leaveBalances.Should().BeEmpty();
    }

    [Test]
    public async Task CreateLeaveBalance_SecondBalanceForUser_ReturnsConflict()
    {
        await _controller.CreateLeaveBalance(NewBalance(1));

        var result = await _controller.CreateLeaveBalance(NewBalance(1));

        result.Result.Should().BeOfType<ConflictObjectResult>();
        _context.leaveBalances.Should().HaveCount(1);
    }

    [Test]
    public async Task UpdateLeaveBalance_ValidChange_SavesValues()
    {
        await _controller.CreateLeaveBalance(NewBalance(1));
        var id = _context.leaveBalances.Single().id;

        var updated = NewBalance(1);
        updated.id = id;
        updated.sick_days = 3;

        var result = await _controller.UpdateLeaveBalance(id, updated);

        result.Should().BeOfType<OkObjectResult>();
        _context.leaveBalances.Single().sick_days.Should().Be(3);
    }

    [Test]
    public async Task UpdateLeaveBalance_ChangingUser_ReturnsBadRequest()
    {
        _context.users.Add(new User { id = 2, name = "Other User", role = "SD", country = "PH", region = "PH-AUR" });
        await _context.SaveChangesAsync();
        await _controller.CreateLeaveBalance(NewBalance(1));
        var id = _context.leaveBalances.Single().id;

        var updated = NewBalance(2);
        updated.id = id;

        var result = await _controller.UpdateLeaveBalance(id, updated);

        result.Should().BeOfType<BadRequestObjectResult>();
        _context.leaveBalances.Single().user_id.Should().Be(1);
    }

    private static LeaveBalance NewBalance(int userId) => new()
    {
        user_id = userId,
        sick_days = 5,
        al_accured = 10m,
        al_taken_accured = 2.5m,
        al_outstanding = 7.5m,
        annual_owing = 0m,
        alternative_days = 1
    };
}

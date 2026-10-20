using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Firecrest.Api.Services;
using Firecrest.Api.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Tests;

[TestFixture]
public class LeaveBalanceUpdateTests
{
    private FirecrestDbContext _context = null!;
    private LeaveRequestsController _controller = null!;

    // Tuesday and Wednesday, a two day request
    private readonly DateOnly _start = new(2026, 10, 13);
    private readonly DateOnly _end = new(2026, 10, 14);

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<FirecrestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new FirecrestDbContext(options);
        _controller = new LeaveRequestsController(_context, new LeaveBalanceService(_context));

        _context.users.AddRange(
            new User { id = 1, name = "Employee", role = "Dev", country = "NZ" },
            new User { id = 2, name = "Manager", role = "Manager", country = "NZ" });
        _context.leaveBalances.Add(new LeaveBalance
        {
            id = 1,
            user_id = 1,
            sick_days = 10,
            al_accured = 80m,
            al_taken_accured = 0m,
            al_outstanding = 80m,
            annual_owing = 0m,
            alternative_days = 2
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
    public async Task Create_PendingLeave_DoesNotDeduct()
    {
        await Create("Annual Leave", "Pending");

        AssertAnnual(outstanding: 80m, taken: 0m);
    }

    [Test]
    public async Task Create_RejectedLeave_DoesNotDeduct()
    {
        await Create("Annual Leave", "Rejected");

        AssertAnnual(outstanding: 80m, taken: 0m);
    }

    [Test]
    public async Task Create_ApprovedAnnualLeave_DeductsEightHoursPerDay()
    {
        await Create("Annual Leave", "Approved");

        AssertAnnual(outstanding: 64m, taken: 16m);
    }

    [Test]
    public async Task Patch_PendingToApproved_DeductsOnce()
    {
        var id = await Create("Annual Leave", "Pending");

        await Patch(id, "Approved");

        AssertAnnual(outstanding: 64m, taken: 16m);
    }

    [Test]
    public async Task Patch_ApprovedAgain_DoesNotDeductTwice()
    {
        var id = await Create("Annual Leave", "Pending");

        await Patch(id, "Approved");
        await Patch(id, "Approved");

        AssertAnnual(outstanding: 64m, taken: 16m);
    }

    [Test]
    public async Task Put_ApprovedRequestSavedAgain_DoesNotDeductTwice()
    {
        var id = await Create("Annual Leave", "Approved");

        var result = await _controller.UpdateLeaveRequest(id, Request("Annual Leave", "Approved", id));

        result.Should().BeOfType<OkObjectResult>();
        AssertAnnual(outstanding: 64m, taken: 16m);
    }

    [TestCase("Rejected")]
    [TestCase("Pending")]
    public async Task Patch_ApprovedToNotApproved_GivesLeaveBack(string newStatus)
    {
        var id = await Create("Annual Leave", "Pending");
        await Patch(id, "Approved");

        await Patch(id, newStatus);

        AssertAnnual(outstanding: 80m, taken: 0m);
    }

    [Test]
    public async Task Delete_ApprovedLeave_GivesLeaveBack()
    {
        var id = await Create("Annual Leave", "Approved");

        await _controller.DeleteLeaveRequest(id);

        AssertAnnual(outstanding: 80m, taken: 0m);
    }

    [Test]
    public async Task Delete_PendingLeave_DoesNotChangeBalance()
    {
        var id = await Create("Annual Leave", "Pending");

        await _controller.DeleteLeaveRequest(id);

        AssertAnnual(outstanding: 80m, taken: 0m);
    }

    [Test]
    public async Task Put_ApprovedLeaveExtended_DeductsOnlyTheDifference()
    {
        var id = await Create("Annual Leave", "Approved");

        var extended = Request("Annual Leave", "Approved", id);
        extended.end_date = _end.AddDays(1);
        await _controller.UpdateLeaveRequest(id, extended);

        AssertAnnual(outstanding: 56m, taken: 24m);
    }

    [Test]
    public async Task Put_ApprovedLeaveTypeChanged_MovesDeductionToNewType()
    {
        var id = await Create("Annual Leave", "Approved");

        await _controller.UpdateLeaveRequest(id, Request("Sick Leave", "Approved", id));

        AssertAnnual(outstanding: 80m, taken: 0m);
        Balance().sick_days.Should().Be(8);
    }

    [Test]
    public async Task Create_ApprovedSickLeave_DeductsSickDays()
    {
        await Create("Sick Leave", "Approved");

        Balance().sick_days.Should().Be(8);
        AssertAnnual(outstanding: 80m, taken: 0m);
    }

    [Test]
    public async Task Create_ApprovedPersonalLeave_LeavesBalanceUnchanged()
    {
        await Create("Personal Leave", "Approved");

        var balance = Balance();
        AssertAnnual(outstanding: 80m, taken: 0m);
        balance.sick_days.Should().Be(10);
        balance.alternative_days.Should().Be(2);
        balance.annual_owing.Should().Be(0m);
        balance.al_accured.Should().Be(80m);
    }

    [Test]
    public async Task Create_ApprovedWeekendLeave_CountsWeekendDays()
    {
        // Saturday and Sunday
        var request = Request("Annual Leave", "Approved");
        request.start_date = new DateOnly(2026, 10, 17);
        request.end_date = new DateOnly(2026, 10, 18);

        await _controller.CreateLeaveRequest(request);

        AssertAnnual(outstanding: 64m, taken: 16m);
    }

    [Test]
    public async Task Patch_InvalidStatus_LeavesBalanceUnchanged()
    {
        var id = await Create("Annual Leave", "Approved");

        var result = await _controller.PatchLeaveRequest(id, new LeaveRequestsController.LeaveRequestPatchRequest { status = "Maybe" });

        result.Should().BeOfType<BadRequestObjectResult>();
        AssertAnnual(outstanding: 64m, taken: 16m);
    }

    [Test]
    public async Task Approve_UserWithoutBalance_StillSucceeds()
    {
        var request = Request("Annual Leave", "Approved");
        request.user_id = 2;

        var result = await _controller.CreateLeaveRequest(request);

        result.Result.Should().BeOfType<CreatedAtActionResult>();
        AssertAnnual(outstanding: 80m, taken: 0m);
    }

    [Test]
    public async Task Create_OverlappingApprovedLeave_DeductsSharedDateOnce()
    {
        await Create("Annual Leave", "Approved");

        // Wednesday again plus Thursday, only Thursday is new
        var overlapping = Request("Annual Leave", "Approved");
        overlapping.start_date = _end;
        overlapping.end_date = _end.AddDays(1);
        await _controller.CreateLeaveRequest(overlapping);

        AssertAnnual(outstanding: 56m, taken: 24m);
    }

    [Test]
    public async Task Patch_RejectOneOfOverlappingRequests_GivesBackOnlyItsOwnDates()
    {
        await Create("Annual Leave", "Approved");

        var overlapping = Request("Annual Leave", "Approved");
        overlapping.start_date = _end;
        overlapping.end_date = _end.AddDays(1);
        var created = (LeaveRequest)((CreatedAtActionResult)(await _controller.CreateLeaveRequest(overlapping)).Result!).Value!;

        await Patch(created.id, "Rejected");

        AssertAnnual(outstanding: 64m, taken: 16m);
    }

    [Test]
    public async Task Create_IdenticalApprovedRequests_DeductOnce()
    {
        await Create("Annual Leave", "Approved");
        await Create("Annual Leave", "Approved");

        AssertAnnual(outstanding: 64m, taken: 16m);
    }

    [Test]
    public async Task Create_OverlapWithDifferentLeaveType_EarliestRequestTypeIsUsed()
    {
        await Create("Annual Leave", "Approved");

        var sick = Request("Sick Leave", "Approved");
        sick.start_date = _end;
        sick.end_date = _end.AddDays(1);
        await _controller.CreateLeaveRequest(sick);

        // Wednesday stays annual leave, only Thursday is sick leave
        AssertAnnual(outstanding: 64m, taken: 16m);
        Balance().sick_days.Should().Be(9);
    }

    private async Task<int> Create(string leaveType, string status)
    {
        var result = await _controller.CreateLeaveRequest(Request(leaveType, status));
        var created = (LeaveRequest)((CreatedAtActionResult)result.Result!).Value!;
        return created.id;
    }

    private async Task Patch(int id, string status)
    {
        var result = await _controller.PatchLeaveRequest(id, new LeaveRequestsController.LeaveRequestPatchRequest { status = status });
        result.Should().BeOfType<OkObjectResult>();
    }

    private LeaveRequest Request(string leaveType, string status, int id = 0) => new()
    {
        id = id,
        user_id = 1,
        approver_id = 2,
        start_date = _start,
        end_date = _end,
        leave_type = leaveType,
        status = status
    };

    private LeaveBalance Balance() => _context.leaveBalances.AsNoTracking().Single(balance => balance.id == 1);

    private void AssertAnnual(decimal outstanding, decimal taken)
    {
        var balance = Balance();
        balance.al_outstanding.Should().Be(outstanding);
        balance.al_taken_accured.Should().Be(taken);
    }
}

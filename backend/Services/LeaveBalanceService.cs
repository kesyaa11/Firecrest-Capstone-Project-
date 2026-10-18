using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Firecrest.Api.Services;

// Keeps leave balances in step with approved leave requests.
// A balance is treated as already reflecting every currently Approved request. When a request
// changes, the user's approved leave before the change is given back and the approved leave after
// the change is deducted, so only the difference is applied. Saving an Approved request again
// changes nothing, and dates covered by more than one approved request are only deducted once
// (counted against the earliest request, the same as the fortnight report).
// Changes are made to tracked entities and the caller saves them together with the leave request.
public class LeaveBalanceService(FirecrestDbContext context)
{
    private readonly FirecrestDbContext _context = context;

    // before is the request as currently saved (null when creating),
    // after is the request as it will be saved (null when deleting)
    public async Task ApplyChangeAsync(LeaveRequest? before, LeaveRequest? after)
    {
        var changedId = before?.id ?? after!.id;
        var userIds = new[] { before?.user_id, after?.user_id }.OfType<int>().Distinct();

        foreach (var userId in userIds)
        {
            var balance = await _context.leaveBalances
                .Where(existing => existing.user_id == userId)
                .OrderBy(existing => existing.id)
                .FirstOrDefaultAsync();

            // Users without a balance record have nothing to update
            if (balance == null) continue;

            var otherApproved = await _context.leaveRequests
                .AsNoTracking()
                .Where(request =>
                    request.user_id == userId &&
                    request.status == "Approved" &&
                    request.id != changedId)
                .ToListAsync();

            ApplyCoverage(balance, otherApproved.Concat(ApprovedFor(before, userId)), giveBack: true);
            ApplyCoverage(balance, otherApproved.Concat(ApprovedFor(after, userId)), giveBack: false);
        }
    }

    private static IEnumerable<LeaveRequest> ApprovedFor(LeaveRequest? request, int userId)
    {
        return request != null && request.status == "Approved" && request.user_id == userId
            ? [request]
            : [];
    }

    // Deducts (or gives back) every approved leave date once, using the earliest request's leave type
    private static void ApplyCoverage(LeaveBalance balance, IEnumerable<LeaveRequest> approved, bool giveBack)
    {
        var countedDates = new HashSet<DateOnly>();

        // A request that has not been saved yet has no real id, so it is ordered last
        var ordered = approved
            .OrderBy(request => request.start_date)
            .ThenBy(request => request.id > 0 ? request.id : int.MaxValue);

        foreach (var request in ordered)
        {
            var days = 0;
            for (var date = request.start_date; date <= request.end_date; date = date.AddDays(1))
            {
                if (countedDates.Add(date)) days++;
            }

            ApplyToBalance(balance, request.leave_type, giveBack ? -days : days);
        }
    }

    // Prototype mapping from leave type to leave_balance fields, to be confirmed with the manager/client.
    // Every calendar day of the request counts, weekends and public holidays included.
    //   Annual Leave   - hours (1 day = 8 hours), added to al_taken_accured and taken off al_outstanding
    //   Sick Leave     - taken off sick_days, which is a whole-day column so it is counted in days
    //   Personal Leave - no matching balance field, so the balance is not changed
    // days is positive to deduct leave and negative to give it back.
    public static void ApplyToBalance(LeaveBalance balance, string leaveType, int days)
    {
        switch (leaveType)
        {
            case "Annual Leave":
                var hours = days * FortnightHoursService.LeaveHoursPerDay;
                balance.al_taken_accured += hours;
                balance.al_outstanding -= hours;
                break;

            case "Sick Leave":
                balance.sick_days -= days;
                break;
        }
    }
}

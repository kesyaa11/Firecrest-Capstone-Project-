using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Firecrest.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace Firecrest.Api.Auth;

// Decides whether a signed in caller may run a write (POST, PUT, PATCH, DELETE) on a controller.
// It runs before the action, reads the record being changed from the database without tracking it,
// and checks the caller against the record and against every ID in the request body. The client
// never proves ownership: the caller always comes from the validated token.
// Anything not listed here is denied.
public class WriteAuthorizer
{
    // Controllers with write endpoints that have a rule, a new one is denied until it is added here
    public static readonly string[] CoveredControllers =
    {
        "Users", "LeaveRequests", "LeaveBalances", "Shifts", "PublicHolidays", "SpecificationHandoffs",
        "HandoffSignoff", "Projects", "ProjectSpecifications", "SpecificationDevDays", "SpecificationUsers",
        "HandoffDelays", "SpecificationChangeRequests"
    };

    private readonly FirecrestDbContext _db;
    private readonly CallerResolver _resolver;

    public WriteAuthorizer(FirecrestDbContext db, CallerResolver resolver)
    {
        _db = db;
        _resolver = resolver;
    }

    // Returns null when the write is allowed, otherwise the reason it is denied
    public async Task<string?> CheckAsync(string controller, string httpMethod, ActionExecutingContext context, Caller caller)
    {
        var args = context.ActionArguments;
        int? routeId = args.TryGetValue("id", out var id) && id is int parsedId ? parsedId : null;
        var isCreate = HttpMethods.IsPost(httpMethod);

        // A client may not choose the primary key of a new record
        if (isCreate && args.Values.Any(HasClientChosenId))
        {
            return "id_not_allowed";
        }

        return controller switch
        {
            "Users" => await CheckUsersAsync(caller, httpMethod, routeId, args),
            "LeaveRequests" => await CheckLeaveRequestsAsync(caller, httpMethod, routeId, args),
            "LeaveBalances" => await CheckLeaveBalancesAsync(caller, routeId, args),
            "Shifts" => await CheckShiftsAsync(caller, httpMethod, routeId, args),
            "SpecificationHandoffs" => await CheckHandoffsAsync(caller, httpMethod, routeId, args),
            "HandoffSignoff" => await CheckSignoffsAsync(caller, httpMethod, routeId, args),

            // Public holidays feed payroll for everyone, so only an admin may re-sync them
            "PublicHolidays" => caller.IsAdmin ? null : "admin_only",

            // Projects, specifications, assignments and change requests follow the handoff screens
            "Projects" => await CheckProjectsAsync(caller, httpMethod, routeId, args),
            "ProjectSpecifications" => CheckSpecifications(caller, httpMethod),
            "SpecificationUsers" => caller.Role is AppRoles.ServiceDelivery or AppRoles.Manager ? null : "sd_or_manager_only",
            "SpecificationChangeRequests" => await CheckChangeRequestsAsync(caller, httpMethod, routeId, args),

            // Dev days and delays are only managed by managers
            "SpecificationDevDays" or "HandoffDelays" => caller.Role == AppRoles.Manager ? null : "manager_only",

            _ => "write_not_permitted"
        };
    }

    private static bool HasClientChosenId(object? body)
    {
        var property = body?.GetType().GetProperty("id");
        return property?.PropertyType == typeof(int) && (int)property.GetValue(body)! != 0;
    }

    private static T? Body<T>(IDictionary<string, object?> args) where T : class
    {
        return args.Values.OfType<T>().FirstOrDefault();
    }

    private static bool IsRole(string? stored, params string[] roles)
    {
        return stored != null && roles.Any(role => stored.Trim().Equals(role, StringComparison.OrdinalIgnoreCase));
    }

    // ----- Users -----

    // Admins run user administration. A manager may only manage the developers and SD staff who
    // report to them, and nobody can change their own role or manager.
    private async Task<string?> CheckUsersAsync(Caller caller, string httpMethod, int? routeId, IDictionary<string, object?> args)
    {
        if (caller.IsAdmin) return null;
        if (caller.Role != AppRoles.Manager || caller.EmployeeId == null) return "user_administration_not_permitted";
        var me = caller.EmployeeId.Value;

        // A manager can only hand out the staff roles, with themselves as the manager
        bool IsManagedStaff(User user) => IsRole(user.role, "Dev", "Developer", "SD") && user.manager_id == me;

        if (HttpMethods.IsPost(httpMethod))
        {
            var created = Body<User>(args);
            return created != null && IsManagedStaff(created) ? null : "manager_can_only_add_own_staff";
        }

        if (routeId == null) return "write_not_permitted";
        var existing = await _db.users.AsNoTracking().SingleOrDefaultAsync(user => user.id == routeId);
        if (existing == null) return null;

        // Only direct reports can be changed or removed, never the manager's own record
        if (existing.id == me || existing.manager_id != me) return "not_your_direct_report";

        if (HttpMethods.IsPut(httpMethod))
        {
            var updated = Body<User>(args);
            if (updated == null || updated.id != existing.id || !IsManagedStaff(updated)) return "manager_can_only_edit_own_staff";
        }

        return null;
    }

    // ----- Leave requests -----

    private async Task<string?> CheckLeaveRequestsAsync(Caller caller, string httpMethod, int? routeId, IDictionary<string, object?> args)
    {
        if (caller.IsAdmin || caller.EmployeeId == null) return "leave_not_permitted_for_admin";
        var me = caller.EmployeeId.Value;
        var reports = (await _resolver.GetReadableEmployeeIdsAsync(caller)).Where(employee => employee != me).ToList();

        if (HttpMethods.IsPost(httpMethod))
        {
            var created = Body<LeaveRequest>(args);
            if (created == null) return "write_not_permitted";

            // Developers and SD staff request their own leave, pending, addressed to their own manager.
            // Leave for managers has no approver above them yet, so it is not allowed.
            if (caller.Role == AppRoles.Manager) return "manager_leave_not_defined";
            if (created.user_id != me) return "leave_for_another_employee";
            if (created.status != "Pending") return "new_leave_must_be_pending";
            if (caller.ManagerId == null || created.approver_id != caller.ManagerId) return "approver_must_be_your_manager";
            return null;
        }

        if (routeId == null) return "write_not_permitted";
        var existing = await _db.leaveRequests.AsNoTracking().SingleOrDefaultAsync(leave => leave.id == routeId);
        if (existing == null) return null;

        var isOwner = existing.user_id == me;
        var isManagerOfEmployee = caller.Role == AppRoles.Manager && reports.Contains(existing.user_id);

        if (HttpMethods.IsDelete(httpMethod))
        {
            // Employees cancel their own pending requests, managers can remove their reports' requests
            if (isOwner && existing.status == "Pending") return null;
            return isManagerOfEmployee ? null : "leave_delete_not_permitted";
        }

        // PUT and PATCH: only the employee or their manager may touch a request at all
        if (!isOwner && !isManagerOfEmployee) return "not_your_leave_request";

        // Work out what would actually change, a value sent unchanged is not a change
        string? newStatus;
        bool onlyStatusChanges;
        if (HttpMethods.IsPut(httpMethod))
        {
            var replacement = Body<LeaveRequest>(args);
            if (replacement == null || replacement.id != existing.id) return "write_not_permitted";
            newStatus = replacement.status;
            onlyStatusChanges = replacement.user_id == existing.user_id
                && replacement.approver_id == existing.approver_id
                && replacement.start_date == existing.start_date
                && replacement.end_date == existing.end_date
                && replacement.leave_type == existing.leave_type;
        }
        else
        {
            var patch = Body<LeaveRequestsController.LeaveRequestPatchRequest>(args);
            if (patch == null) return "write_not_permitted";
            newStatus = patch.status ?? existing.status;
            onlyStatusChanges = (patch.user_id ?? existing.user_id) == existing.user_id
                && (patch.approver_id ?? existing.approver_id) == existing.approver_id
                && (patch.start_date ?? existing.start_date) == existing.start_date
                && (patch.end_date ?? existing.end_date) == existing.end_date
                && (patch.leave_type ?? existing.leave_type) == existing.leave_type;
        }

        // The only edit anyone may make is a decision on the request, by the employee's own manager.
        // That also stops a manager approving their own leave, and any change of owner or approver.
        if (!onlyStatusChanges) return "leave_details_cannot_be_changed";
        if (newStatus == existing.status) return null;
        return isManagerOfEmployee ? null : "only_the_employees_manager_can_decide";
    }

    // ----- Leave balances -----

    // Balances are payroll data: a manager sets them for their direct reports, never for themselves
    private async Task<string?> CheckLeaveBalancesAsync(Caller caller, int? routeId, IDictionary<string, object?> args)
    {
        if (caller.Role != AppRoles.Manager || caller.EmployeeId == null) return "manager_only";
        var me = caller.EmployeeId.Value;
        var reports = (await _resolver.GetReadableEmployeeIdsAsync(caller)).Where(employee => employee != me).ToList();

        var body = Body<LeaveBalance>(args);
        if (body == null || !reports.Contains(body.user_id)) return "not_your_direct_report";

        if (routeId != null)
        {
            var existing = await _db.leaveBalances.AsNoTracking().SingleOrDefaultAsync(balance => balance.id == routeId);
            if (existing != null && !reports.Contains(existing.user_id)) return "not_your_direct_report";
        }

        return null;
    }

    // ----- Scheduling -----

    // Managers schedule themselves and their direct reports, including when moving a shift to someone else
    private async Task<string?> CheckShiftsAsync(Caller caller, string httpMethod, int? routeId, IDictionary<string, object?> args)
    {
        if (caller.Role != AppRoles.Manager || caller.EmployeeId == null) return "manager_only";
        var scope = await _resolver.GetReadableEmployeeIdsAsync(caller);

        if (HttpMethods.IsPost(httpMethod))
        {
            var created = Body<Shift>(args);
            return created != null && scope.Contains(created.user_id) ? null : "not_your_team";
        }

        if (routeId != null)
        {
            var existing = await _db.shifts.AsNoTracking().SingleOrDefaultAsync(shift => shift.id == routeId);
            if (existing != null && !scope.Contains(existing.user_id)) return "not_your_team";
        }

        var replacement = Body<Shift>(args);
        if (replacement != null && !scope.Contains(replacement.user_id)) return "not_your_team";

        var patch = Body<ShiftsController.ShiftPatchRequest>(args);
        if (patch?.user_id != null && !scope.Contains(patch.user_id.Value)) return "not_your_team";

        return null;
    }

    // ----- Module B projects, specifications and change requests -----

    // SD staff create client projects and milestones, managers can do everything. The admin reuses the
    // manager project view and may only switch a project between active and inactive.
    private async Task<string?> CheckProjectsAsync(Caller caller, string httpMethod, int? routeId, IDictionary<string, object?> args)
    {
        if (HttpMethods.IsPost(httpMethod))
        {
            return caller.Role is AppRoles.ServiceDelivery or AppRoles.Manager ? null : "sd_or_manager_only";
        }

        if (HttpMethods.IsDelete(httpMethod))
        {
            return caller.Role == AppRoles.Manager ? null : "manager_only";
        }

        if (caller.Role == AppRoles.Manager) return null;
        if (!caller.IsAdmin) return "manager_or_admin_only";

        var updated = Body<Project>(args);
        if (updated == null || routeId == null) return "write_not_permitted";
        var existing = await _db.projects.AsNoTracking().SingleOrDefaultAsync(project => project.id == routeId);
        if (existing == null) return null;

        var onlyActiveFlagChanges = updated.id == existing.id
            && updated.name == existing.name
            && updated.client == existing.client
            && updated.tracker_ref == existing.tracker_ref
            && updated.final_date == existing.final_date;
        return onlyActiveFlagChanges ? null : "admin_can_only_set_active";
    }

    // Developers and SD staff move a specification through its stages, SD staff and managers add new ones
    private static string? CheckSpecifications(Caller caller, string httpMethod)
    {
        if (HttpMethods.IsPost(httpMethod))
        {
            return caller.Role is AppRoles.ServiceDelivery or AppRoles.Manager ? null : "sd_or_manager_only";
        }

        if (HttpMethods.IsDelete(httpMethod))
        {
            return caller.Role == AppRoles.Manager ? null : "manager_only";
        }

        return caller.Role is AppRoles.Developer or AppRoles.ServiceDelivery or AppRoles.Manager
            ? null
            : "staff_only";
    }

    // Developers and SD staff record why a specification went back a stage, as themselves, and mark
    // the request resolved. Only a manager removes one.
    private async Task<string?> CheckChangeRequestsAsync(Caller caller, string httpMethod, int? routeId, IDictionary<string, object?> args)
    {
        if (HttpMethods.IsDelete(httpMethod))
        {
            return caller.Role == AppRoles.Manager ? null : "manager_only";
        }

        if (caller.Role is not (AppRoles.Developer or AppRoles.ServiceDelivery) || caller.EmployeeId == null)
        {
            return "developer_or_sd_only";
        }

        var body = Body<SpecificationChangeRequest>(args);
        if (body == null) return "write_not_permitted";

        if (HttpMethods.IsPost(httpMethod))
        {
            // The requester is always the caller, and a new request starts unresolved
            return body.requester_id == caller.EmployeeId && !body.resolved ? null : "requester_must_be_you";
        }

        if (routeId == null) return "write_not_permitted";
        var existing = await _db.specificationChangeRequests.AsNoTracking().SingleOrDefaultAsync(request => request.id == routeId);
        if (existing == null) return null;

        // Resolving a request must not rewrite who raised it, or what it says
        var onlyResolvedChanges = body.id == existing.id
            && body.specification_id == existing.specification_id
            && body.requester_id == existing.requester_id
            && body.stage == existing.stage
            && body.reason == existing.reason;
        return onlyResolvedChanges ? null : "only_resolved_can_change";
    }

    // ----- Module B handoffs -----

    // Developers submit, resubmit and withdraw handoffs. SD staff review them by moving the status.
    // Which project a person works on is not stored in a way the app uses yet, so this is role based.
    private async Task<string?> CheckHandoffsAsync(Caller caller, string httpMethod, int? routeId, IDictionary<string, object?> args)
    {
        if (HttpMethods.IsPost(httpMethod))
        {
            var created = Body<SpecificationHandoff>(args);
            return caller.Role == AppRoles.Developer && created?.status == "Pending" ? null : "developer_only_new_handoff";
        }

        if (HttpMethods.IsDelete(httpMethod))
        {
            return caller.Role == AppRoles.Developer ? null : "developer_only_delete_handoff";
        }

        var updated = Body<SpecificationHandoff>(args);
        if (updated == null || routeId == null) return "write_not_permitted";
        var existing = await _db.specificationHandoffs.AsNoTracking().SingleOrDefaultAsync(handoff => handoff.id == routeId);
        if (existing == null) return null;

        var sameTarget = updated.id == existing.id
            && updated.project_id == existing.project_id
            && updated.specification_id == existing.specification_id;

        var onlyStatusChanges = sameTarget
            && updated.notified == existing.notified
            && updated.expected == existing.expected
            && updated.description == existing.description
            && updated.success == existing.success;

        if (caller.Role == AppRoles.Developer)
        {
            // Resubmitting puts the handoff back to pending and may update its details. A developer can
            // also launch it or ask for changes, which only move the status.
            if (updated.status == "Pending") return sameTarget ? null : "developer_can_only_resubmit";
            var statusOnly = updated.status is "Launched" or "Changes Requested";
            return onlyStatusChanges && statusOnly ? null : "developer_can_only_resubmit";
        }

        if (caller.Role == AppRoles.ServiceDelivery)
        {
            // Reviewing and testing only move the status, to one of the statuses the SD screens use
            var reviewed = updated.status is "Ready to test" or "Changes Requested"
                or "Testing Passed - Ready for Launch" or "Test Failed - Changes Requested";
            return onlyStatusChanges && reviewed ? null : "sd_can_only_review";
        }

        return "handoff_update_not_permitted";
    }

    // SD staff sign off handoffs as themselves, and can only change or remove their own signoffs
    private async Task<string?> CheckSignoffsAsync(Caller caller, string httpMethod, int? routeId, IDictionary<string, object?> args)
    {
        if (caller.Role != AppRoles.ServiceDelivery || caller.EmployeeId == null) return "sd_only";
        var me = caller.EmployeeId.Value;

        var body = Body<HandoffSignoff>(args);
        if (!HttpMethods.IsDelete(httpMethod) && (body == null || body.signer_id != me)) return "signer_must_be_you";

        if (routeId != null)
        {
            var existing = await _db.handoffSignoffs.AsNoTracking().SingleOrDefaultAsync(signoff => signoff.id == routeId);
            if (existing != null && existing.signer_id != me) return "not_your_signoff";
        }

        return null;
    }
}

using Firecrest.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Firecrest.Api.Auth;

// What a caller needs before a read endpoint will answer
public enum ReadAccess
{
    // Any signed in employee or admin
    EmployeeOrAdmin,
    // Any signed in employee (manager, developer or SD), admins are refused
    Staff,
    // Employees only, and only their own data, or their direct reports for a manager
    OwnData
}

// The read authorization matrix for the API. Writes are decided in WriteAuthorizer.
public static class AccessRules
{
    public static ReadAccess ForRead(string controller)
    {
        return controller switch
        {
            "Users" => ReadAccess.EmployeeOrAdmin,
            "PublicHolidays" => ReadAccess.EmployeeOrAdmin,

            // Own data, or a manager's direct reports
            "LeaveRequests" => ReadAccess.OwnData,
            "LeaveBalances" => ReadAccess.OwnData,
            "Hours" => ReadAccess.OwnData,

            // Team schedule and Module B records are shared between staff, no row level rule yet
            "Shifts" => ReadAccess.Staff,

            // Anything new is staff only until it is added here on purpose
            _ => ReadAccess.Staff
        };
    }
}

// Runs before every controller action in Oidc mode, after the token has been checked.
// It resolves the caller, applies the matrix above and trims what the caller may see.
public class FirecrestAccessFilter : IAsyncActionFilter
{
    private readonly CallerResolver _resolver;
    private readonly WriteAuthorizer _writes;

    public FirecrestAccessFilter(CallerResolver resolver, WriteAuthorizer writes)
    {
        _resolver = resolver;
        _writes = writes;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var resolved = await _resolver.ResolveAsync(context.HttpContext.User);
        if (resolved.Caller == null)
        {
            context.Result = Forbidden(resolved.Error!);
            return;
        }

        var caller = resolved.Caller;
        var isRead = HttpMethods.IsGet(context.HttpContext.Request.Method);
        var controller = (context.ActionDescriptor as ControllerActionDescriptor)?.ControllerName ?? "";

        // Writes are decided per operation, before the action can change anything
        if (!isRead)
        {
            var denied = await _writes.CheckAsync(controller, context.HttpContext.Request.Method, context, caller);
            if (denied != null)
            {
                context.Result = Forbidden(denied);
                return;
            }

            await next();
            return;
        }

        var access = AccessRules.ForRead(controller);

        if (access != ReadAccess.EmployeeOrAdmin && caller.IsAdmin)
        {
            context.Result = Forbidden("admin_not_permitted");
            return;
        }

        IReadOnlyCollection<int>? readable = null;
        if (access == ReadAccess.OwnData)
        {
            readable = await _resolver.GetReadableEmployeeIdsAsync(caller);

            // Endpoints that name an employee are checked before they run
            if (context.ActionArguments.TryGetValue("userId", out var userId)
                && userId is int requestedUserId
                && !readable.Contains(requestedUserId))
            {
                context.Result = Forbidden("not_permitted");
                return;
            }
        }

        var executed = await next();

        // Trim lists and check single records after the action ran, the response format is unchanged
        if (readable != null && executed.Exception == null && executed.Result is ObjectResult result)
        {
            switch (result.Value)
            {
                case IEnumerable<LeaveRequest> leaveRequests:
                    result.Value = leaveRequests.Where(item => readable.Contains(item.user_id)).ToList();
                    break;
                case IEnumerable<LeaveBalance> leaveBalances:
                    result.Value = leaveBalances.Where(item => readable.Contains(item.user_id)).ToList();
                    break;
                case IEnumerable<FortnightHoursResult> hours:
                    result.Value = hours.Where(item => readable.Contains(item.user_id)).ToList();
                    break;
                case LeaveRequest leaveRequest when !readable.Contains(leaveRequest.user_id):
                case LeaveBalance leaveBalance when !readable.Contains(leaveBalance.user_id):
                case FortnightHoursResult hoursResult when !readable.Contains(hoursResult.user_id):
                    executed.Result = Forbidden("not_permitted");
                    break;
            }
        }
    }

    private static ObjectResult Forbidden(string error)
    {
        return new ObjectResult(new { error }) { StatusCode = StatusCodes.Status403Forbidden };
    }
}

using System.Security.Claims;
using Firecrest.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Firecrest.Api.Auth;

// Who is calling the API, worked out from the validated token and the database. Nothing the client
// sends can change this. EmployeeId is null for an admin without an employee record.
public record Caller(
    string Role,
    int? EmployeeId,
    string? EmployeeName,
    string? StoredRole,
    int? ManagerId,
    string? Username)
{
    public bool IsAdmin => Role == AppRoles.Admin;
}

// Either a caller or the reason the caller was refused
public record CallerResult(Caller? Caller, string? Error);

// Turns the issuer and subject of a validated token into an employee and a single application role
public class CallerResolver
{
    private readonly FirecrestDbContext _db;

    public CallerResolver(FirecrestDbContext db)
    {
        _db = db;
    }

    public async Task<CallerResult> ResolveAsync(ClaimsPrincipal principal)
    {
        var issuer = principal.FindFirst("iss")?.Value;
        var subject = principal.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(issuer) || string.IsNullOrEmpty(subject))
        {
            return new CallerResult(null, "identity_missing");
        }

        // One application role only, authentik groups are the authority for roles
        var roles = AppRoles.FromGroups(principal.FindAll("groups").Select(claim => claim.Value));
        if (roles.Count == 0) return new CallerResult(null, "no_application_role");
        if (roles.Count > 1) return new CallerResult(null, "ambiguous_application_roles");
        var role = roles[0];

        var username = principal.FindFirst("preferred_username")?.Value;

        var employee = await _db.userIdentities
            .Where(identity => identity.issuer == issuer && identity.subject == subject)
            .Join(_db.users, identity => identity.user_id, user => user.id, (identity, user) => user)
            .SingleOrDefaultAsync();

        if (employee == null)
        {
            // An admin may exist without an employee record, but gets no employee data
            if (role == AppRoles.Admin)
            {
                return new CallerResult(new Caller(role, null, username, null, null, username), null);
            }

            return new CallerResult(null, "identity_not_linked");
        }

        // The role in authentik must be the one stored for the employee, never a higher one
        if (!AppRoles.MatchesStoredRole(role, employee.role))
        {
            return new CallerResult(null, "role_mismatch");
        }

        return new CallerResult(
            new Caller(role, employee.id, employee.name, employee.role, employee.manager_id, username),
            null);
    }

    // The employees whose data this caller may read: themselves, and for a manager their direct reports
    public async Task<IReadOnlyCollection<int>> GetReadableEmployeeIdsAsync(Caller caller)
    {
        if (caller.EmployeeId == null) return Array.Empty<int>();

        var ids = new List<int> { caller.EmployeeId.Value };

        if (caller.Role == AppRoles.Manager)
        {
            ids.AddRange(await _db.users
                .Where(user => user.manager_id == caller.EmployeeId)
                .Select(user => user.id)
                .ToListAsync());
        }

        return ids;
    }
}

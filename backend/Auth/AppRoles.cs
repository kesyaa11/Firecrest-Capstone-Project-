namespace Firecrest.Api.Auth;

// Turns authentik group names into Firecrest roles and checks them against the stored employee role
public static class AppRoles
{
    public const string Manager = "Manager";
    public const string Developer = "Dev";
    public const string ServiceDelivery = "SD";
    public const string Admin = "Admin";

    private static readonly Dictionary<string, string> GroupToRole = new()
    {
        ["firecrest-manager"] = Manager,
        ["firecrest-developer"] = Developer,
        ["firecrest-sd"] = ServiceDelivery,
        ["firecrest-admin"] = Admin
    };

    // Application roles found in the groups, other groups such as authentik Admins are ignored
    public static IReadOnlyList<string> FromGroups(IEnumerable<string> groups)
    {
        return groups
            .Where(group => GroupToRole.ContainsKey(group))
            .Select(group => GroupToRole[group])
            .Distinct()
            .ToList();
    }

    // The role stored in the database must be the same one authentik grants, never a higher one
    public static bool MatchesStoredRole(string authentikRole, string storedRole)
    {
        var stored = storedRole.Trim();

        return authentikRole switch
        {
            Developer => stored.Equals("Dev", StringComparison.OrdinalIgnoreCase)
                         || stored.Equals("Developer", StringComparison.OrdinalIgnoreCase),
            _ => stored.Equals(authentikRole, StringComparison.OrdinalIgnoreCase)
        };
    }
}

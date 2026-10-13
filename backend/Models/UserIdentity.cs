namespace Firecrest.Api.Models;

// Links an authentik identity (issuer + subject) to a user, it is used to find the employee for a login
public class UserIdentity
{
    public int id { get; set; }
    public int user_id { get; set; }
    public string issuer { get; set; } = null!;
    public string subject { get; set; } = null!;
}

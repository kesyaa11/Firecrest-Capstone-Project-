namespace Firecrest.Api.Models;

// User model, it is used to store / get users from the database
public class User
{
    public int id { get; set; }
    public string name { get; set; } = null!;
    public string role { get; set; } = null!;
    public string country { get; set; } = null!;
    public string region { get; set; } = null!;
    public string? team { get; set; }
    public int? manager_id { get; set; }
    public bool is_active { get; set; } = true;
}
namespace Firecrest.Api.Models;

public class User
{
    public int id { get; set; }
    public string name { get; set; } = null!;
    public string role { get; set; } = null!;
    public string country { get; set; } = null!;
    public string? team { get; set; }
    public int? manager_id { get; set; }
}
namespace Firecrest.Api.Models;

// Project model, it is used to store / get projects from the database
public class Project
{
    public int id { get; set; }
    public string? name { get; set; }
    public string? client { get; set; }
    public string? tracker_ref { get; set; }
    public DateOnly? final_date { get; set; }
    public bool is_active { get; set; } = true;
}
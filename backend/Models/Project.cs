namespace Firecrest.Api.Models;

// Project model, it is used to store / get projects from the database
public class Project
{
    public int id { get; set; }
    public string? name { get; set; }
    public string? tracker_ref { get; set; }
}
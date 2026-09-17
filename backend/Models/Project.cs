namespace Firecrest.Api.Models;

public class Project
{
    public int id { get; set; }
    public string? name { get; set; }
    public string? tracker_ref { get; set; }
    public DateOnly? final_date { get; set; }
}
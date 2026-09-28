namespace Firecrest.Api.Models;

// Project specification model, it is used to store / get project specifications for a given project from the database
public class ProjectSpecification
{
    public int id { get; set; }
    public int project_id { get; set; }
    public string? name { get; set; }
    public string? version { get; set; }
    public string? link { get; set; }
    public bool specs { get; set; } = false;
    public bool build { get; set; } = false;
    public bool test_sheet { get; set; } = false;
    public bool launch_plan { get; set; } = false;
    public string? billing { get; set; }
    public bool roadmap { get; set; } = false;
    public DateOnly? target_date { get; set; }
}
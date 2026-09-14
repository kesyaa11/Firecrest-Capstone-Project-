namespace Firecrest.Api.Models;

public class ProjectSpecification
{
    public int id { get; set; }
    public int project_id { get; set; }
    public int author_id { get; set; }
    public string? version { get; set; }
    public string? content { get; set; }
    public bool specs { get; set; } = false;
    public bool build { get; set; } = false;
    public bool test_sheet { get; set; } = false;
    public bool launch_plan { get; set; } = false;
    public string? billing { get; set; }
    public bool roadmap { get; set; } = false;
}
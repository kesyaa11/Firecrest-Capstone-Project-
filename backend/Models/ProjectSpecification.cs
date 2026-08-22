namespace Firecrest.Api.Models;

public class ProjectSpecification
{
    public int id { get; set; }
    public int? project_id { get; set; }
    public int author_id { get; set; }
    public string? version { get; set; }
    public string? content { get; set; }
}
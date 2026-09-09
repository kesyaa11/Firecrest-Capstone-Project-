namespace Firecrest.Api.Models;

// Project specification model, it is used to store / get project specifications for a given project from the database
public class ProjectSpecification
{
    public int id { get; set; }
    public int? project_id { get; set; }
    public int author_id { get; set; }
    public string? version { get; set; }
    public string? content { get; set; }
}
namespace Firecrest.Api.Models;

// Stores a request from Dev or SD to return a project specification to an earlier stage of development
public class SpecificationChangeRequest
{
    public int id { get; set; }

    // Specification that needs changes
    public int specification_id { get; set; }

    // User who requested the changes
    public int requester_id { get; set; }

    // Stage being returned to: Roadmap, Specs, Build, Test, or Launch
    public string stage { get; set; } = string.Empty;

    // Explanation of why changes are required
    public string reason { get; set; } = string.Empty;

    // When the changes were requested
    public DateTime created_at { get; set; }

    // False while changes still need to be addressed
    public bool resolved { get; set; } = false;
}
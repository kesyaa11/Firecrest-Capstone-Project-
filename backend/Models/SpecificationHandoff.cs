namespace Firecrest.Api.Models;

public class SpecificationHandoff
{
    public int id { get; set; }
    public int project_id { get; set; }
    public int specification_id { get; set; }
    public DateTime notified { get; set; }
    public DateTime? expected { get; set; }
    public string? status { get; set; }
}
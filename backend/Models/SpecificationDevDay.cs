namespace Firecrest.Api.Models;

public class SpecificationDevDay
{
    public int id { get; set; }
    public int specification_id { get; set; }
    public DateOnly specificied_month { get; set; }
    public decimal? dev_days { get; set; }
}
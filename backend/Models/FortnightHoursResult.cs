namespace Firecrest.Api.Models;

public class FortnightHoursResult
{
    public int user_id { get; set; }
    public DateOnly period_start { get; set; }
    public DateOnly period_end { get; set; }
    public decimal raw_hours { get; set; }
}

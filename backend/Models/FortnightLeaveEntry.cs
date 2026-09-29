namespace Firecrest.Api.Models;

// Approved leave that overlaps a fortnight, used by FortnightHoursResult
public class FortnightLeaveEntry
{
    public int leave_request_id { get; set; }
    public string leave_type { get; set; } = null!;
    public DateOnly start_date { get; set; }
    public DateOnly end_date { get; set; }

    // Calendar days of this leave that fall inside the fortnight, weekends and public holidays included
    public int calendar_days_in_period { get; set; }
    public decimal leave_hours { get; set; }
}

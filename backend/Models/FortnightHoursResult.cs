namespace Firecrest.Api.Models;

public class FortnightHoursResult
{
    public int user_id { get; set; }
    public DateOnly period_start { get; set; }
    public DateOnly period_end { get; set; }
    public decimal raw_hours { get; set; }

    // Sprint representation of raw_hours, raw_hours itself is never rounded
    public int complete_sprints { get; set; }
    public int development_days { get; set; }
    public decimal remainder_hours { get; set; }

    // Hours worked on national public holidays (already part of raw_hours) and
    // raw_hours with those holiday hours at time and a half
    public decimal public_holiday_hours { get; set; }
    public decimal holiday_adjusted_hours { get; set; }

    // Approved leave is reported separately and never added to raw_hours
    public List<FortnightLeaveEntry> approved_leave { get; set; } = [];
    public int approved_leave_calendar_days { get; set; }
    public decimal leave_hours { get; set; }
}

namespace Firecrest.Api.Models;

public class Shift
{
    public int id { get; set; }
    public int user_id { get; set; }
    public DateOnly date { get; set; }
    public int? duration { get; set; }
    public TimeSpan? shift_start { get; set; }
    public TimeSpan? shift_end { get; set; }
    public int? shiftsCount { get; set; }
    public int? slot_number { get; set; }
}
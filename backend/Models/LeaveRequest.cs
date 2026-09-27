namespace Firecrest.Api.Models;

// Leave request model, it is used to store / get leave requests for a given person from the database
public class LeaveRequest
{
    public int id { get; set; }
    public int user_id { get; set; }
    public int approver_id { get; set; }
    public DateOnly start_date { get; set; }
    public DateOnly end_date { get; set; }
    public string leave_type { get; set; } = null!;
    public string status { get; set; } = null!;
}
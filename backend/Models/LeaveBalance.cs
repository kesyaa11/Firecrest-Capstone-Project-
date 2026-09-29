namespace Firecrest.Api.Models;

// Leave balance model, it is used to store / get the current leave balance for a given person from the database
public class LeaveBalance
{
    public int id { get; set; }
    public int user_id { get; set; }
    public int sick_days { get; set; }
    public decimal al_accured { get; set; }
    public decimal al_taken_accured { get; set; }
    public decimal al_outstanding { get; set; }
    public decimal annual_owing { get; set; }
    public int alternative_days { get; set; }
}

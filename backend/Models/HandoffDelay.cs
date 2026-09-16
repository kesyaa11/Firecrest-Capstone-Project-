namespace Firecrest.Api.Models;

public class HandoffDelay
{
    public int id { get; set; }
    public int handoff_id { get; set; }
    public string reason { get; set; }
    public int? delay_hours { get; set; }
}
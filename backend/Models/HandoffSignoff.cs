namespace Firecrest.Api.Models;

public class HandoffSignoff
{
    public int id { get; set; }
    public int handoff_id { get; set; }
    public int signer_id { get; set; }
    public string? signer_role { get; set; }
    public DateTime? signoff_date { get; set; }
}
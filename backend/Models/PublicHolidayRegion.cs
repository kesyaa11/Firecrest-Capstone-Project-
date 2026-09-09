namespace Firecrest.Api.Models;

// Public Holiday region model, currently is here as a placeholder in case I need it for storing stuff like Manawatu seperatly for public holidays
public class PublicHolidayRegion
{
    public int id { get; set; }
    public int holiday_id { get; set; }
    public string region_code { get; set; } = null!;
}
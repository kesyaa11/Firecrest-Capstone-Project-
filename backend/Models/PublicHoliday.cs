namespace Firecrest.Api.Models;

// Public Holiday model is it used to get every public holiday (NZ and PH) from the database
public class PublicHoliday
{
    public int id { get; set; }
    public string name { get; set; } = null!;
    public DateOnly date { get; set; }
    public string country { get; set; } = null!;
    public bool is_national { get; set; }
    public List<string> regions { get; set; } = [];
}
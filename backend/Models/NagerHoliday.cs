using System.Text.Json.Serialization;

public class NagerHoliday
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("date")]
    public DateOnly Date { get; set; }

    [JsonPropertyName("countryCode")]
    public string CountryCode { get; set; } = "";

    [JsonPropertyName("global")]
    public bool Global { get; set; }

    [JsonPropertyName("counties")]
    public List<string>? Counties { get; set; }
}
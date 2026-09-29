namespace Firecrest.Api.Services;

// Converts confirmed hours into the client's sprint and development day units.
// 1 sprint = 2 hours and 3 sprints = 1 development day (6 hours).
public static class SprintCalculator
{
    public const decimal HoursPerSprint = 2m;
    public const int SprintsPerDevelopmentDay = 3;

    public static int CompleteSprints(decimal hours)
    {
        if (hours <= 0) return 0;
        return (int)Math.Floor(hours / HoursPerSprint);
    }

    public static int DevelopmentDays(decimal hours)
    {
        return CompleteSprints(hours) / SprintsPerDevelopmentDay;
    }

    // Hours that do not yet make up a full sprint. These are kept rather than rounded away
    // so they can combine with hours worked on other days.
    public static decimal RemainderHours(decimal hours)
    {
        if (hours <= 0) return 0;
        return hours - CompleteSprints(hours) * HoursPerSprint;
    }
}

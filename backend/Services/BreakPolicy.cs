namespace Firecrest.Api.Services;

// Firecrest prototype break rule, expected to change after manager/client feedback.
// It is not a full statutory break calculation. Paid rest breaks are not deducted,
// and at most one unpaid break is deducted per employee per calendar day.
public static class BreakPolicy
{
    // Days with at least this many worked hours have an unpaid break deducted
    public const decimal UnpaidBreakThresholdHours = 6m;

    // Length of the unpaid break deducted on those days
    public const decimal UnpaidBreakHours = 0.5m;

    public static decimal BreakHoursForDay(decimal workedHours)
    {
        return workedHours >= UnpaidBreakThresholdHours ? UnpaidBreakHours : 0m;
    }
}

using Firecrest.Api.Services;
using FluentAssertions;

namespace Tests;

[TestFixture]
public class BreakPolicyTests
{
    [TestCase(0, 0, TestName = "0 hours -> no break")]
    [TestCase(5.5, 0, TestName = "5.5 hours -> no break")]
    [TestCase(5.99, 0, TestName = "5.99 hours -> no break")]
    [TestCase(6, 0.5, TestName = "6 hours -> 0.5 hour break")]
    [TestCase(7, 0.5, TestName = "7 hours -> 0.5 hour break")]
    [TestCase(8, 0.5, TestName = "8 hours -> 0.5 hour break")]
    [TestCase(12, 0.5, TestName = "12 hours -> still only one 0.5 hour break")]
    public void BreakHoursForDay_AppliesThreshold(decimal workedHours, decimal expectedBreak)
    {
        BreakPolicy.BreakHoursForDay(workedHours).Should().Be(expectedBreak);
    }
}

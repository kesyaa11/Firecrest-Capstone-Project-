using Firecrest.Api.Services;
using FluentAssertions;

namespace Tests;

[TestFixture]
public class SprintCalculatorTests
{
    [TestCase(0, 0, 0, 0, TestName = "0 hours -> 0 sprints, 0 dev days, 0 remainder")]
    [TestCase(1, 0, 0, 1, TestName = "1 hour -> 0 sprints, 0 dev days, 1 hour remainder")]
    [TestCase(2, 1, 0, 0, TestName = "2 hours -> 1 sprint, 0 dev days, 0 remainder")]
    [TestCase(5, 2, 0, 1, TestName = "5 hours -> 2 sprints, 0 dev days, 1 hour remainder")]
    [TestCase(6, 3, 1, 0, TestName = "6 hours -> 3 sprints, 1 dev day, 0 remainder")]
    [TestCase(7, 3, 1, 1, TestName = "7 hours -> 3 sprints, 1 dev day, 1 hour remainder")]
    [TestCase(8, 4, 1, 0, TestName = "8 hours -> 4 sprints, 1 dev day, 0 remainder")]
    [TestCase(12, 6, 2, 0, TestName = "12 hours -> 6 sprints, 2 dev days, 0 remainder")]
    [TestCase(13, 6, 2, 1, TestName = "13 hours -> 6 sprints, 2 dev days, 1 hour remainder")]
    public void Calculator_WholeHours_MatchesClientRule(
        int hours, int expectedSprints, int expectedDevelopmentDays, int expectedRemainder)
    {
        SprintCalculator.CompleteSprints(hours).Should().Be(expectedSprints);
        SprintCalculator.DevelopmentDays(hours).Should().Be(expectedDevelopmentDays);
        SprintCalculator.RemainderHours(hours).Should().Be(expectedRemainder);
    }

    [Test]
    public void Calculator_FractionalHours_KeepsFractionInRemainder()
    {
        SprintCalculator.CompleteSprints(7.5m).Should().Be(3);
        SprintCalculator.DevelopmentDays(7.5m).Should().Be(1);
        SprintCalculator.RemainderHours(7.5m).Should().Be(1.5m);
    }

    [TestCase(1)]
    [TestCase(5)]
    [TestCase(7)]
    [TestCase(8)]
    [TestCase(13)]
    public void Calculator_SprintsPlusRemainder_AddBackToOriginalHours(int hours)
    {
        var rebuilt = SprintCalculator.CompleteSprints(hours) * SprintCalculator.HoursPerSprint
            + SprintCalculator.RemainderHours(hours);

        rebuilt.Should().Be(hours);
    }
}

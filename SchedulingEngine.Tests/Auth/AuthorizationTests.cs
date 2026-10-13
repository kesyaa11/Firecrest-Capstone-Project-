using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using Firecrest.Api.Data;
using Firecrest.Api.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace Firecrest.Tests.Auth;

// Tests who can read what once the API is in Oidc mode
[TestFixture]
public class AuthorizationTests
{
    private const string Issuer = "http://localhost:9000/application/o/firecrest/";
    private const string Audience = "test-api-audience";
    private const string PeriodStart = "2026-09-15";

    // Two managers, each with their own direct reports
    //   1 Terry (Manager) -> 2 Ben (Dev), 3 Sarah (SD)
    //   4 Other (Manager) -> 5 Dev Two (Dev)
    private RsaSecurityKey _signingKey = null!;
    private int _leaveOfDev, _leaveOfSd, _leaveOfManager, _leaveOfOtherTeam;
    private int _balanceOfDev, _balanceOfOtherTeam;

    [OneTimeSetUp]
    public void CreateKey()
    {
        _signingKey = new RsaSecurityKey(RSA.Create(2048)) { KeyId = "test-key" };
    }

    private WebApplicationFactory<Program> CreateFactory(string mode)
    {
        var databaseName = Guid.NewGuid().ToString();

        var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("Auth:Mode", mode);
            builder.UseSetting("Auth:Oidc:Authority", Issuer);
            builder.UseSetting("Auth:Oidc:Audience", Audience);

            builder.ConfigureServices(services =>
            {
                services.RemoveAll<DbContextOptions<FirecrestDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<FirecrestDbContext>>();
                services.AddDbContext<FirecrestDbContext>(options => options.UseInMemoryDatabase(databaseName));

                services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
                {
                    var configuration = new OpenIdConnectConfiguration { Issuer = Issuer };
                    configuration.SigningKeys.Add(_signingKey);
                    options.Configuration = configuration;
                    options.ConfigurationManager =
                        new StaticConfigurationManager<OpenIdConnectConfiguration>(configuration);
                });
            });
        });

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FirecrestDbContext>();

        db.users.AddRange(
            new User { region = "NZ-WGN", id = 1, name = "Terry Jeffords", role = "Manager", country = "NZ" },
            new User { region = "NZ-WGN", id = 2, name = "Benjamin Franklin", role = "Dev", country = "NZ", manager_id = 1 },
            new User { region = "NZ-WGN", id = 3, name = "Sarah Parker", role = "SD", country = "NZ", manager_id = 1 },
            new User { region = "NZ-WGN", id = 4, name = "Other Manager", role = "Manager", country = "NZ" },
            new User { region = "NZ-WGN", id = 5, name = "Dev Two", role = "Dev", country = "NZ", manager_id = 4 });

        void Link(int userId, string subject) =>
            db.userIdentities.Add(new UserIdentity { user_id = userId, issuer = Issuer, subject = subject });
        Link(1, "sub-manager");
        Link(2, "sub-dev");
        Link(3, "sub-sd");
        Link(4, "sub-other-manager");
        Link(5, "sub-dev-two");

        LeaveRequest Leave(int userId, int approverId) => new()
        {
            user_id = userId,
            approver_id = approverId,
            start_date = new DateOnly(2026, 9, 21),
            end_date = new DateOnly(2026, 9, 22),
            leave_type = "Annual Leave",
            status = "Pending"
        };
        var leaveManager = Leave(1, 1);
        var leaveDev = Leave(2, 1);
        var leaveSd = Leave(3, 1);
        var leaveOther = Leave(5, 4);
        db.leaveRequests.AddRange(leaveManager, leaveDev, leaveSd, leaveOther);

        LeaveBalance Balance(int userId) => new()
        {
            user_id = userId, sick_days = 10, al_accured = 80, al_taken_accured = 0,
            al_outstanding = 80, annual_owing = 0, alternative_days = 0
        };
        var balanceDev = Balance(2);
        var balanceOther = Balance(5);
        db.leaveBalances.AddRange(Balance(1), balanceDev, Balance(3), balanceOther);

        Shift ShiftFor(int userId) => new()
        {
            user_id = userId, date = new DateOnly(2026, 9, 15),
            shift_start = TimeSpan.FromHours(8), shift_end = TimeSpan.FromHours(10), work_type = "Development"
        };
        db.shifts.AddRange(ShiftFor(2), ShiftFor(5));

        db.projects.Add(new Project { id = 1, name = "Firecrest Capstone" });
        db.SaveChanges();

        _leaveOfManager = leaveManager.id;
        _leaveOfDev = leaveDev.id;
        _leaveOfSd = leaveSd.id;
        _leaveOfOtherTeam = leaveOther.id;
        _balanceOfDev = balanceDev.id;
        _balanceOfOtherTeam = balanceOther.id;

        return factory;
    }

    private string Token(string subject, params string[] groups)
    {
        var claims = new List<Claim> { new("sub", subject), new("preferred_username", "test-user") };
        claims.AddRange(groups.Select(group => new Claim("groups", group)));

        var now = DateTime.UtcNow;
        var token = new JwtSecurityToken(
            Issuer, Audience, claims,
            notBefore: now.AddMinutes(-10), expires: now.AddMinutes(10),
            signingCredentials: new SigningCredentials(_signingKey, SecurityAlgorithms.RsaSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string Manager => Token("sub-manager", "firecrest-manager");
    private string Dev => Token("sub-dev", "firecrest-developer");
    private string Sd => Token("sub-sd", "firecrest-sd");
    private string Admin => Token("sub-admin", "firecrest-admin");

    private static async Task<HttpResponseMessage> Send(
        HttpClient client, string path, string? token, HttpMethod? method = null, HttpContent? content = null)
    {
        var request = new HttpRequestMessage(method ?? HttpMethod.Get, path) { Content = content };
        if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await client.SendAsync(request);
    }

    private static async Task<List<JsonElement>> ReadList(HttpResponseMessage response)
    {
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return json.RootElement.EnumerateArray().Select(item => item.Clone()).ToList();
    }

    private static IEnumerable<int> UserIds(IEnumerable<JsonElement> items) =>
        items.Select(item => item.GetProperty("user_id").GetInt32()).OrderBy(id => id);

    // ----- Authentication on every business endpoint -----

    [TestCase("/admin/users")]
    [TestCase("/admin/leave-requests")]
    [TestCase("/admin/leave-balances")]
    [TestCase("/admin/hours/fortnight/all?periodStart=" + PeriodStart)]
    [TestCase("/admin/shifts")]
    [TestCase("/admin/projects")]
    [TestCase("/admin/publicholidays")]
    [TestCase("/admin/handoff-signoffs")]
    public async Task AnonymousReads_Return401(string path)
    {
        await using var factory = CreateFactory("Oidc");

        var response = await Send(factory.CreateClient(), path, null);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task AnonymousWrites_Return401()
    {
        await using var factory = CreateFactory("Oidc");
        var client = factory.CreateClient();

        var post = await Send(client, "/admin/users", null, HttpMethod.Post,
            JsonContent.Create(new { name = "Intruder", role = "Manager", country = "NZ", region = "NZ-WGN" }));
        var delete = await Send(client, "/admin/leave-requests/1", null, HttpMethod.Delete);
        var patch = await Send(client, "/admin/leave-requests/1", null, HttpMethod.Patch,
            JsonContent.Create(new { status = "Approved" }));

        post.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        delete.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        patch.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task InvalidToken_Returns401()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await Send(factory.CreateClient(), "/admin/users", "not-a-jwt");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task ValidButUnlinkedIdentity_Returns403()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await Send(factory.CreateClient(), "/admin/users",
            Token("sub-nobody", "firecrest-manager"));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Test]
    public async Task RoleMismatch_Returns403()
    {
        // Linked to the manager record, but authentik only grants developer
        await using var factory = CreateFactory("Oidc");

        var response = await Send(factory.CreateClient(), "/admin/leave-requests",
            Token("sub-manager", "firecrest-developer"));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Test]
    public async Task ConflictingRoles_Return403()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await Send(factory.CreateClient(), "/admin/users",
            Token("sub-manager", "firecrest-manager", "firecrest-admin"));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Test]
    public async Task NoApplicationRole_Returns403()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await Send(factory.CreateClient(), "/admin/users",
            Token("sub-manager", "authentik Admins"));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ----- Admin is explicit, not unrestricted -----

    [Test]
    public async Task Admin_CanReadUsersAndPublicHolidays()
    {
        await using var factory = CreateFactory("Oidc");
        var client = factory.CreateClient();

        (await Send(client, "/admin/users", Admin)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await Send(client, "/admin/publicholidays", Admin)).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [TestCase("/admin/leave-requests")]
    [TestCase("/admin/leave-balances")]
    [TestCase("/admin/hours/fortnight/all?periodStart=" + PeriodStart)]
    [TestCase("/admin/shifts")]
    public async Task Admin_CannotReadEmployeeBusinessData(string path)
    {
        await using var factory = CreateFactory("Oidc");

        var response = await Send(factory.CreateClient(), path, Admin);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [TestCase("/admin/projects")]
    [TestCase("/admin/projectspecifications")]
    [TestCase("/admin/specificationhandoffs")]
    [TestCase("/admin/specificationusers")]
    [TestCase("/admin/specification-change-requests")]
    [TestCase("/admin/handoff-signoffs")]
    public async Task Admin_CanReadProjectsAndHandoffs(string path)
    {
        // The admin reuses the manager's Projects and Handoffs view
        await using var factory = CreateFactory("Oidc");

        var response = await Send(factory.CreateClient(), path, Admin);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ----- Employee records -----

    [Test]
    public async Task Employees_CanReadTheUserDirectory()
    {
        await using var factory = CreateFactory("Oidc");
        var client = factory.CreateClient();

        foreach (var token in new[] { Manager, Dev, Sd })
        {
            var response = await Send(client, "/admin/users", token);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            (await ReadList(response)).Should().HaveCount(5);
        }
    }

    // ----- Leave requests -----

    [Test]
    public async Task Developer_SeesOnlyTheirOwnLeaveRequests()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await Send(factory.CreateClient(), "/admin/leave-requests", Dev);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        UserIds(await ReadList(response)).Should().Equal(2);
    }

    [Test]
    public async Task Manager_SeesOwnAndDirectReportLeaveRequestsOnly()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await Send(factory.CreateClient(), "/admin/leave-requests", Manager);

        UserIds(await ReadList(response)).Should().Equal(1, 2, 3);
    }

    [Test]
    public async Task Employee_CanReadTheirOwnLeaveRequestById()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await Send(factory.CreateClient(), $"/admin/leave-requests/{_leaveOfDev}", Dev);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task Employee_CannotReadAnotherEmployeesLeaveRequest()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await Send(factory.CreateClient(), $"/admin/leave-requests/{_leaveOfSd}", Dev);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Test]
    public async Task Manager_CanReadADirectReportsLeaveRequest()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await Send(factory.CreateClient(), $"/admin/leave-requests/{_leaveOfDev}", Manager);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task Manager_CannotReadAnotherManagersReportsLeaveRequest()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await Send(factory.CreateClient(), $"/admin/leave-requests/{_leaveOfOtherTeam}", Manager);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ----- Leave balances -----

    [Test]
    public async Task LeaveBalances_AreScopedLikeLeaveRequests()
    {
        await using var factory = CreateFactory("Oidc");
        var client = factory.CreateClient();

        UserIds(await ReadList(await Send(client, "/admin/leave-balances", Dev))).Should().Equal(2);
        UserIds(await ReadList(await Send(client, "/admin/leave-balances", Manager))).Should().Equal(1, 2, 3);
    }

    [Test]
    public async Task LeaveBalanceByUser_OwnAndReportAllowed_OthersForbidden()
    {
        await using var factory = CreateFactory("Oidc");
        var client = factory.CreateClient();

        (await Send(client, "/admin/leave-balances/user/2", Dev)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await Send(client, "/admin/leave-balances/user/3", Dev)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await Send(client, "/admin/leave-balances/user/3", Manager)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await Send(client, "/admin/leave-balances/user/5", Manager)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Test]
    public async Task LeaveBalanceById_ChecksTheOwner()
    {
        await using var factory = CreateFactory("Oidc");
        var client = factory.CreateClient();

        (await Send(client, $"/admin/leave-balances/{_balanceOfDev}", Dev)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await Send(client, $"/admin/leave-balances/{_balanceOfOtherTeam}", Dev)).StatusCode
            .Should().Be(HttpStatusCode.Forbidden);
        (await Send(client, $"/admin/leave-balances/{_balanceOfOtherTeam}", Manager)).StatusCode
            .Should().Be(HttpStatusCode.Forbidden);
    }

    // ----- Hours and payroll reports -----

    [Test]
    public async Task HoursForAllUsers_AreTrimmedToTheCallersScope()
    {
        await using var factory = CreateFactory("Oidc");
        var client = factory.CreateClient();
        var path = $"/admin/hours/fortnight/all?periodStart={PeriodStart}";

        UserIds(await ReadList(await Send(client, path, Dev))).Should().Equal(2);
        UserIds(await ReadList(await Send(client, path, Sd))).Should().Equal(3);
        UserIds(await ReadList(await Send(client, path, Manager))).Should().Equal(1, 2, 3);
    }

    [Test]
    public async Task HoursForOneUser_OwnAndReportAllowed_OthersForbidden()
    {
        await using var factory = CreateFactory("Oidc");
        var client = factory.CreateClient();
        string Path(int id) => $"/admin/hours/fortnight?userId={id}&periodStart={PeriodStart}";

        (await Send(client, Path(2), Dev)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await Send(client, Path(3), Dev)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await Send(client, Path(3), Manager)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await Send(client, Path(5), Manager)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Test]
    public async Task HoursReport_KeepsItsResponseFormat()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await Send(factory.CreateClient(),
            $"/admin/hours/fortnight/all?periodStart={PeriodStart}", Manager);

        var first = (await ReadList(response)).First();
        first.EnumerateObject().Select(property => property.Name)
            .Should().Contain(new[] { "user_id", "user_name", "raw_hours", "leave_balance" });
    }

    // ----- Shared schedule and Module B -----

    [Test]
    public async Task Staff_CanReadTheTeamSchedule()
    {
        await using var factory = CreateFactory("Oidc");
        var client = factory.CreateClient();

        foreach (var token in new[] { Manager, Dev, Sd })
        {
            var response = await Send(client, "/admin/shifts", token);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            (await ReadList(response)).Should().HaveCount(2);
        }
    }

    [Test]
    public async Task Staff_CanReadModuleBRecords()
    {
        await using var factory = CreateFactory("Oidc");
        var client = factory.CreateClient();

        foreach (var path in new[] { "/admin/projects", "/admin/projectspecifications", "/admin/specificationhandoffs",
                     "/admin/specificationusers", "/admin/handoff-signoffs", "/admin/handoffdelays",
                     "/admin/specificationdevdays", "/admin/specification-change-requests",
                     "/admin/projects/active", "/admin/projects/inactive", "/admin/users/active" })
        {
            (await Send(client, path, Dev)).StatusCode.Should().Be(HttpStatusCode.OK, path);
        }
    }

    // ----- Writes only need a signed in caller for now -----

    [Test]
    public async Task SignedInEmployee_CanStillCreateALeaveRequest()
    {
        await using var factory = CreateFactory("Oidc");
        var body = JsonContent.Create(new
        {
            user_id = 2, approver_id = 1, start_date = "2026-10-05", end_date = "2026-10-06",
            leave_type = "Annual Leave", status = "Pending"
        });

        var response = await Send(factory.CreateClient(), "/admin/leave-requests", Dev, HttpMethod.Post, body);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Test]
    public async Task UnlinkedIdentity_CannotWrite()
    {
        await using var factory = CreateFactory("Oidc");
        var body = JsonContent.Create(new { name = "Intruder", role = "Manager", country = "NZ", region = "NZ-WGN" });

        var response = await Send(factory.CreateClient(), "/admin/users",
            Token("sub-nobody", "firecrest-manager"), HttpMethod.Post, body);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ----- Prototype mode is unchanged -----

    [Test]
    public async Task PrototypeMode_AnonymousReadsStillWorkAndAreNotTrimmed()
    {
        await using var factory = CreateFactory("Prototype");
        var client = factory.CreateClient();

        (await Send(client, "/admin/users", null)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await ReadList(await Send(client, "/admin/leave-requests", null))).Should().HaveCount(4);
        (await ReadList(await Send(client, "/admin/leave-balances", null))).Should().HaveCount(4);
        (await ReadList(await Send(client, $"/admin/hours/fortnight/all?periodStart={PeriodStart}", null)))
            .Should().HaveCount(5);
        (await Send(client, $"/admin/leave-requests/{_leaveOfOtherTeam}", null)).StatusCode
            .Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task LeaveRequestResponseFormat_IsUnchanged()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await Send(factory.CreateClient(), $"/admin/leave-requests/{_leaveOfDev}", Dev);

        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        json.RootElement.EnumerateObject().Select(property => property.Name).Should().BeEquivalentTo(
            new[] { "id", "user_id", "approver_id", "start_date", "end_date", "leave_type", "status" });
    }
}

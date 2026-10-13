using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using Firecrest.Api.Auth;
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

// Tests GET /me, which turns a valid token into the linked employee
[TestFixture]
public class MeEndpointTests
{
    private const string Issuer = "http://localhost:9000/application/o/firecrest/";
    private const string Audience = "test-api-audience";

    private RsaSecurityKey _signingKey = null!;

    [OneTimeSetUp]
    public void CreateKey()
    {
        _signingKey = new RsaSecurityKey(RSA.Create(2048)) { KeyId = "test-key" };
    }

    // Start the API with an in-memory database that already has the seed employees
    private WebApplicationFactory<Program> CreateFactory(
        string mode,
        Action<FirecrestDbContext>? seedIdentities = null)
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

                // Use the local public key instead of downloading authentik's discovery document
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
            new User { region = "NZ-WGN", id = 3, name = "Sarah Parker", role = "SD", country = "NZ", manager_id = 1 });
        db.SaveChanges();
        seedIdentities?.Invoke(db);
        db.SaveChanges();

        return factory;
    }

    private static UserIdentity Link(int userId, string subject, string issuer = Issuer)
    {
        return new UserIdentity { user_id = userId, issuer = issuer, subject = subject };
    }

    private string CreateToken(string subject, params string[] groups)
    {
        var claims = new List<Claim>
        {
            new("sub", subject),
            new("preferred_username", "test-user")
        };
        claims.AddRange(groups.Select(group => new Claim("groups", group)));

        var now = DateTime.UtcNow;
        var token = new JwtSecurityToken(
            Issuer, Audience, claims,
            notBefore: now.AddMinutes(-10),
            expires: now.AddMinutes(10),
            signingCredentials: new SigningCredentials(_signingKey, SecurityAlgorithms.RsaSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static async Task<HttpResponseMessage> GetMe(HttpClient client, string? token, string path = "/me")
    {
        var request = new HttpRequestMessage(HttpMethod.Get, path);
        if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await client.SendAsync(request);
    }

    private static async Task<JsonElement> ReadJson(HttpResponseMessage response)
    {
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return json.RootElement.Clone();
    }

    [Test]
    public async Task LinkedEmployee_ReturnsTheirRecord()
    {
        await using var factory = CreateFactory("Oidc", db => db.userIdentities.Add(Link(2, "sub-dev")));

        var response = await GetMe(factory.CreateClient(), CreateToken("sub-dev", "firecrest-developer"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var me = await ReadJson(response);
        me.GetProperty("id").GetInt32().Should().Be(2);
        me.GetProperty("name").GetString().Should().Be("Benjamin Franklin");
        me.GetProperty("role").GetString().Should().Be("Dev");
        me.GetProperty("manager_id").GetInt32().Should().Be(1);
        me.GetProperty("is_employee").GetBoolean().Should().BeTrue();
    }

    [Test]
    public async Task LinkedEmployee_ResponseHasOnlySafeFields()
    {
        await using var factory = CreateFactory("Oidc", db => db.userIdentities.Add(Link(1, "sub-manager")));

        var response = await GetMe(factory.CreateClient(), CreateToken("sub-manager", "firecrest-manager"));

        var me = await ReadJson(response);
        me.EnumerateObject().Select(property => property.Name)
            .Should().BeEquivalentTo(new[] { "id", "name", "role", "manager_id", "is_employee" });
    }

    [Test]
    public async Task NoToken_Returns401()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await GetMe(factory.CreateClient(), null);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task InvalidToken_Returns401()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await GetMe(factory.CreateClient(), "not-a-jwt");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task UnlinkedEmployee_Returns403()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await GetMe(factory.CreateClient(), CreateToken("sub-unlinked", "firecrest-manager"));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await ReadJson(response)).GetProperty("error").GetString().Should().Be("identity_not_linked");
    }

    [Test]
    public async Task SameSubjectFromAnotherIssuer_IsNotLinked()
    {
        await using var factory = CreateFactory("Oidc",
            db => db.userIdentities.Add(Link(1, "sub-manager", "http://other-issuer.example/")));

        var response = await GetMe(factory.CreateClient(), CreateToken("sub-manager", "firecrest-manager"));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Test]
    public async Task RoleMismatch_Returns403()
    {
        // Linked to the manager record, but authentik only grants developer
        await using var factory = CreateFactory("Oidc", db => db.userIdentities.Add(Link(1, "sub-mismatch")));

        var response = await GetMe(factory.CreateClient(), CreateToken("sub-mismatch", "firecrest-developer"));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await ReadJson(response)).GetProperty("error").GetString().Should().Be("role_mismatch");
    }

    [Test]
    public async Task MultipleApplicationRoles_Returns403()
    {
        await using var factory = CreateFactory("Oidc", db => db.userIdentities.Add(Link(1, "sub-many")));

        var response = await GetMe(factory.CreateClient(),
            CreateToken("sub-many", "firecrest-manager", "firecrest-sd"));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await ReadJson(response)).GetProperty("error").GetString().Should().Be("ambiguous_application_roles");
    }

    [Test]
    public async Task NoApplicationRole_Returns403()
    {
        await using var factory = CreateFactory("Oidc", db => db.userIdentities.Add(Link(1, "sub-nogroup")));

        var response = await GetMe(factory.CreateClient(), CreateToken("sub-nogroup", "authentik Admins"));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await ReadJson(response)).GetProperty("error").GetString().Should().Be("no_application_role");
    }

    [Test]
    public async Task AdminWithoutEmployeeRecord_IsAuthenticatedButHasNoEmployee()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await GetMe(factory.CreateClient(), CreateToken("sub-admin", "firecrest-admin"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var me = await ReadJson(response);
        me.GetProperty("role").GetString().Should().Be("Admin");
        me.GetProperty("is_employee").GetBoolean().Should().BeFalse();
        me.GetProperty("id").ValueKind.Should().Be(JsonValueKind.Null);
        me.GetProperty("manager_id").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Test]
    public async Task AdminLinkedToAManagerRecord_IsDeniedAsRoleMismatch()
    {
        // An admin group does not turn a manager employee record into an admin
        await using var factory = CreateFactory("Oidc", db => db.userIdentities.Add(Link(1, "sub-admin-linked")));

        var response = await GetMe(factory.CreateClient(), CreateToken("sub-admin-linked", "firecrest-admin"));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Test]
    public async Task ClientCannotChooseTheEmployee()
    {
        await using var factory = CreateFactory("Oidc", db =>
        {
            db.userIdentities.Add(Link(2, "sub-dev"));
            db.userIdentities.Add(Link(1, "sub-manager"));
        });

        var response = await GetMe(factory.CreateClient(), CreateToken("sub-dev", "firecrest-developer"),
            "/me?id=1&user_id=1&subject=sub-manager");

        (await ReadJson(response)).GetProperty("id").GetInt32().Should().Be(2);
    }

    [Test]
    public async Task PrototypeMode_DoesNotExposeMe_AndExistingEndpointsStillWork()
    {
        await using var factory = CreateFactory("Prototype");
        var client = factory.CreateClient();

        var me = await GetMe(client, CreateToken("sub-dev", "firecrest-developer"));
        var users = await client.GetAsync("/admin/users");

        me.StatusCode.Should().Be(HttpStatusCode.NotFound);
        users.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task LinkingIdentities_LeavesEmployeesAndManagersUnchanged()
    {
        await using var factory = CreateFactory("Oidc", db =>
        {
            db.userIdentities.Add(Link(1, "sub-manager"));
            db.userIdentities.Add(Link(2, "sub-dev"));
        });

        var response = await GetMe(factory.CreateClient(), CreateToken("sub-manager", "firecrest-manager"), "/admin/users");

        var users = (await ReadJson(response)).EnumerateArray().ToList();
        users.Should().HaveCount(3);
        users.Single(user => user.GetProperty("id").GetInt32() == 2)
            .GetProperty("manager_id").GetInt32().Should().Be(1);
        users.Single(user => user.GetProperty("id").GetInt32() == 3)
            .GetProperty("name").GetString().Should().Be("Sarah Parker");
    }

    [Test]
    public async Task DeletingAnIdentityLink_KeepsTheEmployee()
    {
        await using var factory = CreateFactory("Oidc", db => db.userIdentities.Add(Link(2, "sub-dev")));
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FirecrestDbContext>();
            db.userIdentities.RemoveRange(db.userIdentities);
            db.SaveChanges();
        }

        // An admin can still read the employee after the link is gone
        var response = await GetMe(factory.CreateClient(), CreateToken("sub-admin", "firecrest-admin"), "/admin/users/2");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // The in-memory database does not enforce unique indexes, so check the model declares them.
    // The real constraints are exercised against Postgres when the migration script is run.
    [Test]
    public void DuplicateIdentityMappings_AreRejectedByUniqueIndexes()
    {
        var options = new DbContextOptionsBuilder<FirecrestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        using var db = new FirecrestDbContext(options);

        var entity = db.Model.FindEntityType(typeof(UserIdentity))!;
        var uniqueIndexes = entity.GetIndexes().Where(index => index.IsUnique)
            .Select(index => string.Join(",", index.Properties.Select(property => property.Name)))
            .ToList();

        uniqueIndexes.Should().Contain("issuer,subject");
        uniqueIndexes.Should().Contain("user_id");
        entity.GetTableName().Should().Be("user_identity");
    }

    [TestCase(new[] { "firecrest-manager" }, new[] { "Manager" })]
    [TestCase(new[] { "firecrest-developer" }, new[] { "Dev" })]
    [TestCase(new[] { "firecrest-sd" }, new[] { "SD" })]
    [TestCase(new[] { "firecrest-admin" }, new[] { "Admin" })]
    [TestCase(new[] { "authentik Admins", "somebody" }, new string[0])]
    [TestCase(new[] { "firecrest-sd", "firecrest-sd" }, new[] { "SD" })]
    public void GroupMapping_ReturnsApplicationRoles(string[] groups, string[] expected)
    {
        AppRoles.FromGroups(groups).Should().BeEquivalentTo(expected);
    }
}

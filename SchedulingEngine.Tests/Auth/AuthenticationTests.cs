using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using Firecrest.Api.Data;
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

// Starts the real API in memory with a local signing key, authentik is never contacted
[TestFixture]
public class AuthenticationTests
{
    private const string Issuer = "http://localhost:9000/application/o/firecrest/";
    private const string Audience = "test-api-audience";

    private RsaSecurityKey _signingKey = null!;
    private RsaSecurityKey _otherKey = null!;

    [OneTimeSetUp]
    public void CreateKeys()
    {
        _signingKey = new RsaSecurityKey(RSA.Create(2048)) { KeyId = "test-key" };
        _otherKey = new RsaSecurityKey(RSA.Create(2048)) { KeyId = "other-key" };
    }

    // Build the API with the given Auth:Mode and environment
    private WebApplicationFactory<Program> CreateFactory(
        string mode,
        string environment = "Development",
        string? audience = Audience)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment(environment);
            builder.UseSetting("Auth:Mode", mode);
            builder.UseSetting("Auth:Oidc:Authority", Issuer);
            builder.UseSetting("Auth:Oidc:Audience", audience ?? "");

            builder.ConfigureServices(services =>
            {
                // Swap Postgres for an in-memory database
                services.RemoveAll<DbContextOptions<FirecrestDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<FirecrestDbContext>>();
                services.AddDbContext<FirecrestDbContext>(options =>
                    options.UseInMemoryDatabase(Guid.NewGuid().ToString()));

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
    }

    // Make a signed JWT, each parameter changes one thing at a time
    private string CreateToken(
        string issuer = Issuer,
        string audience = Audience,
        DateTime? expires = null,
        SecurityKey? key = null)
    {
        var claims = new List<Claim>
        {
            new("sub", "user-subject-123"),
            new("preferred_username", "test-manager"),
            new("groups", "firecrest-manager"),
            new("groups", "firecrest-admin")
        };

        var now = DateTime.UtcNow;
        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            notBefore: now.AddMinutes(-10),
            expires: expires ?? now.AddMinutes(10),
            signingCredentials: new SigningCredentials(key ?? _signingKey, SecurityAlgorithms.RsaSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static async Task<HttpResponseMessage> GetAuthMe(HttpClient client, string? token)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/auth/me");
        if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await client.SendAsync(request);
    }

    [Test]
    public async Task PrototypeMode_ExistingEndpointsWorkWithoutToken()
    {
        await using var factory = CreateFactory("Prototype");
        var client = factory.CreateClient();

        var response = await client.GetAsync("/admin/users");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task PrototypeMode_DoesNotExposeAuthMe()
    {
        await using var factory = CreateFactory("Prototype");
        var client = factory.CreateClient();

        var response = await GetAuthMe(client, CreateToken());

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Test]
    public async Task OidcMode_RequiresLoginOnExistingEndpoints()
    {
        await using var factory = CreateFactory("Oidc");
        var client = factory.CreateClient();

        var response = await client.GetAsync("/admin/users");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task OidcMode_AuthMeRejectsMissingToken()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await GetAuthMe(factory.CreateClient(), null);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task OidcMode_AuthMeRejectsMalformedToken()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await GetAuthMe(factory.CreateClient(), "not-a-jwt");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task OidcMode_AuthMeRejectsExpiredToken()
    {
        await using var factory = CreateFactory("Oidc");
        var token = CreateToken(expires: DateTime.UtcNow.AddMinutes(-5));

        var response = await GetAuthMe(factory.CreateClient(), token);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task OidcMode_AuthMeRejectsWrongIssuer()
    {
        await using var factory = CreateFactory("Oidc");
        var token = CreateToken(issuer: "http://other.example/application/o/firecrest/");

        var response = await GetAuthMe(factory.CreateClient(), token);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task OidcMode_AuthMeRejectsWrongAudience()
    {
        await using var factory = CreateFactory("Oidc");
        var token = CreateToken(audience: "some-other-api");

        var response = await GetAuthMe(factory.CreateClient(), token);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task OidcMode_AuthMeRejectsTokenSignedWithUnknownKey()
    {
        await using var factory = CreateFactory("Oidc");
        var token = CreateToken(key: _otherKey);

        var response = await GetAuthMe(factory.CreateClient(), token);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task OidcMode_AuthMeRejectsUnsignedToken()
    {
        await using var factory = CreateFactory("Oidc");
        var unsigned = new JwtSecurityToken(
            Issuer, Audience, new[] { new Claim("sub", "x") },
            DateTime.UtcNow.AddMinutes(-1), DateTime.UtcNow.AddMinutes(10));
        var token = new JwtSecurityTokenHandler().WriteToken(unsigned);

        var response = await GetAuthMe(factory.CreateClient(), token);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task OidcMode_AuthMeAcceptsValidTokenAndReadsClaims()
    {
        await using var factory = CreateFactory("Oidc");

        var response = await GetAuthMe(factory.CreateClient(), CreateToken());

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var root = json.RootElement;
        root.GetProperty("subject").GetString().Should().Be("user-subject-123");
        root.GetProperty("username").GetString().Should().Be("test-manager");
        root.GetProperty("groups").EnumerateArray().Select(group => group.GetString())
            .Should().BeEquivalentTo(new[] { "firecrest-manager", "firecrest-admin" });
    }

    [Test]
    public async Task OidcMode_AuthMeDoesNotReturnTheToken()
    {
        await using var factory = CreateFactory("Oidc");
        var token = CreateToken();

        var response = await GetAuthMe(factory.CreateClient(), token);

        (await response.Content.ReadAsStringAsync()).Should().NotContain(token);
    }

    [Test]
    public void PrototypeMode_CannotStartInProduction()
    {
        using var factory = CreateFactory("Prototype", environment: "Production");

        var act = () => factory.CreateClient();

        act.Should().Throw<Exception>().Which.ToString().Should().Contain("only allowed in the Development");
    }

    [Test]
    public void OidcMode_CannotStartWithoutAnAudience()
    {
        using var factory = CreateFactory("Oidc", audience: null);

        var act = () => factory.CreateClient();

        act.Should().Throw<Exception>().Which.ToString().Should().Contain("Auth:Oidc:Audience");
    }

    [Test]
    public void UnknownMode_CannotStart()
    {
        using var factory = CreateFactory("Banana");

        var act = () => factory.CreateClient();

        act.Should().Throw<Exception>().Which.ToString().Should().Contain("Unknown Auth:Mode");
    }
}

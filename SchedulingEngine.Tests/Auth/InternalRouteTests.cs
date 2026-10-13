using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using Firecrest.Api.Data;
using FluentAssertions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace Firecrest.Tests.Auth;

// The API may only be able to reach the identity server at an internal address (for example inside
// Docker) while tokens name the public address as their issuer. These tests use a stub identity
// server and a public hostname that does not exist, so the only way the keys can be found is the
// internal route, and the issuer must still match exactly.
[TestFixture]
public class InternalRouteTests
{
    private const string Audience = "test-api-audience";
    private const string PublicHost = "auth-host.invalid";

    private RSA _rsa = null!;
    private SigningCredentials _credentials = null!;
    private WebApplication _stub = null!;
    private int _port;

    private string PublicIssuer => $"http://{PublicHost}:{_port}/application/o/firecrest/";

    [OneTimeSetUp]
    public async Task StartStubIdentityServer()
    {
        _rsa = RSA.Create(2048);
        _credentials = new SigningCredentials(new RsaSecurityKey(_rsa) { KeyId = "stub-key" }, SecurityAlgorithms.RsaSha256);
        var parameters = _rsa.ExportParameters(false);

        var builder = WebApplication.CreateBuilder();
        builder.Logging.ClearProviders();
        _stub = builder.Build();

        // Like authentik, the issuer in the discovery document is built from the Host the caller used
        _stub.MapGet("/application/o/firecrest/.well-known/openid-configuration", (HttpContext context) =>
        {
            var issuer = $"http://{context.Request.Host}/application/o/firecrest/";
            return Results.Json(new { issuer, jwks_uri = issuer + "jwks/" });
        });
        _stub.MapGet("/application/o/firecrest/jwks/", () => Results.Json(new
        {
            keys = new[]
            {
                new
                {
                    kty = "RSA", use = "sig", kid = "stub-key", alg = "RS256",
                    n = Base64UrlEncoder.Encode(parameters.Modulus),
                    e = Base64UrlEncoder.Encode(parameters.Exponent)
                }
            }
        }));

        _stub.Urls.Add("http://127.0.0.1:0");
        await _stub.StartAsync();
        _port = new Uri(_stub.Urls.First()).Port;
    }

    [OneTimeTearDown]
    public async Task StopStubIdentityServer()
    {
        await _stub.StopAsync();
        await _stub.DisposeAsync();
        _rsa.Dispose();
    }

    private WebApplicationFactory<Program> CreateFactory(bool useInternalRoute)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("Auth:Mode", "Oidc");
            builder.UseSetting("Auth:Oidc:Authority", PublicIssuer);
            builder.UseSetting("Auth:Oidc:Audience", Audience);
            if (useInternalRoute) builder.UseSetting("Auth:Oidc:InternalBaseUrl", $"http://127.0.0.1:{_port}");

            builder.ConfigureServices(services =>
            {
                services.RemoveAll<DbContextOptions<FirecrestDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<FirecrestDbContext>>();
                services.AddDbContext<FirecrestDbContext>(options =>
                    options.UseInMemoryDatabase(Guid.NewGuid().ToString()));
            });
        });
    }

    private string Token(string issuer, string audience = Audience, DateTime? expires = null)
    {
        var now = DateTime.UtcNow;
        var token = new JwtSecurityToken(
            issuer, audience,
            new[] { new Claim("sub", "user-1"), new Claim("preferred_username", "tester") },
            notBefore: now.AddMinutes(-10), expires: expires ?? now.AddMinutes(10),
            signingCredentials: _credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static async Task<HttpStatusCode> GetAuthMe(HttpClient client, string token)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/auth/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return (await client.SendAsync(request)).StatusCode;
    }

    [Test]
    public async Task KeysAreFoundThroughTheInternalRoute_WhenThePublicHostCannotBeReached()
    {
        await using var factory = CreateFactory(useInternalRoute: true);

        var status = await GetAuthMe(factory.CreateClient(), Token(PublicIssuer));

        status.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task WithoutTheInternalRoute_ThePublicHostCannotBeReached()
    {
        await using var factory = CreateFactory(useInternalRoute: false);

        var status = await GetAuthMe(factory.CreateClient(), Token(PublicIssuer));

        status.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task TheInternalAddressIsNotAcceptedAsAnIssuer()
    {
        await using var factory = CreateFactory(useInternalRoute: true);
        var internalIssuer = $"http://127.0.0.1:{_port}/application/o/firecrest/";

        var status = await GetAuthMe(factory.CreateClient(), Token(internalIssuer));

        status.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task AudienceAndLifetimeAreStillChecked_WithTheInternalRoute()
    {
        await using var factory = CreateFactory(useInternalRoute: true);
        var client = factory.CreateClient();

        (await GetAuthMe(client, Token(PublicIssuer, audience: "another-api"))).Should().Be(HttpStatusCode.Unauthorized);
        (await GetAuthMe(client, Token(PublicIssuer, expires: DateTime.UtcNow.AddMinutes(-5)))).Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task SignatureIsStillChecked_WithTheInternalRoute()
    {
        await using var factory = CreateFactory(useInternalRoute: true);
        using var otherKey = RSA.Create(2048);
        var forged = new JwtSecurityToken(
            PublicIssuer, Audience, new[] { new Claim("sub", "user-1") },
            DateTime.UtcNow.AddMinutes(-10), DateTime.UtcNow.AddMinutes(10),
            new SigningCredentials(new RsaSecurityKey(otherKey) { KeyId = "stub-key" }, SecurityAlgorithms.RsaSha256));

        var status = await GetAuthMe(factory.CreateClient(), new JwtSecurityTokenHandler().WriteToken(forged));

        status.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public void InvalidInternalBaseUrl_StopsTheApiFromStarting()
    {
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("Auth:Mode", "Oidc");
            builder.UseSetting("Auth:Oidc:Authority", PublicIssuer);
            builder.UseSetting("Auth:Oidc:Audience", Audience);
            builder.UseSetting("Auth:Oidc:InternalBaseUrl", "not a url");
        });

        var act = () => factory.CreateClient();

        act.Should().Throw<Exception>().Which.ToString().Should().Contain("Auth:Oidc:InternalBaseUrl");
    }
}

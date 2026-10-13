using System.Net.Sockets;
using Firecrest.Api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.IdentityModel.Tokens;

namespace Firecrest.Api.Auth;

// How the API authenticates requests. Prototype keeps the current open API for local development,
// Oidc validates JWT access tokens issued by authentik.
public static class AuthSetup
{
    public const string PrototypeMode = "Prototype";
    public const string OidcMode = "Oidc";

    // Read Auth:Mode, a missing value is Prototype, which production refuses below
    public static string GetMode(IConfiguration configuration)
    {
        return configuration["Auth:Mode"] ?? PrototypeMode;
    }

    public static bool IsOidc(IConfiguration configuration)
    {
        return GetMode(configuration) == OidcMode;
    }

    // Register authentication services for the chosen mode, throws on an unsafe or incomplete setup
    public static void AddFirecrestAuth(this WebApplicationBuilder builder)
    {
        var mode = GetMode(builder.Configuration);

        if (mode == PrototypeMode)
        {
            // Prototype mode leaves every endpoint open, so it is only allowed in Development
            if (!builder.Environment.IsDevelopment())
            {
                throw new InvalidOperationException(
                    $"Auth:Mode '{PrototypeMode}' is only allowed in the Development environment. Set Auth:Mode to '{OidcMode}'.");
            }
            return;
        }

        if (mode != OidcMode)
        {
            throw new InvalidOperationException(
                $"Unknown Auth:Mode '{mode}'. Use '{PrototypeMode}' or '{OidcMode}'.");
        }

        var authority = builder.Configuration["Auth:Oidc:Authority"];
        var audience = builder.Configuration["Auth:Oidc:Audience"];
        var internalBaseUrl = builder.Configuration["Auth:Oidc:InternalBaseUrl"];

        // Never guess these, a missing value must stop the API from starting
        if (string.IsNullOrWhiteSpace(authority))
        {
            throw new InvalidOperationException("Auth:Oidc:Authority must be set when Auth:Mode is 'Oidc'.");
        }
        if (string.IsNullOrWhiteSpace(audience))
        {
            throw new InvalidOperationException("Auth:Oidc:Audience must be set when Auth:Mode is 'Oidc'.");
        }

        Uri? internalUri = null;
        if (!string.IsNullOrWhiteSpace(internalBaseUrl)
            && (!Uri.TryCreate(internalBaseUrl, UriKind.Absolute, out internalUri)
                || (internalUri.Scheme != Uri.UriSchemeHttp && internalUri.Scheme != Uri.UriSchemeHttps)))
        {
            throw new InvalidOperationException("Auth:Oidc:InternalBaseUrl must be an absolute http or https URL.");
        }

        builder.Services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                // Signing keys and issuer come from the authority's OIDC discovery document
                options.Authority = authority;
                options.Audience = audience;

                // Plain http metadata is only accepted for local development
                options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();

                // Keep claim names as issued, for example sub and groups
                options.MapInboundClaims = false;

                // When the API cannot reach the authority's address (for example inside Docker),
                // only the metadata and key downloads are routed to the internal address
                if (internalUri != null)
                {
                    options.BackchannelHttpHandler = CreateInternalRouteHandler(internalUri);
                }

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    RequireSignedTokens = true,
                    RequireExpirationTime = true,
                    ValidAlgorithms = new[] { SecurityAlgorithms.RsaSha256 },
                    ClockSkew = TimeSpan.FromSeconds(30),
                    // authentik puts group names in the groups claim, so IsInRole works with them
                    NameClaimType = "preferred_username",
                    RoleClaimType = "groups"
                };
            });

        builder.Services.AddAuthorization();
        builder.Services.AddScoped<CallerResolver>();
        builder.Services.AddScoped<WriteAuthorizer>();

        // Every controller action needs a valid token, then the access matrix in FirecrestAccessFilter
        var signedIn = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
        builder.Services.Configure<MvcOptions>(options =>
        {
            options.Filters.Add(new AuthorizeFilter(signedIn));
            options.Filters.Add<FirecrestAccessFilter>();
        });
    }

    // Connects to the internal address while the request keeps the authority's URL and Host header,
    // so the discovery document still names the authority as its issuer and nothing else is accepted
    private static HttpMessageHandler CreateInternalRouteHandler(Uri internalUri)
    {
        return new SocketsHttpHandler
        {
            ConnectCallback = async (_, cancellationToken) =>
            {
                var socket = new Socket(SocketType.Stream, ProtocolType.Tcp) { NoDelay = true };
                try
                {
                    await socket.ConnectAsync(internalUri.Host, internalUri.Port, cancellationToken);
                    return new NetworkStream(socket, ownsSocket: true);
                }
                catch
                {
                    socket.Dispose();
                    throw;
                }
            }
        };
    }

    // Add the authentication middleware, only in Oidc mode
    public static void UseFirecrestAuth(this WebApplication app)
    {
        if (!IsOidc(app.Configuration)) return;

        app.UseAuthentication();
        app.UseAuthorization();
    }

    // /auth/me and /me only exist in Oidc mode, Prototype mode has no identity to show
    public static void MapFirecrestAuthEndpoints(this WebApplication app)
    {
        if (!IsOidc(app.Configuration)) return;

        // Return who the access token belongs to, nothing is read from or written to the database
        app.MapGet("/auth/me", (HttpContext context) =>
        {
            var user = context.User;

            return Results.Ok(new
            {
                subject = user.FindFirst("sub")?.Value,
                username = user.FindFirst("preferred_username")?.Value,
                groups = user.FindAll("groups").Select(claim => claim.Value).ToArray()
            });
        }).RequireAuthorization();

        // Return the employee for the access token. The employee is found from the token issuer and
        // subject only, nothing the client sends can choose who the caller is.
        app.MapGet("/me", async (HttpContext context, CallerResolver resolver) =>
        {
            var resolved = await resolver.ResolveAsync(context.User);

            if (resolved.Caller == null)
            {
                return Results.Json(new { error = resolved.Error }, statusCode: StatusCodes.Status403Forbidden);
            }

            var caller = resolved.Caller;

            // An admin without an employee record is signed in but has no employee data
            if (caller.EmployeeId == null)
            {
                return Results.Ok(new
                {
                    id = (int?)null,
                    name = caller.Username,
                    role = AppRoles.Admin,
                    manager_id = (int?)null,
                    is_employee = false
                });
            }

            return Results.Ok(new
            {
                id = caller.EmployeeId,
                name = caller.EmployeeName,
                role = caller.StoredRole,
                manager_id = caller.ManagerId,
                is_employee = true
            });
        }).RequireAuthorization();
    }
}

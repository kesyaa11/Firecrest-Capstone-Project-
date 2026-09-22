using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Data;
using Firecrest.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS policy that allows frontend to talk to backend correctly
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: "AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddDbContext<FirecrestDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("Database"));
});

// Add Nager API as to get public holidays for NZ and PH
builder.Services.AddHttpClient("NagerAPI", client =>
{
    client.BaseAddress = new Uri("https://nagerholidays.com/api/v4/Holidays");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// Create one scheduling engine per request so controllers can use the same DbContext.
builder.Services.AddScoped<SchedulingEngine>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // Swagger allows easier visualization of the APIs (http://localhost:5000/swagger/index.html)
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Firecrest API");
    });
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseHttpsRedirection();
app.MapControllers();

app.Run();

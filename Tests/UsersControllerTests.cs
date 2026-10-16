using Firecrest.Api.Data;
using Firecrest.Api.Models;
using Firecrest.Api.Services;
using Firecrest.Api.Controllers;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using System;
using System.Threading.Tasks;

namespace Tests;

[TestFixture]
public class UsersControllerTests
{
    private FirecrestDbContext _context = null!;
    private UsersController _controller = null!;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<FirecrestDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

        _context = new FirecrestDbContext(options);
        _controller = new UsersController(_context);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
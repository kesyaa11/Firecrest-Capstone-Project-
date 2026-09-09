using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Data;
using Firecrest.Api.Models;

namespace Firecrest.Controllers;

// What the url is going to look like, admin/publicholidays is so only admins can access this part of the system
[Route("admin/publicholidays")]
[ApiController]
public class PublicHolidaysController(IHttpClientFactory httpClientFactory) : ControllerBase
{
    
}
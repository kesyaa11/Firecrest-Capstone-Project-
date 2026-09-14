using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Models;

namespace Firecrest.Api.Data;

// FirecrestDbContext is the context for the database, it shows what tables are in and what models are used
public class FirecrestDbContext : DbContext
{
    public FirecrestDbContext(DbContextOptions<FirecrestDbContext> options) : base(options) { }

    // Set users, shifts, leave requests, projects and project specifications etc as tables in the database
    public DbSet<User> users => Set<User>();
    public DbSet<Shift> shifts => Set<Shift>();
    public DbSet<LeaveRequest> leaveRequests => Set<LeaveRequest>();
    public DbSet<Project> projects => Set<Project>();
    public DbSet<ProjectSpecification> projectSpecifications => Set<ProjectSpecification>();

    // Set public holidays as tables in the database
    public DbSet<PublicHoliday> publicHolidays => Set<PublicHoliday>();
    public DbSet<PublicHolidayRegion> publicHolidaysRegions => Set<PublicHolidayRegion>();


    // Overwrite the model creation to add comments to the tables and columns
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(user => user.id);
            entity.ToTable("users");
            entity.Property(user => user.id).HasComment("Unique identifier for the user | Primary Key and auto-incremented so do not include in POST request");
            entity.Property(user => user.name).HasComment("Full name of person working at Firecrest ('First Name Last Name' eg 'John Doe')");
            entity.Property(user => user.role).HasComment("Dev team? SD team? Admin? HR? etc. This will determine what they can do in this system");
            entity.Property(user => user.country).HasComment("What country does this person work in? Country code: (NZ or PH)");
            entity.Property(user => user.team).HasComment("Unsure what this is for?"); // Learn what team is meant for
            entity.Property(user => user.manager_id).HasComment("The manager of this person"); // Probably should just be included in project as I don't believe they have a manager for multiple people it's projects
        });

        modelBuilder.Entity<Shift>(entity =>
        {
            entity.HasKey(shift => shift.id);
            entity.ToTable("shift");
            entity.Property(shift => shift.id).HasComment("Unique identifier for the shift | Primary Key and auto-incremented so do not include in POST request");
            entity.Property(shift => shift.user_id).HasComment("User assigned to this shift");
            entity.Property(shift => shift.date).HasComment("Date the shift occurs");
            entity.Property(shift => shift.duration).HasComment("Length of the shift in hours | Does not need to be included just another way of measuring workload");
            entity.Property(shift => shift.shift_start).HasComment("Start time for the shift | Does not need to be included just another way of measuring workload");
            entity.Property(shift => shift.shift_end).HasComment("End time for the shift | Does not need to be included just another way of measuring workload");
            entity.Property(shift => shift.shifts_count).HasComment("How many sprints / shifts are being worked this day | If you are to work 2 sprints in a day this is set to 2");
            entity.Property(shift => shift.slot_number).HasComment("Assigned slot number for the shift allocation?");
        });

        modelBuilder.Entity<LeaveRequest>(entity =>
        {
            entity.HasKey(request => request.id);
            entity.ToTable("leave_request");
            entity.Property(request => request.id).HasComment("Unique identifier for the leave request | Primary Key and auto-incremented so do not include in POST request");
            entity.Property(request => request.user_id).HasComment("User requesting leave represented as ID in the database from Users table");
            entity.Property(request => request.approver_id).HasComment("Manager / Approver of leave request ID, users table ID in database");
            entity.Property(request => request.start_date).HasComment("Leave start date");
            entity.Property(request => request.end_date).HasComment("Leave end date");
            entity.Property(request => request.leave_type).HasComment("Type of leave requested eg sick, annual, etc");
            entity.Property(request => request.status).HasComment("Accepted, rejected, pending. Allows you to see if you can have the day off or not");
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(request => request.id);
            entity.ToTable("project");
            entity.Property(request => request.id).HasComment("Unique identifier for the project | Primary Key and auto-incremented so do not include in POST request");
            entity.Property(request => request.name).HasComment("Name of the project");
            entity.Property(request => request.tracker_ref).HasComment("Reference to the project in the tracking system");
        });

        modelBuilder.Entity<ProjectSpecification>(entity =>
        {
            entity.HasKey(request => request.id);
            entity.ToTable("project_specification");
            entity.Property(request => request.id).HasComment("Unique identifier for the project specification | Primary Key and auto-incremented so do not include in POST request");
            entity.Property(request => request.project_id).HasComment("ID of the project this specification belongs to");
            entity.Property(request => request.author_id).HasComment("ID of a user? Unsure what this is for"); // Check with William what author_id is meant for
            entity.Property(request => request.version).HasComment("Version of the project");
            entity.Property(request => request.content).HasComment("Content of the project");
        });

        modelBuilder.Entity<PublicHoliday>(entity =>
        {
            entity.HasKey(holiday => holiday.id);
            entity.ToTable("public_holiday");
            entity.Property(holiday => holiday.id).HasComment("Unique identifier for the public holiday | Primary Key and auto-incremented so do not include in POST request");
            entity.Property(holiday => holiday.name).HasComment("Name of the public holiday");
            entity.Property(holiday => holiday.type).HasComment("Type of public holiday eg full day, half day");
            entity.Property(holiday => holiday.date).HasComment("Date of the public holiday in time zone of country");
            entity.Property(holiday => holiday.country).HasComment("Country code of the public holiday (NZ or PH)");
            entity.Property(holiday => holiday.is_national).HasComment("Is this a national public holiday?");
        });

        modelBuilder.Entity<PublicHolidayRegion>(entity =>
        {
            entity.HasKey(region => region.id);
            entity.ToTable("public_holiday_regions");
            entity.Property(region => region.id).HasComment("Unique identifier for the public holiday region | Primary Key and auto-incremented so do not include in POST request");
            entity.Property(region => region.holiday_id).HasComment("The public holiday that this region celebrates");
            entity.Property(region => region.region_code).HasComment("Region eg Manawatu");
        });
    }
}
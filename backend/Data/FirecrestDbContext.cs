using Microsoft.EntityFrameworkCore;
using Firecrest.Api.Models;

namespace Firecrest.Api.Data;

// FirecrestDbContext is the context for the database, it shows what tables are in and what models are used
public class FirecrestDbContext : DbContext
{
    public FirecrestDbContext(DbContextOptions<FirecrestDbContext> options) : base(options) { }

    // Set users, shifts, leave requests, projects and project specifications etc as tables in the database
    // Module A Database Tables
    public DbSet<User> users => Set<User>();
    public DbSet<Shift> shifts => Set<Shift>();
    public DbSet<LeaveRequest> leaveRequests => Set<LeaveRequest>();

    // Module B Database Tables
    public DbSet<Project> projects => Set<Project>();
    public DbSet<ProjectSpecification> projectSpecifications => Set<ProjectSpecification>();
    public DbSet<SpecificationDevDay> specificationDevDays => Set<SpecificationDevDay>();
    public DbSet<SpecificationHandoff> specificationHandoffs => Set<SpecificationHandoff>();
    public DbSet<SpecificationUsers> specificationUsers => Set<SpecificationUsers>();
    public DbSet<HandoffDelay> handoffDelays => Set<HandoffDelay>();
    public DbSet<HandoffSignoff> handoffSignoffs => Set<HandoffSignoff>();

    // Module C Database Tables


    // Set public holidays as tables in the database
    public DbSet<PublicHoliday> publicHolidays => Set<PublicHoliday>();

    // Overwrite the model creation to add comments to the tables and columns
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Module A Database Tables
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
            entity.Property(shift => shift.project_id).HasComment("ID of the project this shift will be used for");
            entity.Property(shift => shift.specification_id).HasComment("ID of the specification this shift will be used for");
            entity.Property(shift => shift.work_type).HasComment("Type of work scheduled for this shift");
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

        // Module B Database Tables
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(request => request.id);
            entity.ToTable("project");
            entity.Property(request => request.id).HasComment("Unique identifier for the project | Primary Key and auto-incremented so do not include in POST request");
            entity.Property(request => request.name).HasComment("Name of the project");
            entity.Property(request => request.client).HasComment("The client this project is for");
            entity.Property(request => request.tracker_ref).HasComment("Reference to the project in the tracking system");
            entity.Property(request => request.final_date).HasComment("Final date for the project | This is the date the project is needed to be completed by");
        });

        modelBuilder.Entity<ProjectSpecification>(entity =>
        {
            entity.HasKey(request => request.id);
            entity.ToTable("project_specification");
            entity.Property(request => request.id).HasComment("Unique identifier for the project specification | Primary Key and auto-incremented so do not include in POST request");
            entity.Property(request => request.project_id).HasComment("ID of the project this specification belongs to");
            entity.Property(request => request.name).HasComment("Name of this specification");
            entity.Property(request => request.author_id).HasComment("ID of a user? Unsure what this is for");
            entity.Property(request => request.version).HasComment("Version of the project");
            entity.Property(request => request.link).HasComment("Link to ticketing system");
            entity.Property(request => request.specs).HasComment("Boolean value indicating if the specifications of the specification are complete");
            entity.Property(request => request.build).HasComment("Boolean value indicating if the build of the specification is complete");
            entity.Property(request => request.test_sheet).HasComment("Boolean value indicating if the test sheet of the specification is complete");
            entity.Property(request => request.launch_plan).HasComment("Boolean value indicating if the launch plan of the specification is complete");
            entity.Property(request => request.billing).HasComment("Billing information for the specification eg billable hours, billable by amount of dev days, non billable etc");
            entity.Property(request => request.roadmap).HasComment("Boolean value indicating if the roadmap of the specification is complete");
            entity.Property(request => request.target_date).HasComment("Target date for the specification to be completed by");
        });

        // Module B User assigned to specification table, allows multiple users to be assigned to a specification
        modelBuilder.Entity<SpecificationUsers>(entity =>
        {
            entity.HasKey(request => request.id);
            entity.ToTable("specification_users");
            entity.Property(request => request.id).HasComment("Unique identifier for the specification user | Primary Key and auto-incremented so do not include in POST request");
            entity.Property(request => request.project_id).HasComment("ID of the project the specification belongs to");
            entity.Property(request => request.specification_id).HasComment("ID of the specification this user is assigned to");
            entity.Property(request => request.user_id).HasComment("ID of the user assigned to this specification");
        });

        modelBuilder.Entity<SpecificationHandoff>(entity =>
        {
            entity.HasKey(request => request.id);
            entity.ToTable("specification_handoff");
            entity.Property(request => request.id).HasComment("Unique identifier for the specification handoff | Primary Key and auto-incremented so do not include in POST request");
            entity.Property(request => request.project_id).HasComment("ID of the project this specification handoff belongs to");
            entity.Property(request => request.specification_id).HasComment("ID of the specification this handoff is for");
            entity.Property(request => request.notified).HasComment("Date and time when the handoff was made and notified to relevant personnel");
            entity.Property(request => request.expected).HasComment("Expected date and time for the handoff to be completed");
            entity.Property(request => request.status).HasComment("Status of the handoff (e.g., pending, completed, delayed)");
            entity.Property(request => request.description).HasComment("Description of what is in this handoff / what is needing to be tested etc");
            entity.Property(request => request.success).HasComment("Did the handoff testing succeed or fail?");
        });

        modelBuilder.Entity<HandoffDelay>(entity =>
        {
            entity.HasKey(request => request.id);
            entity.ToTable("handoff_delay");
            entity.Property(request => request.id).HasComment("Unique identifier for the handoff delay | Primary Key and auto-incremented so do not include in POST request");
            entity.Property(request => request.handoff_id).HasComment("ID of the specification handoff this delay is associated with");
            entity.Property(request => request.reason).HasComment("Reason for the delay");
            entity.Property(request => request.delay_hours).HasComment("Number of hours the handoff is delayed by");
        });

        modelBuilder.Entity<HandoffSignoff>(entity =>
        {
            entity.HasKey(request => request.id);
            entity.ToTable("handoff_signoff");
            entity.Property(request => request.id).HasComment("Unique identifier for the handoff signoff | Primary Key and auto-incremented so do not include in POST request");
            entity.Property(request => request.handoff_id).HasComment("ID of the specification handoff this signoff is associated with");
            entity.Property(request => request.signer_id).HasComment("ID of the user who signed off on the handoff");
            entity.Property(request => request.handoff_message).HasComment("Message from the signer about the handoff");
            entity.Property(request => request.signoff_date).HasComment("Date and time when the handoff was signed off");
            entity.Property(request => request.success).HasComment("Did testing fail or succeed? Handoff_message to explain");
        });

        modelBuilder.Entity<SpecificationDevDay>(entity =>
        {
            entity.HasKey(request => request.id);
            entity.ToTable("specification_dev_day");
            entity.Property(request => request.id).HasComment("Unique identifier for the specification dev day | Primary Key and auto-incremented so do not include in POST request");
            entity.Property(request => request.specification_id).HasComment("ID of the specification this dev day is associated with");
            entity.Property(request => request.specificied_month).HasComment("What month these dev days are for eg January 2026, December 2027 etc");
            entity.Property(request => request.dev_days).HasComment("Number of dev days to be spent on this specification this month");
        });

        // Module C Database Tables


        // Public Holiday Database Tables
        modelBuilder.Entity<PublicHoliday>(entity =>
        {
            entity.HasKey(holiday => holiday.id);
            entity.ToTable("public_holiday");
            entity.Property(holiday => holiday.id).HasComment("Unique identifier for the public holiday | Primary Key and auto-incremented so do not include in POST request");
            entity.Property(holiday => holiday.name).HasComment("Name of the public holiday");
            entity.Property(holiday => holiday.date).HasComment("Date of the public holiday in time zone of country");
            entity.Property(holiday => holiday.country).HasComment("Country code of the public holiday (NZ or PH)");
            entity.Property(holiday => holiday.is_national).HasComment("Is this a national public holiday?");
            entity.Property(holiday => holiday.regions).HasComment("List of regions that celebrate this public holiday");
        });
    }
}

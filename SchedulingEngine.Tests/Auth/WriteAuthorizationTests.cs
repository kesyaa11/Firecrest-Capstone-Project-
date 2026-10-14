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

// Every write endpoint against every kind of caller. Each case gets its own API and database, and a
// denied request must leave the database exactly as it was.
[TestFixture]
public class WriteAuthorizationTests
{
    private const string Issuer = "http://localhost:9000/application/o/firecrest/";
    private const string Audience = "test-api-audience";

    // Placeholder for "any success, not a 401 or 403" where business validation decides the exact code
    private const int Allowed = -1;

    // Two teams
    //   1 Terry (Manager) -> 2 Ben (Dev), 3 Sarah (SD)
    //   4 Other (Manager) -> 5 Dev Two (Dev), 6 SD Two (SD)
    private static readonly RsaSecurityKey SigningKey = new(RSA.Create(2048)) { KeyId = "test-key" };

    public class Ids
    {
        public int LeaveDev, LeaveSd, LeaveManager, LeaveOther;
        public int BalanceDev, BalanceOther;
        public int ShiftDev, ShiftOther;
        public int Handoff, SignoffSarah, SignoffOtherSd;
        public int Project, Spec, DevDay, SpecUser, Delay, ChangeRequest;
    }

    public record WriteCase(string Name, string Who, string Method, Func<Ids, string> Path, Func<Ids, object?>? Body, int Expected);

    private static WriteCase Case(string name, string who, string method, string path, object? body, int expected) =>
        new(name, who, method, _ => path, body == null ? null : _ => body, expected);

    private static WriteCase Case(string name, string who, string method, Func<Ids, string> path, Func<Ids, object?>? body, int expected) =>
        new(name, who, method, path, body, expected);

    private static WriteCase Case(string name, string who, string method, Func<Ids, string> path, object? body, int expected) =>
        new(name, who, method, path, body == null ? null : _ => body, expected);

    private static object Leave(int user, int approver, string status = "Pending", string start = "2026-10-05", string end = "2026-10-06") =>
        new { user_id = user, approver_id = approver, start_date = start, end_date = end, leave_type = "Annual Leave", status };

    private static object LeaveWithId(int id, int user, int approver, string status, string start = "2026-09-21", string end = "2026-09-22") =>
        new { id, user_id = user, approver_id = approver, start_date = start, end_date = end, leave_type = "Annual Leave", status };

    private static object Balance(int id, int user) =>
        new { id, user_id = user, sick_days = 9, al_accured = 80, al_taken_accured = 0, al_outstanding = 80, annual_owing = 0, alternative_days = 0 };

    private static object NewShift(int user) =>
        new { user_id = user, date = "2026-09-22", shift_start = "08:00:00", shift_end = "10:00:00", slot_number = 1, work_type = "Development" };

    private static object HandoffBody(int id, string status, int project = 1, int spec = 1, string description = "Original handoff") =>
        new { id, project_id = project, specification_id = spec, notified = "2026-09-25T09:45:00", expected = "2026-09-30T17:00:00", status, description, success = (bool?)null };

    public static IEnumerable<TestCaseData> Cases()
    {
        var cases = new List<WriteCase>
        {
            // ----- Who is calling -----
            Case("anonymous cannot add a user", "anonymous", "POST", "/admin/users", new { name = "X", role = "Manager", country = "NZ", region = "NZ-WGN" }, 401),
            Case("invalid token cannot delete leave", "invalid", "DELETE", i => $"/admin/leave-requests/{i.LeaveDev}", null, 401),
            Case("unlinked identity cannot create leave", "unlinked", "POST", "/admin/leave-requests", Leave(2, 1), 403),
            Case("role mismatch cannot create a shift", "mismatch", "POST", "/admin/shifts", NewShift(2), 403),
            Case("admin cannot create a shift", "admin", "POST", "/admin/shifts", NewShift(2), 403),
            Case("admin cannot create leave", "admin", "POST", "/admin/leave-requests", Leave(2, 1), 403),

            // ----- Leave requests: create -----
            Case("developer requests their own leave", "dev", "POST", "/admin/leave-requests", Leave(2, 1), Allowed),
            Case("developer cannot request leave for a colleague", "dev", "POST", "/admin/leave-requests", Leave(3, 1), 403),
            Case("developer cannot create an approved request", "dev", "POST", "/admin/leave-requests", Leave(2, 1, "Approved"), 403),
            Case("developer cannot choose a different approver", "dev", "POST", "/admin/leave-requests", Leave(2, 4), 403),
            Case("developer cannot choose the record id", "dev", "POST", "/admin/leave-requests", LeaveWithId(999, 2, 1, "Pending"), 403),
            Case("manager cannot record leave for themselves", "manager", "POST", "/admin/leave-requests", Leave(1, 1), 403),
            Case("manager records approved leave for a direct report", "manager", "POST", "/admin/leave-requests", Leave(2, 1, "Approved"), Allowed),
            Case("manager records pending leave for a direct report", "manager", "POST", "/admin/leave-requests", Leave(3, 1), Allowed),
            Case("manager cannot record leave for another team", "manager", "POST", "/admin/leave-requests", Leave(5, 1, "Approved"), 403),
            Case("manager cannot address leave to someone else", "manager", "POST", "/admin/leave-requests", Leave(2, 4, "Approved"), 403),
            Case("manager cannot record a rejected request", "manager", "POST", "/admin/leave-requests", Leave(2, 1, "Rejected"), 403),

            // ----- Leave requests: decide, edit -----
            Case("developer cannot approve their own leave (PATCH)", "dev", "PATCH", i => $"/admin/leave-requests/{i.LeaveDev}", new { status = "Approved" }, 403),
            Case("developer cannot approve their own leave (PUT)", "dev", "PUT", i => $"/admin/leave-requests/{i.LeaveDev}", i => LeaveWithId(i.LeaveDev, 2, 1, "Approved"), 403),
            Case("developer cannot move their leave to another employee", "dev", "PATCH", i => $"/admin/leave-requests/{i.LeaveDev}", new { user_id = 3 }, 403),
            Case("developer cannot change their leave dates", "dev", "PATCH", i => $"/admin/leave-requests/{i.LeaveDev}", new { end_date = "2026-12-31" }, 403),
            Case("developer cannot touch a colleague's leave", "dev", "PATCH", i => $"/admin/leave-requests/{i.LeaveSd}", new { status = "Rejected" }, 403),
            Case("SD cannot decide a developer's leave", "sd", "PATCH", i => $"/admin/leave-requests/{i.LeaveDev}", new { status = "Approved" }, 403),
            Case("manager changes a direct report's leave dates", "manager", "PATCH", i => $"/admin/leave-requests/{i.LeaveDev}", new { start_date = "2026-09-23", end_date = "2026-09-24" }, Allowed),
            Case("manager changes a direct report's leave type", "manager", "PATCH", i => $"/admin/leave-requests/{i.LeaveDev}", new { leave_type = "Sick Leave" }, Allowed),
            Case("manager replaces a direct report's leave (PUT)", "manager", "PUT", i => $"/admin/leave-requests/{i.LeaveDev}", i => LeaveWithId(i.LeaveDev, 2, 1, "Approved", "2026-09-24", "2026-09-25"), Allowed),
            Case("manager cannot change another team's leave dates", "manager", "PATCH", i => $"/admin/leave-requests/{i.LeaveOther}", new { start_date = "2026-09-23" }, 403),
            Case("manager cannot change their own leave dates", "manager", "PATCH", i => $"/admin/leave-requests/{i.LeaveManager}", new { end_date = "2026-10-30" }, 403),
            Case("manager cannot hand a report's leave to another employee", "manager", "PUT", i => $"/admin/leave-requests/{i.LeaveDev}", i => LeaveWithId(i.LeaveDev, 3, 1, "Pending"), 403),
            Case("manager approves a direct report (PATCH)", "manager", "PATCH", i => $"/admin/leave-requests/{i.LeaveDev}", new { status = "Approved" }, Allowed),
            Case("manager approves a direct report (PUT)", "manager", "PUT", i => $"/admin/leave-requests/{i.LeaveDev}", i => LeaveWithId(i.LeaveDev, 2, 1, "Approved"), Allowed),
            Case("manager cannot approve their own leave", "manager", "PATCH", i => $"/admin/leave-requests/{i.LeaveManager}", new { status = "Approved" }, 403),
            Case("manager cannot approve another team's leave", "manager", "PATCH", i => $"/admin/leave-requests/{i.LeaveOther}", new { status = "Approved" }, 403),
            Case("manager cannot reassign a report's leave while approving", "manager", "PATCH", i => $"/admin/leave-requests/{i.LeaveDev}", new { status = "Approved", user_id = 5 }, 403),
            Case("manager cannot change the approver", "manager", "PATCH", i => $"/admin/leave-requests/{i.LeaveDev}", new { approver_id = 4 }, 403),
            Case("other manager approves their own report", "manager2", "PATCH", i => $"/admin/leave-requests/{i.LeaveOther}", new { status = "Approved" }, Allowed),

            // ----- Leave requests: delete -----
            Case("developer cancels their own pending leave", "dev", "DELETE", i => $"/admin/leave-requests/{i.LeaveDev}", null, Allowed),
            Case("developer cannot delete a colleague's leave", "dev", "DELETE", i => $"/admin/leave-requests/{i.LeaveSd}", null, 403),
            Case("SD cannot delete a developer's leave", "sd", "DELETE", i => $"/admin/leave-requests/{i.LeaveDev}", null, 403),
            Case("manager removes a direct report's leave", "manager", "DELETE", i => $"/admin/leave-requests/{i.LeaveDev}", null, Allowed),
            Case("manager cannot delete another team's leave", "manager", "DELETE", i => $"/admin/leave-requests/{i.LeaveOther}", null, 403),

            // ----- Leave balances (payroll) -----
            Case("manager sets a direct report's balance", "manager", "PUT", i => $"/admin/leave-balances/{i.BalanceDev}", i => Balance(i.BalanceDev, 2), Allowed),
            Case("manager adds a balance for a direct report", "manager", "POST", "/admin/leave-balances", Balance(0, 3), Allowed),
            Case("manager cannot add a balance for themselves", "manager", "POST", "/admin/leave-balances", Balance(0, 1), 403),
            Case("manager cannot add a balance for another team", "manager", "POST", "/admin/leave-balances", Balance(0, 6), 403),
            Case("manager cannot edit another team's balance", "manager", "PUT", i => $"/admin/leave-balances/{i.BalanceOther}", i => Balance(i.BalanceOther, 5), 403),
            Case("manager cannot point a balance at another team", "manager", "PUT", i => $"/admin/leave-balances/{i.BalanceDev}", i => Balance(i.BalanceDev, 5), 403),
            Case("developer cannot edit their own balance", "dev", "PUT", i => $"/admin/leave-balances/{i.BalanceDev}", i => Balance(i.BalanceDev, 2), 403),
            Case("developer cannot add a balance", "dev", "POST", "/admin/leave-balances", Balance(0, 3), 403),
            Case("admin cannot edit balances", "admin", "PUT", i => $"/admin/leave-balances/{i.BalanceDev}", i => Balance(i.BalanceDev, 2), 403),

            // ----- Scheduling -----
            Case("manager schedules a direct report", "manager", "POST", "/admin/shifts", NewShift(2), Allowed),
            Case("manager cannot schedule another team", "manager", "POST", "/admin/shifts", NewShift(5), 403),
            Case("developer cannot schedule", "dev", "POST", "/admin/shifts", NewShift(2), 403),
            Case("SD cannot schedule", "sd", "POST", "/admin/shifts", NewShift(3), 403),
            Case("manager edits a direct report's shift", "manager", "PATCH", i => $"/admin/shifts/{i.ShiftDev}", new { slot_number = 1 }, Allowed),
            Case("manager cannot move a shift to another team", "manager", "PATCH", i => $"/admin/shifts/{i.ShiftDev}", new { user_id = 5 }, 403),
            Case("manager cannot edit another team's shift", "manager", "PATCH", i => $"/admin/shifts/{i.ShiftOther}", new { work_type = "Development" }, 403),
            Case("manager cannot replace a shift into another team", "manager", "PUT", i => $"/admin/shifts/{i.ShiftDev}", i => new { id = i.ShiftDev, user_id = 5, date = "2026-09-15", shift_start = "08:00:00", shift_end = "10:00:00", work_type = "Development" }, 403),
            Case("manager cannot delete another team's shift", "manager", "DELETE", i => $"/admin/shifts/{i.ShiftOther}", null, 403),
            Case("manager deletes a direct report's shift", "manager", "DELETE", i => $"/admin/shifts/{i.ShiftDev}", null, Allowed),
            Case("developer cannot delete a shift", "dev", "DELETE", i => $"/admin/shifts/{i.ShiftDev}", null, 403),

            // ----- User administration -----
            Case("developer cannot add a user", "dev", "POST", "/admin/users", new { name = "X", role = "Dev", country = "NZ", region = "NZ-WGN", manager_id = 2 }, 403),
            Case("developer cannot promote themselves", "dev", "PUT", "/admin/users/2", new { id = 2, name = "Benjamin Franklin", role = "Manager", country = "NZ", region = "NZ-WGN" }, 403),
            Case("SD cannot change their own manager", "sd", "PUT", "/admin/users/3", new { id = 3, name = "Sarah Parker", role = "SD", country = "NZ", region = "NZ-WGN", manager_id = 4 }, 403),
            Case("manager adds a developer reporting to them", "manager", "POST", "/admin/users", new { name = "New Dev", role = "Dev", country = "NZ", region = "NZ-WGN", manager_id = 1 }, Allowed),
            Case("manager cannot add another manager", "manager", "POST", "/admin/users", new { name = "New Boss", role = "Manager", country = "NZ", region = "NZ-WGN", manager_id = 1 }, 403),
            Case("manager cannot add staff under someone else", "manager", "POST", "/admin/users", new { name = "New Dev", role = "Dev", country = "NZ", region = "NZ-WGN", manager_id = 4 }, 403),
            Case("manager cannot choose a user id", "manager", "POST", "/admin/users", new { id = 77, name = "New Dev", role = "Dev", country = "NZ", region = "NZ-WGN", manager_id = 1 }, 403),
            Case("manager edits a direct report", "manager", "PUT", "/admin/users/2", new { id = 2, name = "Ben F", role = "Dev", country = "NZ", region = "NZ-WGN", manager_id = 1 }, Allowed),
            Case("manager cannot promote a report", "manager", "PUT", "/admin/users/2", new { id = 2, name = "Benjamin Franklin", role = "Manager", country = "NZ", region = "NZ-WGN", manager_id = 1 }, 403),
            Case("manager cannot hand a report to another manager", "manager", "PUT", "/admin/users/2", new { id = 2, name = "Benjamin Franklin", role = "Dev", country = "NZ", region = "NZ-WGN", manager_id = 4 }, 403),
            Case("manager cannot edit their own record", "manager", "PUT", "/admin/users/1", new { id = 1, name = "Terry", role = "Manager", country = "NZ", region = "NZ-WGN" }, 403),
            Case("manager cannot edit another team's user", "manager", "PUT", "/admin/users/5", new { id = 5, name = "Dev Two", role = "Dev", country = "NZ", region = "NZ-WGN", manager_id = 1 }, 403),
            Case("manager cannot delete themselves", "manager", "DELETE", "/admin/users/1", null, 403),
            Case("manager cannot delete another team's user", "manager", "DELETE", "/admin/users/5", null, 403),
            Case("manager deletes a direct report", "manager", "DELETE", "/admin/users/2", null, Allowed),
            Case("admin adds a manager", "admin", "POST", "/admin/users", new { name = "New Boss", role = "Manager", country = "NZ", region = "NZ-WGN" }, Allowed),
            Case("admin changes a role", "admin", "PUT", "/admin/users/2", new { id = 2, name = "Benjamin Franklin", role = "SD", country = "NZ", region = "NZ-WGN", manager_id = 1 }, Allowed),
            Case("admin deletes a user", "admin", "DELETE", "/admin/users/3", null, Allowed),

            // ----- Public holidays -----
            Case("manager cannot re-sync holidays", "manager", "POST", "/admin/publicholidays/sync/2026/NZ", null, 403),
            Case("developer cannot re-sync holidays", "dev", "POST", "/admin/publicholidays/sync/2026/NZ", null, 403),

            // ----- Module B: catalogue -----
            Case("manager adds a project", "manager", "POST", "/admin/projects", new { name = "New", client = "C", tracker_ref = "TK-9" }, Allowed),
            Case("SD creates a client project", "sd", "POST", "/admin/projects", new { name = "Client Project", client = "C", tracker_ref = "TK-10" }, Allowed),
            Case("SD cannot edit a project", "sd", "PUT", i => $"/admin/projects/{i.Project}", i => new { id = i.Project, name = "Renamed", is_active = false }, 403),
            Case("manager marks a project inactive", "manager", "PUT", i => $"/admin/projects/{i.Project}", i => new { id = i.Project, name = "Firecrest Capstone", is_active = false }, Allowed),
            Case("admin marks a project inactive", "admin", "PUT", i => $"/admin/projects/{i.Project}", i => new { id = i.Project, name = "Firecrest Capstone", is_active = false }, Allowed),
            Case("admin cannot rename a project", "admin", "PUT", i => $"/admin/projects/{i.Project}", i => new { id = i.Project, name = "Renamed by admin", is_active = true }, 403),
            Case("admin cannot delete a project", "admin", "DELETE", i => $"/admin/projects/{i.Project}", null, 403),
            Case("developer cannot mark a project inactive", "dev", "PUT", i => $"/admin/projects/{i.Project}", i => new { id = i.Project, name = "Firecrest Capstone", is_active = false }, 403),
            Case("developer cannot add a project", "dev", "POST", "/admin/projects", new { name = "New" }, 403),
            Case("SD cannot delete a project", "sd", "DELETE", i => $"/admin/projects/{i.Project}", null, 403),
            Case("admin cannot add a project", "admin", "POST", "/admin/projects", new { name = "New" }, 403),
            Case("developer moves a specification through its stages", "dev", "PUT", i => $"/admin/projectspecifications/{i.Spec}", i => new { id = i.Spec, project_id = i.Project, name = "x", build = true }, Allowed),
            Case("SD updates a specification", "sd", "PUT", i => $"/admin/projectspecifications/{i.Spec}", i => new { id = i.Spec, project_id = i.Project, name = "x", test_sheet = true }, Allowed),
            Case("manager edits a specification", "manager", "PUT", i => $"/admin/projectspecifications/{i.Spec}", i => new { id = i.Spec, project_id = i.Project, name = "x" }, Allowed),
            Case("admin cannot edit a specification", "admin", "PUT", i => $"/admin/projectspecifications/{i.Spec}", i => new { id = i.Spec, project_id = i.Project, name = "x" }, 403),
            Case("developer cannot add a specification", "dev", "POST", "/admin/projectspecifications", new { project_id = 1, name = "v0.9" }, 403),
            Case("SD adds a milestone", "sd", "POST", "/admin/projectspecifications", new { project_id = 1, name = "v0.9" }, Allowed),
            Case("SD cannot delete a specification", "sd", "DELETE", i => $"/admin/projectspecifications/{i.Spec}", null, 403),
            Case("manager deletes a specification", "manager", "DELETE", i => $"/admin/projectspecifications/{i.Spec}", null, Allowed),
            Case("developer cannot delete dev days", "dev", "DELETE", i => $"/admin/specificationdevdays/{i.DevDay}", null, 403),
            Case("developer cannot assign staff to a project", "dev", "POST", "/admin/specificationusers", new { project_id = 1, user_id = 2 }, 403),
            Case("manager assigns staff to a project", "manager", "POST", "/admin/specificationusers", new { project_id = 1, user_id = 2 }, Allowed),
            Case("SD assigns developers to a project", "sd", "POST", "/admin/specificationusers", new { project_id = 1, specification_id = 1, user_id = 2 }, Allowed),
            Case("admin cannot assign staff", "admin", "POST", "/admin/specificationusers", new { project_id = 1, user_id = 2 }, 403),

            // ----- Module B: change requests -----
            Case("developer raises a change request as themselves", "dev", "POST", "/admin/specification-change-requests", new { specification_id = 1, requester_id = 2, stage = "Build", reason = "Needs rework" }, Allowed),
            Case("SD raises a change request as themselves", "sd", "POST", "/admin/specification-change-requests", new { specification_id = 1, requester_id = 3, stage = "Testing", reason = "Failed" }, Allowed),
            Case("developer cannot raise one as someone else", "dev", "POST", "/admin/specification-change-requests", new { specification_id = 1, requester_id = 3, stage = "Build", reason = "x" }, 403),
            Case("developer cannot create an already resolved request", "dev", "POST", "/admin/specification-change-requests", new { specification_id = 1, requester_id = 2, stage = "Build", reason = "x", resolved = true }, 403),
            Case("manager cannot raise a change request", "manager", "POST", "/admin/specification-change-requests", new { specification_id = 1, requester_id = 1, stage = "Build", reason = "x" }, 403),
            Case("admin cannot raise a change request", "admin", "POST", "/admin/specification-change-requests", new { specification_id = 1, requester_id = 2, stage = "Build", reason = "x" }, 403),
            Case("developer resolves a change request", "dev", "PUT", i => $"/admin/specification-change-requests/{i.ChangeRequest}", i => new { id = i.ChangeRequest, specification_id = 1, requester_id = 2, stage = "Build", reason = "Needs rework", created_at = "2026-09-26T10:00:00", resolved = true }, Allowed),
            Case("SD resolves a change request", "sd", "PUT", i => $"/admin/specification-change-requests/{i.ChangeRequest}", i => new { id = i.ChangeRequest, specification_id = 1, requester_id = 2, stage = "Build", reason = "Needs rework", created_at = "2026-09-26T10:00:00", resolved = true }, Allowed),
            Case("resolving cannot rewrite the reason", "dev", "PUT", i => $"/admin/specification-change-requests/{i.ChangeRequest}", i => new { id = i.ChangeRequest, specification_id = 1, requester_id = 2, stage = "Build", reason = "Rewritten", created_at = "2026-09-26T10:00:00", resolved = true }, 403),
            Case("resolving cannot change who raised it", "dev", "PUT", i => $"/admin/specification-change-requests/{i.ChangeRequest}", i => new { id = i.ChangeRequest, specification_id = 1, requester_id = 3, stage = "Build", reason = "Needs rework", created_at = "2026-09-26T10:00:00", resolved = true }, 403),
            Case("manager cannot resolve a change request", "manager", "PUT", i => $"/admin/specification-change-requests/{i.ChangeRequest}", i => new { id = i.ChangeRequest, specification_id = 1, requester_id = 2, stage = "Build", reason = "Needs rework", created_at = "2026-09-26T10:00:00", resolved = true }, 403),
            Case("developer cannot delete a change request", "dev", "DELETE", i => $"/admin/specification-change-requests/{i.ChangeRequest}", null, 403),
            Case("manager deletes a change request", "manager", "DELETE", i => $"/admin/specification-change-requests/{i.ChangeRequest}", null, Allowed),
            Case("developer cannot record a delay", "dev", "POST", "/admin/handoffdelays", new { handoff_id = 1, reason = "x", delay_hours = 1 }, 403),
            Case("manager records a delay", "manager", "POST", "/admin/handoffdelays", new { handoff_id = 1, reason = "x", delay_hours = 1 }, Allowed),

            // ----- Module B: handoffs -----
            Case("developer submits a handoff", "dev", "POST", "/admin/specificationhandoffs", new { project_id = 1, specification_id = 1, notified = "2026-10-01T09:00:00", status = "Pending", description = "New" }, Allowed),
            Case("developer cannot submit an already approved handoff", "dev", "POST", "/admin/specificationhandoffs", new { project_id = 1, specification_id = 1, notified = "2026-10-01T09:00:00", status = "Ready to test" }, 403),
            Case("SD cannot submit a handoff", "sd", "POST", "/admin/specificationhandoffs", new { project_id = 1, specification_id = 1, notified = "2026-10-01T09:00:00", status = "Pending" }, 403),
            Case("manager cannot submit a handoff", "manager", "POST", "/admin/specificationhandoffs", new { project_id = 1, specification_id = 1, notified = "2026-10-01T09:00:00", status = "Pending" }, 403),
            Case("developer resubmits a handoff", "dev", "PUT", i => $"/admin/specificationhandoffs/{i.Handoff}", i => HandoffBody(i.Handoff, "Pending", description: "Fixed"), Allowed),
            Case("developer cannot move a handoff to another project", "dev", "PUT", i => $"/admin/specificationhandoffs/{i.Handoff}", i => HandoffBody(i.Handoff, "Pending", project: 2), 403),
            Case("developer cannot approve their own handoff", "dev", "PUT", i => $"/admin/specificationhandoffs/{i.Handoff}", i => HandoffBody(i.Handoff, "Ready to test"), 403),
            Case("SD reviews a handoff", "sd", "PUT", i => $"/admin/specificationhandoffs/{i.Handoff}", i => HandoffBody(i.Handoff, "Ready to test"), Allowed),
            Case("SD requests changes", "sd", "PUT", i => $"/admin/specificationhandoffs/{i.Handoff}", i => HandoffBody(i.Handoff, "Changes Requested"), Allowed),
            Case("SD cannot rewrite the handoff while reviewing", "sd", "PUT", i => $"/admin/specificationhandoffs/{i.Handoff}", i => HandoffBody(i.Handoff, "Ready to test", description: "Rewritten"), 403),
            Case("SD cannot set an arbitrary status", "sd", "PUT", i => $"/admin/specificationhandoffs/{i.Handoff}", i => HandoffBody(i.Handoff, "Completed"), 403),
            Case("manager cannot edit a handoff", "manager", "PUT", i => $"/admin/specificationhandoffs/{i.Handoff}", i => HandoffBody(i.Handoff, "Pending"), 403),
            Case("developer launches a handoff", "dev", "PUT", i => $"/admin/specificationhandoffs/{i.Handoff}", i => HandoffBody(i.Handoff, "Launched"), Allowed),
            Case("developer asks for changes", "dev", "PUT", i => $"/admin/specificationhandoffs/{i.Handoff}", i => HandoffBody(i.Handoff, "Changes Requested"), Allowed),
            Case("developer cannot launch while rewriting the handoff", "dev", "PUT", i => $"/admin/specificationhandoffs/{i.Handoff}", i => HandoffBody(i.Handoff, "Launched", description: "Rewritten"), 403),
            Case("SD passes testing", "sd", "PUT", i => $"/admin/specificationhandoffs/{i.Handoff}", i => HandoffBody(i.Handoff, "Testing Passed - Ready for Launch"), Allowed),
            Case("SD fails testing", "sd", "PUT", i => $"/admin/specificationhandoffs/{i.Handoff}", i => HandoffBody(i.Handoff, "Test Failed - Changes Requested"), Allowed),
            Case("SD cannot launch a handoff", "sd", "PUT", i => $"/admin/specificationhandoffs/{i.Handoff}", i => HandoffBody(i.Handoff, "Launched"), 403),
            Case("developer withdraws a handoff", "dev", "DELETE", i => $"/admin/specificationhandoffs/{i.Handoff}", null, Allowed),
            Case("SD cannot delete a handoff", "sd", "DELETE", i => $"/admin/specificationhandoffs/{i.Handoff}", null, 403),

            // ----- Module B: signoffs -----
            Case("SD signs off as themselves", "sd", "POST", i => "/admin/handoff-signoffs", i => new { handoff_id = i.Handoff, signer_id = 3, handoff_message = "ok", success = true }, Allowed),
            Case("SD cannot sign off as someone else", "sd", "POST", i => "/admin/handoff-signoffs", i => new { handoff_id = i.Handoff, signer_id = 6, handoff_message = "ok", success = true }, 403),
            Case("developer cannot sign off", "dev", "POST", i => "/admin/handoff-signoffs", i => new { handoff_id = i.Handoff, signer_id = 2 }, 403),
            Case("manager cannot sign off", "manager", "POST", i => "/admin/handoff-signoffs", i => new { handoff_id = i.Handoff, signer_id = 1 }, 403),
            Case("SD edits their own signoff", "sd", "PUT", i => $"/admin/handoff-signoffs/{i.SignoffSarah}", i => new { id = i.SignoffSarah, handoff_id = i.Handoff, signer_id = 3, handoff_message = "edited", success = true }, Allowed),
            Case("SD cannot take over another SD's signoff", "sd", "PUT", i => $"/admin/handoff-signoffs/{i.SignoffOtherSd}", i => new { id = i.SignoffOtherSd, handoff_id = i.Handoff, signer_id = 3, handoff_message = "mine now", success = true }, 403),
            Case("SD cannot reassign their own signoff", "sd", "PUT", i => $"/admin/handoff-signoffs/{i.SignoffSarah}", i => new { id = i.SignoffSarah, handoff_id = i.Handoff, signer_id = 6, success = true }, 403),
            Case("SD cannot delete another SD's signoff", "sd", "DELETE", i => $"/admin/handoff-signoffs/{i.SignoffOtherSd}", null, 403),
            Case("SD deletes their own signoff", "sd", "DELETE", i => $"/admin/handoff-signoffs/{i.SignoffSarah}", null, Allowed),
            Case("developer cannot delete a signoff", "dev", "DELETE", i => $"/admin/handoff-signoffs/{i.SignoffSarah}", null, 403),
        };

        return cases.Select(c => new TestCaseData(c).SetName(c.Name));
    }

    // ----- Test host -----

    private static WebApplicationFactory<Program> CreateFactory(string mode, out Ids ids)
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
                    configuration.SigningKeys.Add(SigningKey);
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
            new User { region = "NZ-WGN", id = 5, name = "Dev Two", role = "Dev", country = "NZ", manager_id = 4 },
            new User { region = "NZ-WGN", id = 6, name = "SD Two", role = "SD", country = "NZ", manager_id = 4 });

        void Link(int userId, string subject) =>
            db.userIdentities.Add(new UserIdentity { user_id = userId, issuer = Issuer, subject = subject });
        Link(1, "sub-manager"); Link(2, "sub-dev"); Link(3, "sub-sd");
        Link(4, "sub-manager2"); Link(5, "sub-dev2"); Link(6, "sub-sd2");

        LeaveRequest Req(int user, int approver) => new()
        {
            user_id = user, approver_id = approver, start_date = new DateOnly(2026, 9, 21),
            end_date = new DateOnly(2026, 9, 22), leave_type = "Annual Leave", status = "Pending"
        };
        var leaveDev = Req(2, 1); var leaveSd = Req(3, 1); var leaveManager = Req(1, 1); var leaveOther = Req(5, 4);
        db.leaveRequests.AddRange(leaveDev, leaveSd, leaveManager, leaveOther);

        LeaveBalance Bal(int user) => new()
        {
            user_id = user, sick_days = 10, al_accured = 80, al_taken_accured = 0,
            al_outstanding = 80, annual_owing = 0, alternative_days = 0
        };
        var balanceDev = Bal(2); var balanceOther = Bal(5);
        db.leaveBalances.AddRange(Bal(1), balanceDev, balanceOther);

        Shift ShiftFor(int user) => new()
        {
            user_id = user, date = new DateOnly(2026, 9, 15), shift_start = TimeSpan.FromHours(8),
            shift_end = TimeSpan.FromHours(10), work_type = "Development"
        };
        var shiftDev = ShiftFor(2); var shiftOther = ShiftFor(5);
        db.shifts.AddRange(shiftDev, shiftOther);

        var project = new Project { name = "Firecrest Capstone" };
        db.projects.Add(project);
        var spec = new ProjectSpecification { project_id = 1, name = "v0.1" };
        db.projectSpecifications.Add(spec);
        var devDay = new SpecificationDevDay { project_id = 1, specification_id = 1, specified_month = new DateOnly(2026, 9, 1), dev_days = 2 };
        db.specificationDevDays.Add(devDay);
        var handoff = new SpecificationHandoff
        {
            project_id = 1, specification_id = 1, notified = new DateTime(2026, 9, 25, 9, 45, 0),
            expected = new DateTime(2026, 9, 30, 17, 0, 0), status = "Pending", description = "Original handoff"
        };
        db.specificationHandoffs.Add(handoff);
        var signoffSarah = new HandoffSignoff { handoff_id = 1, signer_id = 3, handoff_message = "first" };
        var signoffOther = new HandoffSignoff { handoff_id = 1, signer_id = 6, handoff_message = "second" };
        db.handoffSignoffs.AddRange(signoffSarah, signoffOther);
        var specUser = new SpecificationUsers { project_id = 1, specification_id = 1, user_id = 2 };
        db.specificationUsers.Add(specUser);
        var delay = new HandoffDelay { handoff_id = 1, reason = "seed", delay_hours = 1 };
        db.handoffDelays.Add(delay);
        var changeRequest = new SpecificationChangeRequest
        {
            specification_id = 1, requester_id = 2, stage = "Build", reason = "Needs rework",
            created_at = new DateTime(2026, 9, 26, 10, 0, 0)
        };
        db.specificationChangeRequests.Add(changeRequest);
        db.SaveChanges();

        ids = new Ids
        {
            LeaveDev = leaveDev.id, LeaveSd = leaveSd.id, LeaveManager = leaveManager.id, LeaveOther = leaveOther.id,
            BalanceDev = balanceDev.id, BalanceOther = balanceOther.id,
            ShiftDev = shiftDev.id, ShiftOther = shiftOther.id,
            Handoff = handoff.id, SignoffSarah = signoffSarah.id, SignoffOtherSd = signoffOther.id,
            Project = project.id, Spec = spec.id, DevDay = devDay.id, SpecUser = specUser.id, Delay = delay.id,
            ChangeRequest = changeRequest.id
        };

        return factory;
    }

    private static string? TokenFor(string who)
    {
        string Make(string subject, params string[] groups)
        {
            var claims = new List<Claim> { new("sub", subject), new("preferred_username", "test-user") };
            claims.AddRange(groups.Select(group => new Claim("groups", group)));
            var now = DateTime.UtcNow;
            var token = new JwtSecurityToken(Issuer, Audience, claims, now.AddMinutes(-10), now.AddMinutes(10),
                new SigningCredentials(SigningKey, SecurityAlgorithms.RsaSha256));
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        return who switch
        {
            "anonymous" => null,
            "invalid" => "not-a-jwt",
            "manager" => Make("sub-manager", "firecrest-manager"),
            "manager2" => Make("sub-manager2", "firecrest-manager"),
            "dev" => Make("sub-dev", "firecrest-developer"),
            "sd" => Make("sub-sd", "firecrest-sd"),
            "admin" => Make("sub-admin", "firecrest-admin"),
            "unlinked" => Make("sub-nobody", "firecrest-manager"),
            // Linked to the manager record, but authentik only grants developer
            "mismatch" => Make("sub-manager", "firecrest-developer"),
            _ => throw new ArgumentException(who)
        };
    }

    // Everything the writes could touch, as text, so a denied request can be shown to change nothing
    private static string Snapshot(WebApplicationFactory<Program> factory)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FirecrestDbContext>();
        return JsonSerializer.Serialize(new object[]
        {
            db.users.AsNoTracking().OrderBy(x => x.id).ToList(),
            db.leaveRequests.AsNoTracking().OrderBy(x => x.id).ToList(),
            db.leaveBalances.AsNoTracking().OrderBy(x => x.id).ToList(),
            db.shifts.AsNoTracking().OrderBy(x => x.id).ToList(),
            db.projects.AsNoTracking().OrderBy(x => x.id).ToList(),
            db.projectSpecifications.AsNoTracking().OrderBy(x => x.id).ToList(),
            db.specificationDevDays.AsNoTracking().OrderBy(x => x.id).ToList(),
            db.specificationHandoffs.AsNoTracking().OrderBy(x => x.id).ToList(),
            db.specificationUsers.AsNoTracking().OrderBy(x => x.id).ToList(),
            db.handoffSignoffs.AsNoTracking().OrderBy(x => x.id).ToList(),
            db.handoffDelays.AsNoTracking().OrderBy(x => x.id).ToList(),
            db.specificationChangeRequests.AsNoTracking().OrderBy(x => x.id).ToList(),
            db.userIdentities.AsNoTracking().OrderBy(x => x.id).ToList()
        });
    }

    private static async Task<HttpResponseMessage> Send(HttpClient client, string method, string path, string? token, object? body)
    {
        var request = new HttpRequestMessage(new HttpMethod(method), path);
        if (body != null) request.Content = JsonContent.Create(body);
        if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await client.SendAsync(request);
    }

    // ----- Tests -----

    [TestCaseSource(nameof(Cases))]
    public async Task WriteEndpoint_FollowsTheMatrix(WriteCase testCase)
    {
        await using var factory = CreateFactory("Oidc", out var ids);
        var before = Snapshot(factory);

        var response = await Send(factory.CreateClient(), testCase.Method, testCase.Path(ids),
            TokenFor(testCase.Who), testCase.Body?.Invoke(ids));

        if (testCase.Expected == Allowed)
        {
            ((int)response.StatusCode).Should().BeLessThan(400,
                $"{testCase.Who} {testCase.Method} {testCase.Path(ids)} should be allowed: {await response.Content.ReadAsStringAsync()}");
        }
        else
        {
            ((int)response.StatusCode).Should().Be(testCase.Expected, await response.Content.ReadAsStringAsync());

            // Nothing may change when a request is refused
            Snapshot(factory).Should().Be(before);
        }
    }

    [Test]
    public async Task ApprovingLeave_ReallyChangesTheStatusForTheEmployeesManager()
    {
        await using var factory = CreateFactory("Oidc", out var ids);

        var response = await Send(factory.CreateClient(), "PATCH", $"/admin/leave-requests/{ids.LeaveDev}",
            TokenFor("manager"), new { status = "Approved" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FirecrestDbContext>();
        (await db.leaveRequests.FindAsync(ids.LeaveDev))!.status.Should().Be("Approved");
    }

    [Test]
    public async Task RefusedLeaveDecision_LeavesTheRequestPending()
    {
        await using var factory = CreateFactory("Oidc", out var ids);

        var response = await Send(factory.CreateClient(), "PATCH", $"/admin/leave-requests/{ids.LeaveDev}",
            TokenFor("dev"), new { status = "Approved" });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FirecrestDbContext>();
        (await db.leaveRequests.FindAsync(ids.LeaveDev))!.status.Should().Be("Pending");
    }

    // A controller whose name does not match a rule would fall through to "denied", so every
    // controller with write actions must be named in the authorizer
    [Test]
    public void EveryControllerWithWriteActions_HasAWriteRule()
    {
        var controllers = typeof(Program).Assembly.GetTypes()
            .Where(type => type.Name.EndsWith("Controller") && typeof(Microsoft.AspNetCore.Mvc.ControllerBase).IsAssignableFrom(type))
            .Where(type => type.GetMethods().Any(method =>
                method.GetCustomAttributes(typeof(Microsoft.AspNetCore.Mvc.HttpPostAttribute), false).Any()
                || method.GetCustomAttributes(typeof(Microsoft.AspNetCore.Mvc.HttpPutAttribute), false).Any()
                || method.GetCustomAttributes(typeof(Microsoft.AspNetCore.Mvc.HttpPatchAttribute), false).Any()
                || method.GetCustomAttributes(typeof(Microsoft.AspNetCore.Mvc.HttpDeleteAttribute), false).Any()))
            .Select(type => type.Name[..^"Controller".Length]);

        controllers.Should().BeSubsetOf(Firecrest.Api.Auth.WriteAuthorizer.CoveredControllers);
    }

    // ----- Prototype mode is unchanged -----

    [Test]
    public async Task PrototypeMode_AnonymousWritesStillWork()
    {
        await using var factory = CreateFactory("Prototype", out var ids);
        var client = factory.CreateClient();

        (await Send(client, "POST", "/admin/users", null, new { name = "Anyone", role = "Manager", country = "NZ", region = "NZ-WGN" }))
            .StatusCode.Should().Be(HttpStatusCode.Created);
        (await Send(client, "PATCH", $"/admin/leave-requests/{ids.LeaveDev}", null, new { status = "Approved" }))
            .StatusCode.Should().Be(HttpStatusCode.OK);
        (await Send(client, "DELETE", $"/admin/shifts/{ids.ShiftOther}", null, null))
            .StatusCode.Should().Be(HttpStatusCode.OK);
    }
}

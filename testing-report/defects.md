# Defects and Validation Gaps

All defects below were reproduced in the executed run 2. The server-side exception for every 500 was confirmed in [evidence/07_test_api_server.log](evidence/07_test_api_server.log). No backend code was changed. The fixes listed are suggestions only.

## Defects

| ID | Severity | Defect | Failing cases |
|---|---|---|---|
| D01 | High | Deleting a user breaks the change request and signoff endpoints | CX-E07, CX-E08, CX-E09, CX-E10 |
| D02 | Medium | Unique constraint violations return 500 instead of 409 | CR-U01, SH-U01, SO-U03, HD-U02, SU-U01, SU-U09, DD-U01, CR-U10 |
| D03 | Medium | Invalid foreign keys return 500 instead of 400/404 | CR-U02, CR-U03, SH-U02, SH-U03, SU-U02, SU-U03, SU-U04, DD-U02, DD-U03, SO-U06, SO-U07, HD-U08 |
| D04 | Medium | Missing required values are stored as placeholders | CR-U04, CR-U05, SH-U09, DD-U09 |
| D05 | Medium | Client-supplied primary key is honoured on create | CR-B07 |
| D06 | Low | PUT to a nonexistent id returns 500 instead of 404 | SH-U05, SU-U06, DD-U06 |
| D07 | Low | Timestamps without a UTC designator return 500 | CR-B04, SH-B01, SO-B01 |
| D08 | Low | Missing handoff delay reason returns 500 instead of 400 | HD-U03 |
| D09 | Low | Public holiday sync failures return 500 | PH-U06, PH-B04 |
| D10 | Low | Duplicate project-level user assignments are allowed | SU-B02 |
| D11 | Low | Fortnight hours overflow near the maximum date returns 500 | HR-B04 |

### D01 Deleting a user breaks the change request and signoff endpoints

**Severity:** High

requester_id and signer_id are ON DELETE SET NULL in the database, but the models declare them as non-nullable int. Once a user who raised a change request or signed off a handoff is deleted, reading that row throws InvalidCastException, so GET by id and the whole GET list return 500 permanently.

**Evidence:** CX-E07, CX-E08, CX-E09, CX-E10

**Suggested fix:** Make requester_id and signer_id nullable (int?) in the models, or block deleting users who are referenced.


### D02 Unique constraint violations return 500 instead of 409

**Severity:** Medium

Duplicate change requests, handoffs, signoffs, delays, specification users and dev days reach the database and fail there. The client receives an empty 500.

**Evidence:** CR-U01, SH-U01, SO-U03, HD-U02, SU-U01, SU-U09, DD-U01, CR-U10

**Suggested fix:** Check for an existing row before saving (as LeaveBalances does) or catch DbUpdateException with SqlState 23505 and return 409 Conflict.


### D03 Invalid foreign keys return 500 instead of 400/404

**Severity:** Medium

SpecificationChangeRequests, SpecificationHandoffs, SpecificationUsers and SpecificationDevDays do not check that the referenced project, specification or user exists. HandoffSignoff and HandoffDelays check on POST but not on PUT.

**Evidence:** CR-U02, CR-U03, SH-U02, SH-U03, SU-U02, SU-U03, SU-U04, DD-U02, DD-U03, SO-U06, SO-U07, HD-U08

**Suggested fix:** Add the same AnyAsync existence checks used in HandoffSignoff POST to every POST and PUT.


### D04 Missing required values are stored as placeholders

**Severity:** Medium

A change request without a stage (or with an empty one) is stored with stage "". A handoff without notified and a dev-day record without specified_month are stored with the PostgreSQL value -infinity (the API echoes 0001-01-01).

**Evidence:** CR-U04, CR-U05, SH-U09, DD-U09

**Suggested fix:** Mark the fields [Required] (DateTime? / DateOnly? with [Required] for dates) and reject empty strings.


### D05 Client-supplied primary key is honoured on create

**Severity:** Medium

POST accepts an explicit id (tested on change requests: id 9001 was stored). The id sequence is not advanced, so a later insert collides when the sequence reaches that value. The original Bruno Create change request request sends id 1 and returned 500 once id 1 existed.

**Evidence:** CR-B07

**Suggested fix:** Ignore or reject id on POST (for example set id = 0 before Add, or use a create DTO without id).


### D06 PUT to a nonexistent id returns 500 instead of 404

**Severity:** Low

SpecificationHandoffs, SpecificationUsers and SpecificationDevDays mark the entity Modified without checking it exists. HandoffDelays and HandoffSignoff already return 404 for the same case.

**Evidence:** SH-U05, SU-U06, DD-U06

**Suggested fix:** Add the AnyAsync existence check used in HandoffDelays PUT.


### D07 Timestamps without a UTC designator return 500

**Severity:** Low

EF maps DateTime to timestamp with time zone while the columns are timestamp without time zone. A valid ISO-8601 local timestamp (no Z) fails. The React frontend always sends toISOString() (UTC), so it is not affected; other clients and imports are.

**Evidence:** CR-B04, SH-B01, SO-B01

**Suggested fix:** Configure the properties as timestamp without time zone (HasColumnType) or normalise incoming values to UTC.


### D08 Missing handoff delay reason returns 500 instead of 400

**Severity:** Low

reason is NOT NULL in the database but string? in the model.

**Evidence:** HD-U03

**Suggested fix:** Make reason a required non-nullable string.


### D09 Public holiday sync failures return 500

**Severity:** Low

An unsupported country (XX) or invalid year (0) makes Nager return 404/400; the service throws System.Exception and the API returns 500.

**Evidence:** PH-U06, PH-B04

**Suggested fix:** Validate year and country, and map upstream 4xx responses to 400/404 or 502.


### D10 Duplicate project-level user assignments are allowed

**Severity:** Low

UNIQUE(project_id, specification_id, user_id) does not stop duplicates when specification_id is NULL, because PostgreSQL treats NULLs as distinct.

**Evidence:** SU-B02

**Suggested fix:** Use UNIQUE NULLS NOT DISTINCT (PostgreSQL 15+) or check in the controller.


### D11 Fortnight hours overflow near the maximum date returns 500

**Severity:** Low

periodStart 9999-12-21 overflows DateOnly.AddDays.

**Evidence:** HR-B04

**Suggested fix:** Reject periodStart values where the fortnight passes DateOnly.MaxValue.


## Validation gaps

The API accepts this input or behaves inconsistently, but no requirement says it must not. These cases **pass** because they assert the behaviour the code documents. They are listed so the team can decide whether to add rules.

| ID | Controller | Gap | Cases |
|---|---|---|---|
| G01 | LeaveBalances | Negative sick days and outstanding leave are accepted | LB-B01 |
| G02 | PublicHolidays | Country lookup is case sensitive (nz returns 404 although NZ rows exist) | PH-B01 |
| G03 | SpecificationChangeRequests | PUT silently ignores every field except resolved | CR-B01, CR-B02 |
| G04 | SpecificationChangeRequests | PUT ignores a body id that differs from the route id (other controllers reject it) | CR-B03 |
| G05 | SpecificationHandoffs | expected completion can be earlier than notified | SH-B02 |
| G06 | SpecificationHandoffs | A specification can be paired with a project it does not belong to | SH-B03 |
| G07 | HandoffDelays | Negative delay_hours accepted | HD-B02 |
| G08 | SpecificationDevDays | specified_month is not normalised to the first day, so two records for the same month are accepted | DD-B01 |
| G09 | SpecificationDevDays | Negative dev_days accepted | DD-B02 |
| G10 | Hours | A missing userId is reported as 404 User not found rather than 400 | HR-U05 |
| G11 | All nine controllers | Route/body id mismatch returns 404 in five controllers but 400 in LeaveBalances | SH-U04, SO-U04, HD-U04, SU-U05, DD-U05, LB-U03 |
| G12 | PublicHolidays | 404 responses have an empty body, unlike the other controllers' {message} bodies | PH-U01, PH-U02, PH-U03 |
| G13 | All nine controllers | No authentication or authorisation on any /admin endpoint (known prototype limitation) | n/a |

## Problems in the original Bruno requests

The three original SpecificationChangeRequests requests were run unchanged against the isolated API ([evidence/08_original_change_request_requests.txt](evidence/08_original_change_request_requests.txt)). They were left unchanged, and corrected copies are in `Integration Tests (Isolated)/04 SpecificationChangeRequests (corrected)`.

| Original request | Problem | Executed result |
|---|---|---|
| Create change request | Sends `"id": 1` (the DbContext says not to send the id) | 500, because id 1 already existed (defect D05) |
| Get change request | URL is empty | Not sent: Bruno reported Invalid URL |
| Delete | URL is `/admin/` with no controller route or id | 404 |

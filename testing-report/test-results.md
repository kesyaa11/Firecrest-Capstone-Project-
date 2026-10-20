# Test Results: Nine Remaining Controllers

Every Actual Status and Result below was **executed** with Bruno CLI 4.2.1 against the isolated test API on 2026-10-21 10:34 (run 2). Nothing in this file is predicted. Raw output: [evidence/bruno_results.json](evidence/bruno_results.json), [evidence/bruno_results.junit.xml](evidence/bruno_results.junit.xml), [evidence/bruno_results.html](evidence/bruno_results.html).

A case is **PASS** when the status and every field check passed, **FAIL** when any check failed, and **BLOCKED** when the request could not be sent (for example a prerequisite record was missing). Where more than one status is listed as expected, any of them is correct.


## Expected cases (77: 73 pass, 4 fail, 0 blocked)

Valid requests that the API should accept and answer correctly.


### LeaveBalances

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| LeaveBalances | POST | `/admin/leave-balances` | LB-E01 Create leave balance for user 2 | 201 | 201 | PASS | 5 checks passed |
| LeaveBalances | GET | `/admin/leave-balances/{id}` | LB-E02 Get leave balance by id | 200 | 200 | PASS | 4 checks passed |
| LeaveBalances | GET | `/admin/leave-balances/user/{userId}` | LB-E03 Get leave balance by user id | 200 | 200 | PASS | 3 checks passed |
| LeaveBalances | GET | `/admin/leave-balances` | LB-E04 List leave balances contains new record | 200 | 200 | PASS | 2 checks passed |
| LeaveBalances | PUT | `/admin/leave-balances/{id}` | LB-E05 Update leave balance | 200 | 200 | PASS | 3 checks passed |
| LeaveBalances | GET | `/admin/leave-balances/{id}` | LB-E06 Update persisted (read back) | 200 | 200 | PASS | 4 checks passed |
| LeaveBalances | GET | `/admin/leave-balances/{id}` | CX-E05 Leave balance removed by cascade | 404 | 404 | PASS | 1 check passed |


### Hours

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| Hours | GET | `/admin/hours/fortnight` | HR-E01 Fortnight for user 2 containing seeded shift | 200 | 200 | PASS | 13 checks passed |
| Hours | GET | `/admin/hours/fortnight/all` | HR-E02 Fortnight for all users | 200 | 200 | PASS | 4 checks passed |
| Hours | GET | `/admin/hours/fortnight` | HR-E03 Approved sick leave counted | 200 | 200 | PASS | 5 checks passed |
| Hours | GET | `/admin/hours/fortnight` | HR-E04 Pending leave not counted | 200 | 200 | PASS | 3 checks passed |
| Hours | GET | `/admin/hours/fortnight` | HR-E05 Rejected leave not counted | 200 | 200 | PASS | 3 checks passed |
| Hours | GET | `/admin/hours/fortnight` | HR-E06 Public holiday hours at time and a half | 200 | 200 | PASS | 4 checks passed |


### PublicHolidays

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| PublicHolidays | GET | `/admin/publicholidays/country/{country}` | PH-E01 Holidays for NZ (count before sync) | 200 | 200 | PASS | 3 checks passed |
| PublicHolidays | POST | `/admin/publicholidays/sync/{year}/{country}` | PH-E02 Sync NZ 2026 | 200 | 200 | PASS | 2 checks passed |
| PublicHolidays | GET | `/admin/publicholidays/country/{country}` | PH-E03 Re-sync is idempotent (no duplicates) | 200 | 200 | PASS | 3 checks passed |
| PublicHolidays | GET | `/admin/publicholidays` | PH-E04 List all holidays | 200 | 200 | PASS | 3 checks passed |
| PublicHolidays | GET | `/admin/publicholidays/{id}` | PH-E05 Get holiday by id | 200 | 200 | PASS | 3 checks passed |
| PublicHolidays | GET | `/admin/publicholidays/country/{country}/date/{date}` | PH-E06 NZ holidays on 2026-12-25 | 200 | 200 | PASS | 2 checks passed |
| PublicHolidays | GET | `/admin/publicholidays/country/{country}/date/{date}` | PH-E07 PH holidays on 2026-12-25 | 200 | 200 | PASS | 2 checks passed |
| PublicHolidays | POST | `/admin/publicholidays/sync/{year}/{country}` | PH-E08 Sync PH 2027 | 200 | 200 | PASS | 1 check passed |


### SpecificationChangeRequests

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| SpecificationChangeRequests | POST | `/admin/specification-change-requests` | CR-E01 Create change request | 201 | 201 | PASS | 4 checks passed |
| SpecificationChangeRequests | GET | `/admin/specification-change-requests` | CR-E02 List contains new request | 200 | 200 | PASS | 2 checks passed |
| SpecificationChangeRequests | GET | `/admin/specification-change-requests/{id}` | CR-E03 Get by id | 200 | 200 | PASS | 5 checks passed |
| SpecificationChangeRequests | PUT | `/admin/specification-change-requests/{id}` | CR-E04 Resolve request | 200 | 200 | PASS | 2 checks passed |
| SpecificationChangeRequests | GET | `/admin/specification-change-requests/{id}` | CR-E05 Resolution persisted | 200 | 200 | PASS | 2 checks passed |
| SpecificationChangeRequests | POST | `/admin/specification-change-requests` | CR-E06 Create temporary request | 201 | 201 | PASS | 1 check passed |
| SpecificationChangeRequests | DELETE | `/admin/specification-change-requests/{id}` | CR-E07 Delete temporary request | 200 | 200 | PASS | 2 checks passed |
| SpecificationChangeRequests | GET | `/admin/specification-change-requests/{id}` | CR-E08 Deleted request is gone | 404 | 404 | PASS | 1 check passed |
| SpecificationChangeRequests | GET | `/admin/specification-change-requests/{id}` | CX-E07 Change request readable after requester deleted | 200 | 500 | **FAIL** | 500: InvalidCastException, column is null but the model property is a non-nullable int; also failed: requester_id is None; Defect D01 |
| SpecificationChangeRequests | GET | `/admin/specification-change-requests` | CX-E08 Change request list readable after requester deleted | 200 | 500 | **FAIL** | 500: InvalidCastException, column is null but the model property is a non-nullable int; Defect D01 |


### SpecificationHandoffs

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| SpecificationHandoffs | POST | `/admin/specificationhandoffs` | SH-E01 Create handoff | 201 | 201 | PASS | 3 checks passed |
| SpecificationHandoffs | GET | `/admin/specificationhandoffs` | SH-E02 List contains new handoff | 200 | 200 | PASS | 2 checks passed |
| SpecificationHandoffs | GET | `/admin/specificationhandoffs/{id}` | SH-E03 Get by id | 200 | 200 | PASS | 3 checks passed |
| SpecificationHandoffs | PUT | `/admin/specificationhandoffs/{id}` | SH-E04 Update handoff | 200 | 200 | PASS | 2 checks passed |
| SpecificationHandoffs | GET | `/admin/specificationhandoffs/{id}` | SH-E05 Update persisted | 200 | 200 | PASS | 3 checks passed |
| SpecificationHandoffs | POST | `/admin/specificationhandoffs` | SH-E06 Create temporary handoff | 201 | 201 | PASS | 1 check passed |
| SpecificationHandoffs | DELETE | `/admin/specificationhandoffs/{id}` | SH-E07 Delete temporary handoff | 200 | 200 | PASS | 2 checks passed |
| SpecificationHandoffs | GET | `/admin/specificationhandoffs/{id}` | SH-E08 Deleted handoff is gone | 404 | 404 | PASS | 1 check passed |
| SpecificationHandoffs | DELETE | `/admin/specificationhandoffs/{id}` | CX-E01 Delete handoff with signoff and delay | 200 | 200 | PASS | 2 checks passed |


### HandoffSignoff

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| HandoffSignoff | POST | `/admin/handoff-signoffs` | SO-E01 Create signoff | 201 | 201 | PASS | 4 checks passed |
| HandoffSignoff | GET | `/admin/handoff-signoffs` | SO-E02 List contains new signoff | 200 | 200 | PASS | 2 checks passed |
| HandoffSignoff | GET | `/admin/handoff-signoffs/{id}` | SO-E03 Get by id | 200 | 200 | PASS | 3 checks passed |
| HandoffSignoff | PUT | `/admin/handoff-signoffs/{id}` | SO-E04 Update signoff | 200 | 200 | PASS | 2 checks passed |
| HandoffSignoff | GET | `/admin/handoff-signoffs/{id}` | SO-E05 Update persisted | 200 | 200 | PASS | 3 checks passed |
| HandoffSignoff | POST | `/admin/handoff-signoffs` | SO-E06 Create temporary signoff | 201 | 201 | PASS | 1 check passed |
| HandoffSignoff | DELETE | `/admin/handoff-signoffs/{id}` | SO-E07 Delete temporary signoff | 200 | 200 | PASS | 2 checks passed |
| HandoffSignoff | GET | `/admin/handoff-signoffs/{id}` | SO-E08 Deleted signoff is gone | 404 | 404 | PASS | 1 check passed |
| HandoffSignoff | GET | `/admin/handoff-signoffs/{id}` | CX-E02 Signoff removed by cascade | 404 | 404 | PASS | 1 check passed |
| HandoffSignoff | GET | `/admin/handoff-signoffs/{id}` | CX-E09 Signoff readable after signer deleted | 200 | 500 | **FAIL** | 500: InvalidCastException, column is null but the model property is a non-nullable int; also failed: signer_id is None; Defect D01 |
| HandoffSignoff | GET | `/admin/handoff-signoffs` | CX-E10 Signoff list readable after signer deleted | 200 | 500 | **FAIL** | 500: InvalidCastException, column is null but the model property is a non-nullable int; Defect D01 |


### HandoffDelays

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| HandoffDelays | POST | `/admin/handoffdelays` | HD-E01 Create delay | 201 | 201 | PASS | 3 checks passed |
| HandoffDelays | GET | `/admin/handoffdelays` | HD-E02 List contains new delay | 200 | 200 | PASS | 2 checks passed |
| HandoffDelays | GET | `/admin/handoffdelays/{id}` | HD-E03 Get by id | 200 | 200 | PASS | 3 checks passed |
| HandoffDelays | PUT | `/admin/handoffdelays/{id}` | HD-E04 Update delay | 200 | 200 | PASS | 2 checks passed |
| HandoffDelays | GET | `/admin/handoffdelays/{id}` | HD-E05 Update persisted | 200 | 200 | PASS | 2 checks passed |
| HandoffDelays | POST | `/admin/handoffdelays` | HD-E06 Create temporary delay | 201 | 201 | PASS | 1 check passed |
| HandoffDelays | DELETE | `/admin/handoffdelays/{id}` | HD-E07 Delete temporary delay | 200 | 200 | PASS | 2 checks passed |
| HandoffDelays | GET | `/admin/handoffdelays/{id}` | HD-E08 Deleted delay is gone | 404 | 404 | PASS | 1 check passed |
| HandoffDelays | GET | `/admin/handoffdelays/{id}` | CX-E03 Delay removed by cascade | 404 | 404 | PASS | 1 check passed |


### SpecificationUsers

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| SpecificationUsers | POST | `/admin/specificationusers` | SU-E01 Assign user 4 to project 1 specification 2 | 201 | 201 | PASS | 3 checks passed |
| SpecificationUsers | GET | `/admin/specificationusers` | SU-E02 List contains new assignment | 200 | 200 | PASS | 2 checks passed |
| SpecificationUsers | GET | `/admin/specificationusers/{id}` | SU-E03 Get by id | 200 | 200 | PASS | 3 checks passed |
| SpecificationUsers | PUT | `/admin/specificationusers/{id}` | SU-E04 Move assignment to specification 1 | 200 | 200 | PASS | 2 checks passed |
| SpecificationUsers | GET | `/admin/specificationusers/{id}` | SU-E05 Update persisted | 200 | 200 | PASS | 2 checks passed |
| SpecificationUsers | POST | `/admin/specificationusers` | SU-E06 Create temporary assignment | 201 | 201 | PASS | 1 check passed |
| SpecificationUsers | DELETE | `/admin/specificationusers/{id}` | SU-E07 Delete temporary assignment | 200 | 200 | PASS | 2 checks passed |
| SpecificationUsers | GET | `/admin/specificationusers/{id}` | SU-E08 Deleted assignment is gone | 404 | 404 | PASS | 1 check passed |
| SpecificationUsers | GET | `/admin/specificationusers/{id}` | CX-E06 Assignment removed by cascade | 404 | 404 | PASS | 1 check passed |


### SpecificationDevDays

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| SpecificationDevDays | POST | `/admin/specificationdevdays` | DD-E01 Create dev days | 201 | 201 | PASS | 4 checks passed |
| SpecificationDevDays | GET | `/admin/specificationdevdays` | DD-E02 List contains new record | 200 | 200 | PASS | 2 checks passed |
| SpecificationDevDays | GET | `/admin/specificationdevdays/{id}` | DD-E03 Get by id | 200 | 200 | PASS | 2 checks passed |
| SpecificationDevDays | PUT | `/admin/specificationdevdays/{id}` | DD-E04 Update dev days | 200 | 200 | PASS | 2 checks passed |
| SpecificationDevDays | GET | `/admin/specificationdevdays/{id}` | DD-E05 Update persisted | 200 | 200 | PASS | 2 checks passed |
| SpecificationDevDays | POST | `/admin/specificationdevdays` | DD-E06 Create temporary record | 201 | 201 | PASS | 1 check passed |
| SpecificationDevDays | DELETE | `/admin/specificationdevdays/{id}` | DD-E07 Delete temporary record | 200 | 200 | PASS | 2 checks passed |
| SpecificationDevDays | GET | `/admin/specificationdevdays/{id}` | DD-E08 Deleted record is gone | 404 | 404 | PASS | 1 check passed |


## Unexpected cases (83: 54 pass, 29 fail, 0 blocked)

Invalid, malformed or conflicting requests that the API should reject with a meaningful 4xx status.


### LeaveBalances

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| LeaveBalances | POST | `/admin/leave-balances` | LB-U01 Duplicate balance for the same user | 409 | 409 | PASS | 2 checks passed |
| LeaveBalances | POST | `/admin/leave-balances` | LB-U02 Create for nonexistent user | 404 | 404 | PASS | 2 checks passed |
| LeaveBalances | PUT | `/admin/leave-balances/{id}` | LB-U03 Update with route id different from body id | 400 | 400 | PASS | 2 checks passed |
| LeaveBalances | PUT | `/admin/leave-balances/{id}` | LB-U04 Update nonexistent balance | 404 | 404 | PASS | 2 checks passed |
| LeaveBalances | PUT | `/admin/leave-balances/{id}` | LB-U05 Update attempts to move balance to another user | 400 | 400 | PASS | 2 checks passed |
| LeaveBalances | GET | `/admin/leave-balances/{id}` | LB-U06 Get nonexistent balance by id | 404 | 404 | PASS | 2 checks passed |
| LeaveBalances | GET | `/admin/leave-balances/user/{userId}` | LB-U07 Get balance for user with no balance (user 4) | 404 | 404 | PASS | 2 checks passed |
| LeaveBalances | GET | `/admin/leave-balances/user/{userId}` | LB-U08 Get balance for nonexistent user | 404 | 404 | PASS | 1 check passed |
| LeaveBalances | POST | `/admin/leave-balances` | LB-U09 Malformed JSON body | 400 | 400 | PASS | 1 check passed |
| LeaveBalances | POST | `/admin/leave-balances` | LB-U10 String in an integer field | 400 | 400 | PASS | 1 check passed |
| LeaveBalances | POST | `/admin/leave-balances` | LB-U11 Unsupported content type | 415 | 415 | PASS | 1 check passed |
| LeaveBalances | DELETE | `/admin/leave-balances/{id}` | LB-U12 DELETE is not supported | 405 | 405 | PASS | 1 check passed |
| LeaveBalances | GET | `/admin/leave-balances/{id}` | LB-U13 Record still exists after rejected DELETE | 200 | 200 | PASS | 2 checks passed |


### Hours

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| Hours | GET | `/admin/hours/fortnight` | HR-U01 periodStart missing | 400 | 400 | PASS | 2 checks passed |
| Hours | GET | `/admin/hours/fortnight` | HR-U02 periodStart is not a Tuesday | 400 | 400 | PASS | 2 checks passed |
| Hours | GET | `/admin/hours/fortnight` | HR-U03 Nonexistent user | 404 | 404 | PASS | 2 checks passed |
| Hours | GET | `/admin/hours/fortnight` | HR-U04 Invalid calendar date | 400 | 400 | PASS | 1 check passed |
| Hours | GET | `/admin/hours/fortnight` | HR-U05 userId missing | 400 or 404 | 404 | PASS | userId is a non-nullable int so a missing value binds as 0 and is reported as User not found; 1 check passed |
| Hours | GET | `/admin/hours/fortnight` | HR-U06 userId not a number | 400 | 400 | PASS | 1 check passed |
| Hours | GET | `/admin/hours/fortnight/all` | HR-U07 All users: periodStart missing | 400 | 400 | PASS | 2 checks passed |
| Hours | GET | `/admin/hours/fortnight/all` | HR-U08 All users: periodStart is a Wednesday | 400 | 400 | PASS | 2 checks passed |


### PublicHolidays

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| PublicHolidays | GET | `/admin/publicholidays/{id}` | PH-U01 Get nonexistent holiday | 404 | 404 | PASS | 1 check passed |
| PublicHolidays | GET | `/admin/publicholidays/country/{country}` | PH-U02 Unknown country code | 404 | 404 | PASS | 1 check passed |
| PublicHolidays | GET | `/admin/publicholidays/country/{country}/date/{date}` | PH-U03 Date that is not a holiday | 404 | 404 | PASS | 1 check passed |
| PublicHolidays | GET | `/admin/publicholidays/country/{country}/date/{date}` | PH-U04 Invalid date in route | 400 | 400 | PASS | 1 check passed |
| PublicHolidays | GET | `/admin/publicholidays/{id}` | PH-U05 Non-numeric id | 400 | 400 | PASS | 1 check passed |
| PublicHolidays | POST | `/admin/publicholidays/sync/{year}/{country}` | PH-U06 Sync unknown country | 400 or 404 | 500 | **FAIL** | 500: System.Exception rethrown from the Nager sync (upstream 404); Defect D09 |
| PublicHolidays | POST | `/admin/publicholidays/sync/{year}/{country}` | PH-U07 Sync with non-numeric year | 400 | 400 | PASS | 1 check passed |


### SpecificationChangeRequests

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| SpecificationChangeRequests | POST | `/admin/specification-change-requests` | CR-U01 Duplicate (specification, stage, requester) | 409 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23505 unique violation not handled; Defect D02 |
| SpecificationChangeRequests | POST | `/admin/specification-change-requests` | CR-U02 Nonexistent specification | 400 or 404 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23503 foreign key violation not handled; Defect D03 |
| SpecificationChangeRequests | POST | `/admin/specification-change-requests` | CR-U03 Nonexistent requester | 400 or 404 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23503 foreign key violation not handled; Defect D03 |
| SpecificationChangeRequests | POST | `/admin/specification-change-requests` | CR-U04 Missing stage | 400 | 201 | **FAIL** | Accepted (201) and stored with stage ""; Defect D04 |
| SpecificationChangeRequests | POST | `/admin/specification-change-requests` | CR-U05 Empty stage | 400 | 201 | **FAIL** | Accepted (201) and stored with stage ""; Defect D04 |
| SpecificationChangeRequests | POST | `/admin/specification-change-requests` | CR-U06 Null reason | 400 | 400 | PASS | 1 check passed |
| SpecificationChangeRequests | GET | `/admin/specification-change-requests/{id}` | CR-U07 Get nonexistent request | 404 | 404 | PASS | 2 checks passed |
| SpecificationChangeRequests | PUT | `/admin/specification-change-requests/{id}` | CR-U08 Update nonexistent request | 404 | 404 | PASS | 1 check passed |
| SpecificationChangeRequests | DELETE | `/admin/specification-change-requests/{id}` | CR-U09 Delete nonexistent request | 404 | 404 | PASS | 1 check passed |
| SpecificationChangeRequests | POST | `/admin/specification-change-requests` | CR-U10 Create with an id that already exists | 409 | 500 | **FAIL** | 500: DbUpdateException, 23505 on specification_change_request_pkey; Defect D02 |


### SpecificationHandoffs

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| SpecificationHandoffs | POST | `/admin/specificationhandoffs` | SH-U01 Duplicate (project, specification, status) | 409 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23505 unique violation not handled; Defect D02 |
| SpecificationHandoffs | POST | `/admin/specificationhandoffs` | SH-U02 Nonexistent project | 400 or 404 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23503 foreign key violation not handled; Defect D03 |
| SpecificationHandoffs | POST | `/admin/specificationhandoffs` | SH-U03 Nonexistent specification | 400 or 404 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23503 foreign key violation not handled; Defect D03 |
| SpecificationHandoffs | PUT | `/admin/specificationhandoffs/{id}` | SH-U04 PUT route id differs from body id | 404 | 404 | PASS | 2 checks passed |
| SpecificationHandoffs | PUT | `/admin/specificationhandoffs/{id}` | SH-U05 Update nonexistent handoff | 404 | 500 | **FAIL** | 500: DbUpdateConcurrencyException, PUT marks a missing row as Modified with no existence check; Defect D06 |
| SpecificationHandoffs | GET | `/admin/specificationhandoffs/{id}` | SH-U06 Get nonexistent handoff | 404 | 404 | PASS | 2 checks passed |
| SpecificationHandoffs | DELETE | `/admin/specificationhandoffs/{id}` | SH-U07 Delete nonexistent handoff | 404 | 404 | PASS | 1 check passed |
| SpecificationHandoffs | POST | `/admin/specificationhandoffs` | SH-U08 Malformed JSON | 400 | 400 | PASS | 1 check passed |
| SpecificationHandoffs | POST | `/admin/specificationhandoffs` | SH-U09 notified omitted | 400 | 201 | **FAIL** | Accepted (201); API echoes 0001-01-01, PostgreSQL stores -infinity (DB-SH03); Defect D04 |


### HandoffSignoff

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| HandoffSignoff | POST | `/admin/handoff-signoffs` | SO-U01 Nonexistent handoff | 404 | 404 | PASS | 2 checks passed |
| HandoffSignoff | POST | `/admin/handoff-signoffs` | SO-U02 Nonexistent signer | 404 | 404 | PASS | 2 checks passed |
| HandoffSignoff | POST | `/admin/handoff-signoffs` | SO-U03 Duplicate (handoff, signer) | 409 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23505 unique violation not handled; Defect D02 |
| HandoffSignoff | PUT | `/admin/handoff-signoffs/{id}` | SO-U04 PUT route id differs from body id | 404 | 404 | PASS | 2 checks passed |
| HandoffSignoff | PUT | `/admin/handoff-signoffs/{id}` | SO-U05 Update nonexistent signoff | 404 | 404 | PASS | 1 check passed |
| HandoffSignoff | PUT | `/admin/handoff-signoffs/{id}` | SO-U06 PUT moves signoff to nonexistent handoff | 400 or 404 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23503 foreign key violation not handled; Defect D03 |
| HandoffSignoff | PUT | `/admin/handoff-signoffs/{id}` | SO-U07 PUT sets nonexistent signer | 400 or 404 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23503 foreign key violation not handled; Defect D03 |
| HandoffSignoff | GET | `/admin/handoff-signoffs/{id}` | SO-U08 Get nonexistent signoff | 404 | 404 | PASS | 2 checks passed |
| HandoffSignoff | DELETE | `/admin/handoff-signoffs/{id}` | SO-U09 Delete nonexistent signoff | 404 | 404 | PASS | 1 check passed |


### HandoffDelays

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| HandoffDelays | POST | `/admin/handoffdelays` | HD-U01 Nonexistent handoff | 404 | 404 | PASS | 2 checks passed |
| HandoffDelays | POST | `/admin/handoffdelays` | HD-U02 Duplicate (handoff, reason) | 409 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23505 unique violation not handled; Defect D02 |
| HandoffDelays | POST | `/admin/handoffdelays` | HD-U03 Missing reason | 400 | 500 | **FAIL** | 500: DbUpdateException, 23502 null value in column reason; Defect D08 |
| HandoffDelays | PUT | `/admin/handoffdelays/{id}` | HD-U04 PUT route id differs from body id | 404 | 404 | PASS | 2 checks passed |
| HandoffDelays | PUT | `/admin/handoffdelays/{id}` | HD-U05 Update nonexistent delay | 404 | 404 | PASS | 1 check passed |
| HandoffDelays | GET | `/admin/handoffdelays/{id}` | HD-U06 Get nonexistent delay | 404 | 404 | PASS | 2 checks passed |
| HandoffDelays | DELETE | `/admin/handoffdelays/{id}` | HD-U07 Delete nonexistent delay | 404 | 404 | PASS | 1 check passed |
| HandoffDelays | PUT | `/admin/handoffdelays/{id}` | HD-U08 PUT moves delay to nonexistent handoff | 400 or 404 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23503 foreign key violation not handled; Defect D03 |
| HandoffDelays | POST | `/admin/handoffdelays` | HD-U09 String in delay_hours | 400 | 400 | PASS | 1 check passed |


### SpecificationUsers

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| SpecificationUsers | POST | `/admin/specificationusers` | SU-U01 Duplicate assignment | 409 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23505 unique violation not handled; Defect D02 |
| SpecificationUsers | POST | `/admin/specificationusers` | SU-U02 Nonexistent user | 400 or 404 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23503 foreign key violation not handled; Defect D03 |
| SpecificationUsers | POST | `/admin/specificationusers` | SU-U03 Nonexistent project | 400 or 404 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23503 foreign key violation not handled; Defect D03 |
| SpecificationUsers | POST | `/admin/specificationusers` | SU-U04 Nonexistent specification | 400 or 404 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23503 foreign key violation not handled; Defect D03 |
| SpecificationUsers | PUT | `/admin/specificationusers/{id}` | SU-U05 PUT route id differs from body id | 404 | 404 | PASS | 2 checks passed |
| SpecificationUsers | PUT | `/admin/specificationusers/{id}` | SU-U06 Update nonexistent assignment | 404 | 500 | **FAIL** | 500: DbUpdateConcurrencyException, PUT marks a missing row as Modified with no existence check; Defect D06 |
| SpecificationUsers | GET | `/admin/specificationusers/{id}` | SU-U07 Get nonexistent assignment | 404 | 404 | PASS | 1 check passed |
| SpecificationUsers | DELETE | `/admin/specificationusers/{id}` | SU-U08 Delete nonexistent assignment | 404 | 404 | PASS | 1 check passed |
| SpecificationUsers | PUT | `/admin/specificationusers/{id}` | SU-U09 PUT turns record into a duplicate | 409 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23505 unique violation not handled; Defect D02 |


### SpecificationDevDays

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| SpecificationDevDays | POST | `/admin/specificationdevdays` | DD-U01 Duplicate (project, specification, month) | 409 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23505 unique violation not handled; Defect D02 |
| SpecificationDevDays | POST | `/admin/specificationdevdays` | DD-U02 Nonexistent specification | 400 or 404 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23503 foreign key violation not handled; Defect D03 |
| SpecificationDevDays | POST | `/admin/specificationdevdays` | DD-U03 Nonexistent project | 400 or 404 | 500 | **FAIL** | 500: DbUpdateException, PostgreSQL 23503 foreign key violation not handled; Defect D03 |
| SpecificationDevDays | POST | `/admin/specificationdevdays` | DD-U04 Impossible date 2026-02-30 | 400 | 400 | PASS | 1 check passed |
| SpecificationDevDays | PUT | `/admin/specificationdevdays/{id}` | DD-U05 PUT route id differs from body id | 404 | 404 | PASS | 2 checks passed |
| SpecificationDevDays | PUT | `/admin/specificationdevdays/{id}` | DD-U06 Update nonexistent record | 404 | 500 | **FAIL** | 500: DbUpdateConcurrencyException, PUT marks a missing row as Modified with no existence check; Defect D06 |
| SpecificationDevDays | GET | `/admin/specificationdevdays/{id}` | DD-U07 Get nonexistent record | 404 | 404 | PASS | 2 checks passed |
| SpecificationDevDays | DELETE | `/admin/specificationdevdays/{id}` | DD-U08 Delete nonexistent record | 404 | 404 | PASS | 1 check passed |
| SpecificationDevDays | POST | `/admin/specificationdevdays` | DD-U09 specified_month omitted | 400 | 201 | **FAIL** | Accepted (201); API echoes 0001-01-01, PostgreSQL stores -infinity (DB-DD04); Defect D04 |


## Boundary cases (42: 35 pass, 7 fail, 0 blocked)

Edge values: limits, empty and null values, precision, date ranges and unusual but valid input.


### LeaveBalances

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| LeaveBalances | POST | `/admin/leave-balances` | LB-B01 Negative balance values accepted | 201 | 201 | PASS | Validation gap G01: No validation on negative sick days or outstanding leave; 3 checks passed |
| LeaveBalances | POST | `/admin/leave-balances` | LB-B02 Minimal body only user_id | 201 | 201 | PASS | Omitted numeric fields default to 0; 5 checks passed |
| LeaveBalances | POST | `/admin/leave-balances` | LB-B03 user_id 0 | 404 | 404 | PASS | 2 checks passed |
| LeaveBalances | PUT | `/admin/leave-balances/{id}` | LB-B04 Int32 maximum and fractional hours | 200 | 200 | PASS | 3 checks passed |
| LeaveBalances | GET | `/admin/leave-balances/{id}` | LB-B05 Int32 maximum persisted | 200 | 200 | PASS | 3 checks passed |
| LeaveBalances | PUT | `/admin/leave-balances/{id}` | LB-B06 Int32 overflow rejected | 400 | 400 | PASS | 1 check passed |
| LeaveBalances | PUT | `/admin/leave-balances/{id}` | LB-B07 Partial PUT body omits user_id | 400 | 400 | PASS | PUT is a full replacement; an omitted user_id binds as 0; 2 checks passed |


### Hours

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| Hours | GET | `/admin/hours/fortnight` | HR-B01 Shift on the last day (day 14) is included | 200 | 200 | PASS | 3 checks passed |
| Hours | GET | `/admin/hours/fortnight` | HR-B02 Shift one day before the period is excluded | 200 | 200 | PASS | 5 checks passed |
| Hours | GET | `/admin/hours/fortnight` | HR-B03 Latest representable fortnight | 200 | 200 | PASS | 2 checks passed |
| Hours | GET | `/admin/hours/fortnight` | HR-B04 Fortnight running past 9999-12-31 | 400 | 500 | **FAIL** | 500: ArgumentOutOfRangeException from DateOnly.AddDays; Defect D11 |
| Hours | GET | `/admin/hours/fortnight` | HR-B05 Earliest representable fortnight | 200 | 200 | PASS | 0001-01-02 is a Tuesday; 2 checks passed |
| Hours | GET | `/admin/hours/fortnight` | HR-B06 User with no shifts and no balance (user 4) | 200 | 200 | PASS | 4 checks passed |


### PublicHolidays

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| PublicHolidays | GET | `/admin/publicholidays/country/{country}` | PH-B01 Lowercase country code on read | 404 | 404 | PASS | Validation gap G02: Lookup is case sensitive; nz returns 404 although NZ rows exist; 1 check passed |
| PublicHolidays | POST | `/admin/publicholidays/sync/{year}/{country}` | PH-B02 Sync with lowercase country code | 200 | 200 | PASS | 1 check passed |
| PublicHolidays | GET | `/admin/publicholidays/country/{country}` | PH-B03 Lowercase sync did not create duplicates | 200 | 200 | PASS | 2 checks passed |
| PublicHolidays | POST | `/admin/publicholidays/sync/{year}/{country}` | PH-B04 Sync year 0 | 400 | 500 | **FAIL** | 500: System.Exception rethrown from the Nager sync (upstream 400); Defect D09 |


### SpecificationChangeRequests

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| SpecificationChangeRequests | PUT | `/admin/specification-change-requests/{id}` | CR-B01 PUT changes stage and reason | 200 | 200 | PASS | Validation gap G03: Only resolved is applied; other fields are silently ignored; 1 check passed |
| SpecificationChangeRequests | GET | `/admin/specification-change-requests/{id}` | CR-B02 Stage and reason unchanged after PUT | 200 | 200 | PASS | Validation gap G03: ; 3 checks passed |
| SpecificationChangeRequests | PUT | `/admin/specification-change-requests/{id}` | CR-B03 PUT body id differs from route id | 200 | 200 | PASS | Validation gap G04: Body id is ignored; other controllers reject a mismatch; 1 check passed |
| SpecificationChangeRequests | POST | `/admin/specification-change-requests` | CR-B04 created_at without timezone designator | 201 | 500 | **FAIL** | 500: ArgumentException, DateTime Kind=Unspecified cannot be written to timestamp with time zone; Defect D07 |
| SpecificationChangeRequests | POST | `/admin/specification-change-requests` | CR-B05 created_at omitted | 201 or 400 | 201 | PASS | 1 check passed |
| SpecificationChangeRequests | POST | `/admin/specification-change-requests` | CR-B06 Very long reason (10000 characters) | 201 | 201 | PASS | 2 checks passed |
| SpecificationChangeRequests | POST | `/admin/specification-change-requests` | CR-B07 Client-supplied id on create | 201 or 400 | 201 | **FAIL** | Accepted (201) with the client id 9001; sequence left at a lower value (DB-CR04, DB-CR05); Defect D05 |


### SpecificationHandoffs

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| SpecificationHandoffs | POST | `/admin/specificationhandoffs` | SH-B01 notified without timezone designator | 201 | 500 | **FAIL** | 500: ArgumentException, DateTime Kind=Unspecified cannot be written to timestamp with time zone; Defect D07 |
| SpecificationHandoffs | POST | `/admin/specificationhandoffs` | SH-B02 expected earlier than notified | 201 | 201 | PASS | Validation gap G05: No check that the expected completion follows the notification; 1 check passed |
| SpecificationHandoffs | POST | `/admin/specificationhandoffs` | SH-B03 Specification from a different project | 201 | 201 | PASS | Validation gap G06: Specification 3 belongs to project 2; the pairing is not validated; 1 check passed |


### HandoffSignoff

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| HandoffSignoff | POST | `/admin/handoff-signoffs` | SO-B01 signoff_date without timezone designator | 201 | 500 | **FAIL** | 500: ArgumentException, DateTime Kind=Unspecified cannot be written to timestamp with time zone; Defect D07 |
| HandoffSignoff | POST | `/admin/handoff-signoffs` | SO-B02 Null signoff_date and success | 201 | 201 | PASS | 3 checks passed |


### HandoffDelays

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| HandoffDelays | POST | `/admin/handoffdelays` | HD-B01 delay_hours 0 | 201 | 201 | PASS | 2 checks passed |
| HandoffDelays | POST | `/admin/handoffdelays` | HD-B02 Negative delay_hours | 201 | 201 | PASS | Validation gap G07: A negative delay is accepted; 1 check passed |
| HandoffDelays | POST | `/admin/handoffdelays` | HD-B03 delay_hours Int32 maximum | 201 | 201 | PASS | 2 checks passed |
| HandoffDelays | POST | `/admin/handoffdelays` | HD-B04 delay_hours Int32 overflow | 400 | 400 | PASS | 1 check passed |
| HandoffDelays | POST | `/admin/handoffdelays` | HD-B05 delay_hours null | 201 | 201 | PASS | 2 checks passed |


### SpecificationUsers

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| SpecificationUsers | POST | `/admin/specificationusers` | SU-B01 Project-level assignment (no specification) | 201 | 201 | PASS | 2 checks passed |
| SpecificationUsers | POST | `/admin/specificationusers` | SU-B02 Same project-level assignment again | 409 | 201 | **FAIL** | Accepted (201); second identical (2, NULL, 4) row stored (DB-SU03); Defect D10 |


### SpecificationDevDays

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| SpecificationDevDays | POST | `/admin/specificationdevdays` | DD-B01 specified_month not the first of the month | 201 | 201 | PASS | Validation gap G08: A second record for October 2026 is accepted because the day differs; 1 check passed |
| SpecificationDevDays | POST | `/admin/specificationdevdays` | DD-B02 Negative dev_days | 201 | 201 | PASS | Validation gap G09: ; 1 check passed |
| SpecificationDevDays | POST | `/admin/specificationdevdays` | DD-B03 dev_days 0 | 201 | 201 | PASS | 2 checks passed |
| SpecificationDevDays | POST | `/admin/specificationdevdays` | DD-B04 dev_days null | 201 | 201 | PASS | 2 checks passed |
| SpecificationDevDays | POST | `/admin/specificationdevdays` | DD-B05 Three decimal places | 201 | 201 | PASS | 2 checks passed |
| SpecificationDevDays | GET | `/admin/specificationdevdays/{id}` | DD-B06 Precision persisted | 200 | 200 | PASS | 2 checks passed |


## Setup and teardown steps

Helper requests that create data for other cases or remove it afterwards. They are not counted in the test totals.

| Controller | Method | Endpoint | Test Case | Expected Status | Actual Status | Result | Notes |
|---|---|---|---|---|---|---|---|
| Preflight | GET | `/admin/users/{id}` | PF-01 Seed fingerprint user 4 is Lucy Heartfilia | 200 | 200 | PASS | 3 checks passed |
| Preflight | GET | `/admin/users` | PF-02 Seed fingerprint four seeded users | 200 | 200 | PASS | 3 checks passed |
| Shifts (setup) | POST | `/admin/shifts` | HR-S01 Setup: shift on Christmas Day for user 2 | 201 | 201 | PASS | 1 check passed |
| Shifts (setup) | DELETE | `/admin/shifts/{id}` | HR-S02 Teardown: delete Christmas shift | 200 | 200 | PASS | 1 check passed |
| SpecificationHandoffs | POST | `/admin/specificationhandoffs` | CX-S01 Setup: handoff for cascade test | 201 | 201 | PASS | 1 check passed |
| HandoffSignoff | POST | `/admin/handoff-signoffs` | CX-S02 Setup: signoff on that handoff | 201 | 201 | PASS | 1 check passed |
| HandoffDelays | POST | `/admin/handoffdelays` | CX-S03 Setup: delay on that handoff | 201 | 201 | PASS | 1 check passed |
| Users (setup) | POST | `/admin/users` | CX-S04 Setup: temporary user | 201 | 201 | PASS | 1 check passed |
| LeaveBalances | POST | `/admin/leave-balances` | CX-S05 Setup: leave balance for temp user | 201 | 201 | PASS | 1 check passed |
| SpecificationUsers | POST | `/admin/specificationusers` | CX-S06 Setup: assignment for temp user | 201 | 201 | PASS | 1 check passed |
| SpecificationChangeRequests | POST | `/admin/specification-change-requests` | CX-S07 Setup: change request by temp user | 201 | 201 | PASS | 1 check passed |
| HandoffSignoff | POST | `/admin/handoff-signoffs` | CX-S08 Setup: signoff by temp user | 201 | 201 | PASS | 1 check passed |
| Users (setup) | DELETE | `/admin/users/{id}` | CX-E04 Delete the temporary user | 200 | 200 | PASS | 1 check passed |


## Database persistence checks

Run with psql directly against the isolated test container after the Bruno run, using the ids recorded in the run. Full queries: [evidence/04_db_persistence_checks.txt](evidence/04_db_persistence_checks.txt).

| Check | Controller | After | What was verified | Expected | Actual | Result |
|---|---|---|---|---|---|---|
| DB-LB01 | LeaveBalances | POST + PUT (LB-E01, LB-E05) | Updated balance stored for user 2 | `2\|7\|15.5\|144.5` | `2\|7\|15.5\|144.5` | PASS |
| DB-LB02 | LeaveBalances | PUT (LB-B04) | Int32 maximum and 0.125 hours stored exactly | `2147483647\|0.125` | `2147483647\|0.125` | PASS |
| DB-LB03 | LeaveBalances | POST (LB-B01) | Negative values stored (validation gap evidence) | `-5\|-10.5` | `-5\|-10.5` | PASS |
| DB-LB04 | LeaveBalances | DELETE rejected (LB-U12) | Balance still present after unsupported DELETE | `1` | `1` | PASS |
| DB-LB05 | LeaveBalances | Duplicate POST (LB-U01) | Only one balance per user | `0` | `0` | PASS |
| DB-HR01 | Hours | Teardown DELETE (HR-S02) | Christmas setup shift removed | `0` | `0` | PASS |
| DB-PH01 | PublicHolidays | Repeated sync (PH-E02, PH-B02) | No duplicate (name, country, date) rows after re-syncs | `0` | `0` | PASS |
| DB-PH02 | PublicHolidays | Lowercase sync (PH-B02) | No lowercase country rows created | `0` | `0` | PASS |
| DB-CR01 | SpecificationChangeRequests | POST + PUT (CR-E01, CR-E04, CR-B01) | Request stored with original stage and reason | `2\|2\|Specs\|BRUNO-IT` | `2\|2\|Specs\|BRUNO-IT` | PASS |
| DB-CR02 | SpecificationChangeRequests | DELETE (CR-E07) | Temporary request removed | `0` | `0` | PASS |
| DB-CR03 | SpecificationChangeRequests | POST (CR-B06) | 10000 character reason stored in full | `10000` | `10000` | PASS |
| DB-CR04 | SpecificationChangeRequests | POST with client id (CR-B07) | Row stored with the client-chosen id 9001 | `1` | `1` | PASS |
| DB-CR05 | SpecificationChangeRequests | POST with client id (CR-B07) | Id sequence was not advanced past 9001 (future collision risk) | `true` | `true` | PASS |
| DB-CR06 | SpecificationChangeRequests | POST missing/empty stage (CR-U04, CR-U05) | Rows with an empty stage were stored | `2` | `2` | PASS |
| DB-SH01 | SpecificationHandoffs | POST + PUT (SH-E01, SH-E04) | Updated handoff stored | `BRUNO-IT Approved\|t` | `BRUNO-IT Approved\|t` | PASS |
| DB-SH02 | SpecificationHandoffs | DELETE (SH-E07) | Temporary handoff removed | `0` | `0` | PASS |
| DB-SH03 | SpecificationHandoffs | POST without notified (SH-U09) | Placeholder minimum date stored instead of rejecting the request (API echoes 0001-01-01, PostgreSQL holds -infinity) | `-infinity` | `-infinity` | PASS |
| DB-SO01 | HandoffSignoff | POST + PUT (SO-E01, SO-E04) | Updated signoff stored | `t\|1\|BRUNO-IT signoff updated\|f` | `t\|1\|BRUNO-IT signoff updated\|f` | PASS |
| DB-SO02 | HandoffSignoff | DELETE (SO-E07) | Temporary signoff removed | `0` | `0` | PASS |
| DB-HD01 | HandoffDelays | POST + PUT (HD-E01, HD-E04) | Updated delay stored | `t\|BRUNO-IT supplier delay\|24` | `t\|BRUNO-IT supplier delay\|24` | PASS |
| DB-HD02 | HandoffDelays | DELETE (HD-E07) | Temporary delay removed | `0` | `0` | PASS |
| DB-SU01 | SpecificationUsers | POST + PUT (SU-E01, SU-E04) | Updated assignment stored | `1\|1\|4` | `1\|1\|4` | PASS |
| DB-SU02 | SpecificationUsers | DELETE (SU-E07) | Temporary assignment removed | `0` | `0` | PASS |
| DB-SU03 | SpecificationUsers | Duplicate project-level POST (SU-B01, SU-B02) | Two identical (2, NULL, 4) assignments exist | `2` | `2` | PASS |
| DB-DD01 | SpecificationDevDays | POST + PUT (DD-E01, DD-E04) | Updated dev days stored | `2026-10-01\|7.25` | `2026-10-01\|7.25` | PASS |
| DB-DD02 | SpecificationDevDays | DELETE (DD-E07) | Temporary record removed | `0` | `0` | PASS |
| DB-DD03 | SpecificationDevDays | POST (DD-B05) | Three decimal places stored exactly | `0.001` | `0.001` | PASS |
| DB-DD04 | SpecificationDevDays | POST without month (DD-U09) | Placeholder minimum date stored instead of rejecting the request (API echoes 0001-01-01, PostgreSQL holds -infinity) | `-infinity` | `-infinity` | PASS |
| DB-CX01 | Referential integrity | DELETE handoff (CX-E01) | Handoff, its signoff and its delay all removed | `0` | `0` | PASS |
| DB-CX02 | Referential integrity | DELETE user (CX-E04) | User, leave balance and assignment removed | `0` | `0` | PASS |
| DB-CX03 | Referential integrity | DELETE user (CX-E04) | Change request kept with requester_id NULL | `1` | `1` | PASS |
| DB-CX04 | Referential integrity | DELETE user (CX-E04) | Signoff kept with signer_id NULL | `1` | `1` | PASS |

# Firecrest API Integration Testing: Remaining Nine Controllers

This report covers automated Bruno integration testing of the nine controllers not covered by the original Bruno collection.
Users, Projects, ProjectSpecifications, Shifts and LeaveRequests were tested separately by a teammate.

**All results here are executed results** from Bruno CLI 4.2.1, run on 2026-10-21 10:34 against a disposable PostgreSQL database.
Expectations were written from the controller code and database constraints before the run. Actual statuses come only from the recorded run.

## Summary

| | Pass | Fail | Blocked | Total |
|---|---|---|---|---|
| Expected cases | 73 | 4 | 0 | 77 |
| Unexpected cases | 54 | 29 | 0 | 83 |
| Boundary cases | 35 | 7 | 0 | 42 |
| **All test cases** | **162** | **40** | **0** | **202** |

- **Endpoints:** 42 of 42 covered (the nine controllers expose 42 endpoints).
- **Checks:** 350 of 392 Bruno checks (status and field checks) passed across 215 requests. This includes 13 setup and teardown steps, all of which passed.
- **Persistence:** 32 of 32 direct database checks passed.
- **Defects:** 11 distinct defects explain all 40 failures (1 high, 4 medium, 6 low). There are also 13 validation gaps. See [defects.md](defects.md).
- **Isolation:** the development database was confirmed unchanged afterwards. All 50 original Bruno files are unchanged.

Every failure is an API defect, not a test or environment problem. Each failure was traced to the server-side exception, or to the stored row, that caused it.

### Results by controller

| Controller | Endpoints | Endpoints covered | Expected | Unexpected | Boundary | Pass | Fail | Blocked |
|---|---|---|---|---|---|---|---|---|
| LeaveBalances | 5 | 5 | 7 | 13 | 7 | 27 | 0 | 0 |
| Hours | 2 | 2 | 6 | 8 | 6 | 19 | 1 | 0 |
| PublicHolidays | 5 | 5 | 8 | 7 | 4 | 17 | 2 | 0 |
| SpecificationChangeRequests | 5 | 5 | 10 | 10 | 7 | 17 | 10 | 0 |
| SpecificationHandoffs | 5 | 5 | 9 | 9 | 3 | 15 | 6 | 0 |
| HandoffSignoff | 5 | 5 | 11 | 9 | 2 | 16 | 6 | 0 |
| HandoffDelays | 5 | 5 | 9 | 9 | 5 | 20 | 3 | 0 |
| SpecificationUsers | 5 | 5 | 9 | 9 | 2 | 13 | 7 | 0 |
| SpecificationDevDays | 5 | 5 | 8 | 9 | 6 | 18 | 5 | 0 |

The referential-integrity cases (`10 Referential integrity` folder) are counted under the controller whose endpoint they call. LB-U12 calls `DELETE /admin/leave-balances/{id}`, which does not exist, to confirm it is refused with 405. It is counted under LeaveBalances but is not one of the 42 endpoints.

## Files

| File | Contents |
|---|---|
| [test-results.md](test-results.md) | Full results table (Controller, Method, Endpoint, Test Case, Expected Status, Actual Status, Result, Notes), split into expected, unexpected and boundary cases, plus setup steps and database checks |
| [test-results.csv](test-results.csv) | The same table as CSV for spreadsheets |
| [defects.md](defects.md) | Defects with severity, evidence and suggested fixes; validation gaps; problems in the original requests |
| [evidence/](evidence/) | Raw evidence (index below) |

## Coverage comparison

| | Original collection (5 controllers) | This work (9 controllers) |
|---|---|---|
| Controllers | Users, Projects, ProjectSpecifications, Shifts, LeaveRequests | LeaveBalances, Hours, PublicHolidays, SpecificationChangeRequests, SpecificationHandoffs, HandoffSignoff, HandoffDelays, SpecificationUsers, SpecificationDevDays |
| Endpoints in code | 33 (7 + 7 + 7 + 6 + 6) | 42 |
| Bruno requests | 38 (plus 3 SpecificationChangeRequests requests that could not run as written) | 215 (202 test cases, 13 setup/teardown) |
| Requests with assertions | 0 | 215 |
| Status code assertions | None. A request "passes" whenever it gets a response | Every request asserts the exact expected status |
| Field assertions | None | Response fields, list membership, Location headers and messages |
| Unexpected and boundary cases | A few manual "missing fields" requests | 83 unexpected, 42 boundary |
| Test data | Fixed ids in the requests | Created by the tests; ids captured at runtime with `bru.setVar` |
| Persistence verified | No | Read back through the API and checked directly in PostgreSQL |
| Target | `Local Docker` environment (port 5050, shared database) | `Isolated Test` environment, guarded so it can only reach the disposable API |
| Automated run | Manual, one request at a time | `bru run` in one command, with JSON, JUnit and HTML reports |

The original requests are useful for manual exploration in the Bruno app, but they cannot fail. This suite records a pass or fail for every request, so it can be re-run to detect regressions.

### Coverage by endpoint

| Controller | Method | Endpoint | Cases | Pass | Fail | Blocked |
|---|---|---|---|---|---|---|
| LeaveBalances | GET | `/admin/leave-balances` | 1 | 1 | 0 | 0 |
| LeaveBalances | GET | `/admin/leave-balances/{id}` | 6 | 6 | 0 | 0 |
| LeaveBalances | GET | `/admin/leave-balances/user/{userId}` | 3 | 3 | 0 | 0 |
| LeaveBalances | POST | `/admin/leave-balances` | 9 | 9 | 0 | 0 |
| LeaveBalances | PUT | `/admin/leave-balances/{id}` | 7 | 7 | 0 | 0 |
| Hours | GET | `/admin/hours/fortnight` | 17 | 16 | 1 | 0 |
| Hours | GET | `/admin/hours/fortnight/all` | 3 | 3 | 0 | 0 |
| PublicHolidays | POST | `/admin/publicholidays/sync/{year}/{country}` | 6 | 4 | 2 | 0 |
| PublicHolidays | GET | `/admin/publicholidays` | 1 | 1 | 0 | 0 |
| PublicHolidays | GET | `/admin/publicholidays/{id}` | 3 | 3 | 0 | 0 |
| PublicHolidays | GET | `/admin/publicholidays/country/{country}` | 5 | 5 | 0 | 0 |
| PublicHolidays | GET | `/admin/publicholidays/country/{country}/date/{date}` | 4 | 4 | 0 | 0 |
| SpecificationChangeRequests | GET | `/admin/specification-change-requests` | 2 | 1 | 1 | 0 |
| SpecificationChangeRequests | GET | `/admin/specification-change-requests/{id}` | 6 | 5 | 1 | 0 |
| SpecificationChangeRequests | POST | `/admin/specification-change-requests` | 13 | 5 | 8 | 0 |
| SpecificationChangeRequests | PUT | `/admin/specification-change-requests/{id}` | 4 | 4 | 0 | 0 |
| SpecificationChangeRequests | DELETE | `/admin/specification-change-requests/{id}` | 2 | 2 | 0 | 0 |
| SpecificationHandoffs | GET | `/admin/specificationhandoffs` | 1 | 1 | 0 | 0 |
| SpecificationHandoffs | GET | `/admin/specificationhandoffs/{id}` | 4 | 4 | 0 | 0 |
| SpecificationHandoffs | POST | `/admin/specificationhandoffs` | 10 | 5 | 5 | 0 |
| SpecificationHandoffs | PUT | `/admin/specificationhandoffs/{id}` | 3 | 2 | 1 | 0 |
| SpecificationHandoffs | DELETE | `/admin/specificationhandoffs/{id}` | 3 | 3 | 0 | 0 |
| HandoffSignoff | GET | `/admin/handoff-signoffs` | 2 | 1 | 1 | 0 |
| HandoffSignoff | GET | `/admin/handoff-signoffs/{id}` | 6 | 5 | 1 | 0 |
| HandoffSignoff | POST | `/admin/handoff-signoffs` | 7 | 5 | 2 | 0 |
| HandoffSignoff | PUT | `/admin/handoff-signoffs/{id}` | 5 | 3 | 2 | 0 |
| HandoffSignoff | DELETE | `/admin/handoff-signoffs/{id}` | 2 | 2 | 0 | 0 |
| HandoffDelays | GET | `/admin/handoffdelays` | 1 | 1 | 0 | 0 |
| HandoffDelays | GET | `/admin/handoffdelays/{id}` | 5 | 5 | 0 | 0 |
| HandoffDelays | POST | `/admin/handoffdelays` | 11 | 9 | 2 | 0 |
| HandoffDelays | PUT | `/admin/handoffdelays/{id}` | 4 | 3 | 1 | 0 |
| HandoffDelays | DELETE | `/admin/handoffdelays/{id}` | 2 | 2 | 0 | 0 |
| SpecificationUsers | GET | `/admin/specificationusers` | 1 | 1 | 0 | 0 |
| SpecificationUsers | GET | `/admin/specificationusers/{id}` | 5 | 5 | 0 | 0 |
| SpecificationUsers | POST | `/admin/specificationusers` | 8 | 3 | 5 | 0 |
| SpecificationUsers | PUT | `/admin/specificationusers/{id}` | 4 | 2 | 2 | 0 |
| SpecificationUsers | DELETE | `/admin/specificationusers/{id}` | 2 | 2 | 0 | 0 |
| SpecificationDevDays | GET | `/admin/specificationdevdays` | 1 | 1 | 0 | 0 |
| SpecificationDevDays | GET | `/admin/specificationdevdays/{id}` | 5 | 5 | 0 | 0 |
| SpecificationDevDays | POST | `/admin/specificationdevdays` | 12 | 8 | 4 | 0 |
| SpecificationDevDays | PUT | `/admin/specificationdevdays/{id}` | 3 | 2 | 1 | 0 |
| SpecificationDevDays | DELETE | `/admin/specificationdevdays/{id}` | 2 | 2 | 0 | 0 |

## Methodology

**1. Isolated environment.** The tests create, update and delete data, so they never touch the development database.
- A separate PostgreSQL 18 container, `fc-bruno-test`, used anonymous storage on Docker's default network, bound to 127.0.0.1:55440. It had no shared volume, network or port with the development database.
- It was built from `db/init.sql` on the `handover-no-authentik` branch, with a random password kept outside the repository.
- A separate build of the backend ran on http://localhost:5390 with `ASPNETCORE_ENVIRONMENT=Testing`, so `appsettings.Development.json` was not loaded.
- Its connection string came only from an environment variable pointing at port 55440. It was tagged `Application Name=firecrest-bruno-test` so its connections could be identified.

**2. Isolation checks before any write.** These ran before every run ([evidence/00_isolation_checks.txt](evidence/00_isolation_checks.txt)), and testing would have stopped if any failed:
- The test API's connections appeared on the test container (2) and not on the development container (0).
- The API returned exactly the four `init.sql` users, matching a direct psql query on the test container and differing from the development data.
- Volume, network and port separation were confirmed.

**3. Safety guard in the suite.** The suite's folder-level pre-request script refuses to send anything unless the environment is `Isolated Test` and `baseURL` is http://localhost:5390.
- It was proven by pointing the environment at an unused port. The request was refused and the run stopped ([evidence/00_safety_guard_refusal.txt](evidence/00_safety_guard_refusal.txt)).
- The first folder also stops the run if the seed fingerprint is not present.

**4. Test design.** Expected statuses were derived before execution from three sources:
- **Contract:** the behaviour the controller code intends, such as `NotFound` or `Conflict`.
- **Probe:** where the code has no handling, the behaviour HTTP semantics and the database constraints require. For example, a duplicate that violates a unique constraint must be 409, not 500. Probe cases that fail are defects.
- **Gap:** questionable input with no stated rule, such as negative values. The case asserts the documented behaviour and is listed as a validation gap rather than a failure.

Each controller follows the same pattern:
- create a record and capture its id;
- read it by id and in the list;
- update it and read it back;
- create a temporary record, delete it, and confirm it is gone;
- then run the unexpected and boundary cases.

Referential-integrity cases run last, because they delete a user and a handoff to exercise `ON DELETE CASCADE` and `ON DELETE SET NULL`. Cases that depend on a record skip themselves (reported as BLOCKED) if it was not created. No case was blocked.

**5. Execution.** Bruno CLI 4.2.1 was run through npx from a temporary folder outside the repository:
`bru run "Integration Tests (Isolated)" -r --env "Isolated Test" --reporter-json ... --reporter-junit ... --reporter-html ...`

**6. Persistence.** Every POST, PUT and DELETE was verified twice:
- by a following GET through the API;
- by 32 direct psql queries on the test container, using the ids recorded in the run ([evidence/04_db_persistence_checks.txt](evidence/04_db_persistence_checks.txt)).

**7. Root cause of failures.** For each failing case, the server log of the test API ([evidence/07_test_api_server.log](evidence/07_test_api_server.log)) was used to identify the exception behind the status. Defects are grouped by that root cause.

**8. Runs.**
- **Run 1** ([evidence/run1_superseded/](evidence/run1_superseded/)) surfaced one test-design problem. CR-U05 (empty stage) reused the specification and requester of CR-U04. Because CR-U04's request was wrongly accepted, CR-U05 hit a unique-key collision rather than testing the empty stage. CR-U05 was given its own key, and CR-U04 and CR-U05 were reclassified as probes.
- **Run 2** used a freshly re-created and re-seeded database and is the run reported here. Both runs produced 40 failing requests.

**9. After testing.** The development database was fingerprinted again: the row count and md5 of every row in all 15 tables matched the baseline taken before testing ([evidence/05_devdb_unchanged.txt](evidence/05_devdb_unchanged.txt)). The sha256 of all 50 original Bruno files also matched ([evidence/06_original_bruno_unchanged.txt](evidence/06_original_bruno_unchanged.txt)). The test container and test API were then removed.

**Not changed:** backend code, existing Bruno requests, Git branches and commits, and the development database.

## Limitations

- Results describe the code on branch `handover-no-authentik` at commit `17d77ab` as built on the test date. The backend, `db/init.sql` and the unit tests are identical in main at `45e2c6e`, so the results also apply there.
- Public holiday tests depend on the live date.nager.at API. Its data (for example, Christmas Day 2026 in NZ) was correct on the test date.
- Hours expectations were calculated by hand from the `init.sql` seed shifts and leave, plus one Christmas Day shift created by the suite.
- The client-supplied-id defect (D05) was tested on change requests only. The other controllers use the same `Add(entity)` pattern and are likely affected, but this was not executed.
- There is no authentication on the API, so authorisation could not be tested (gap G13).

## Evidence index

| File | Contents |
|---|---|
| evidence/00_isolation_checks.txt | Isolation checks for the reported run |
| evidence/00_safety_guard_refusal.txt | Proof that the suite refuses a non-isolated target |
| evidence/01_testdb_before.txt, 03_testdb_after.txt | Test database row counts before and after run 2 |
| evidence/02_bruno_cli_run.log | Full Bruno CLI console output of run 2 |
| evidence/bruno_results.json / .junit.xml / .html | Bruno reporters for run 2 (requests, responses, every check) |
| evidence/test_manifest.json | Each case's category, case type, expected status and rationale, written before execution |
| evidence/04_db_persistence_checks.txt / .json | Direct PostgreSQL verification |
| evidence/05_devdb_unchanged.txt | Development database unchanged |
| evidence/06_original_bruno_unchanged.txt | Original Bruno files unchanged |
| evidence/07_test_api_server.log | Test API server log (exceptions behind each 500) |
| evidence/08_original_change_request_requests.txt | The three original change request requests executed unchanged |
| evidence/run1_superseded/ | Run 1 output, kept for transparency |

## Re-running the suite

1. Start a disposable PostgreSQL container loaded with `db/init.sql`.
2. Start the backend on port 5390 with `ASPNETCORE_ENVIRONMENT=Testing` and `ConnectionStrings__Database` pointing at that container.
3. From `bruno/Firecrest APIs`, run:

   `npx @usebruno/cli@4.2.1 run "Integration Tests (Isolated)" -r --env "Isolated Test"`

The suite expects a freshly seeded database. The guard refuses to run against any other base URL.

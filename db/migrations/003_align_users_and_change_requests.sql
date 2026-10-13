-- Brings an older Firecrest database up to the schema the merged backend expects:
--   * users.region and users.is_active (the User model now reads both)
--   * the specification_change_request table (new in the Module B change-request feature)
--
-- Additive and repeatable: it only adds two columns and one table and fills the new columns. It never
-- drops or truncates anything, never changes an existing value, and never resets a sequence.
-- Running it twice changes nothing the second time. Run 001 and 002 first.
--   Get-Content db\migrations\003_align_users_and_change_requests.sql -Raw | docker exec -i postgres-dev sh -c 'psql -U "$POSTGRES_USER" -d FirecrestDB -v ON_ERROR_STOP=1'

BEGIN;

-- ---------------------------------------------------------------------------------------------
-- users: add region and is_active
-- ---------------------------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS region TEXT;
-- Everyone who exists today is still active
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Data transformation: the backend reads region as a required value, so existing employees need one.
-- The three people in the sample data keep the regions db/init.sql gives them, and anyone else gets
-- their country code. Only empty values are filled, so a region that is already set is never changed.
UPDATE users
   SET region = CASE name
                  WHEN 'Terry' THEN 'NZ-WGN'
                  WHEN 'Terry Jeffords' THEN 'NZ-WGN'
                  WHEN 'Benjamin' THEN 'NZ-MWT'
                  WHEN 'Benjamin Franklin' THEN 'NZ-MWT'
                  WHEN 'Sarah' THEN 'NZ-STL'
                  WHEN 'Sarah Parker' THEN 'NZ-STL'
                  ELSE country
                END
 WHERE region IS NULL;
UPDATE users SET is_active = TRUE WHERE is_active IS NULL;

-- ---------------------------------------------------------------------------------------------
-- specification_change_request: new table, same definition as db/init.sql
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS specification_change_request (
    id SERIAL PRIMARY KEY,
    specification_id INTEGER NOT NULL,
    requester_id INTEGER NOT NULL,
    stage TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (specification_id) REFERENCES project_specification(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users(id)
);

COMMIT;

-- ---------------------------------------------------------------------------------------------
-- Verification (read-only), run after the migration:
--   SELECT id, name, role, country, region, is_active, manager_id FROM users ORDER BY id;
--   SELECT to_regclass('public.specification_change_request') IS NOT NULL AS change_request_table_exists;
--   SELECT (SELECT count(*) FROM users) users, (SELECT count(*) FROM leave_request) leaves,
--          (SELECT count(*) FROM shift) shifts, (SELECT count(*) FROM user_identity) links;
-- ---------------------------------------------------------------------------------------------

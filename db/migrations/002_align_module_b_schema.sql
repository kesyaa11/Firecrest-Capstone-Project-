-- Brings the Module B tables of an older Firecrest database up to the schema the backend expects
-- (the same shape as db/init.sql).
--
-- Additive and repeatable: it only adds columns and one table, backfills new columns from existing
-- data, and widens one column type. It never drops or truncates anything, never touches users,
-- leave, shift, payroll or user_identity data, and never resets a sequence. Running it twice changes
-- nothing the second time.
--   Get-Content db\migrations\002_align_module_b_schema.sql -Raw | docker exec -i postgres-dev sh -c 'psql -U "$POSTGRES_USER" -d FirecrestDB -v ON_ERROR_STOP=1'
--
-- Columns that exist only in the old schema are left in place so no data is lost:
--   project_specification.author_id, project_specification.content, handoff_signoff.signer_role
--   (and shift.work_description, which is outside Module B).

BEGIN;

-- ---------------------------------------------------------------------------------------------
-- project: add client and is_active
-- ---------------------------------------------------------------------------------------------
ALTER TABLE project ADD COLUMN IF NOT EXISTS client TEXT;
-- Existing rows take the default, so every existing project stays active
ALTER TABLE project ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ---------------------------------------------------------------------------------------------
-- project_specification: add name, link and target_date, and give the checklist flags defaults
-- (the project_id foreign key is left exactly as it is, including what happens on project delete)
-- ---------------------------------------------------------------------------------------------
ALTER TABLE project_specification ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE project_specification ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE project_specification ADD COLUMN IF NOT EXISTS target_date DATE;

-- Data transformation: the old column "content" is the specification's name in the current schema
-- (the seed data uses the same text for both). Copy it across, and fall back to the version, then
-- to a generated label, so no row ends up without a name.
UPDATE project_specification SET name = content
 WHERE name IS NULL AND content IS NOT NULL AND content <> '';
UPDATE project_specification SET name = COALESCE(NULLIF(version, ''), 'Specification ' || id)
 WHERE name IS NULL;

-- The backend reads these as true/false, so empty values become false and new rows default to false
UPDATE project_specification SET specs = FALSE WHERE specs IS NULL;
UPDATE project_specification SET build = FALSE WHERE build IS NULL;
UPDATE project_specification SET test_sheet = FALSE WHERE test_sheet IS NULL;
UPDATE project_specification SET launch_plan = FALSE WHERE launch_plan IS NULL;
UPDATE project_specification SET roadmap = FALSE WHERE roadmap IS NULL;
ALTER TABLE project_specification ALTER COLUMN specs SET DEFAULT FALSE;
ALTER TABLE project_specification ALTER COLUMN build SET DEFAULT FALSE;
ALTER TABLE project_specification ALTER COLUMN test_sheet SET DEFAULT FALSE;
ALTER TABLE project_specification ALTER COLUMN launch_plan SET DEFAULT FALSE;
ALTER TABLE project_specification ALTER COLUMN roadmap SET DEFAULT FALSE;

-- The name is required in the current schema, now that every row has one
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM project_specification WHERE name IS NULL) THEN
    ALTER TABLE project_specification ALTER COLUMN name SET NOT NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------------------------
-- specification_users: new table (the old schema did not have it)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS specification_users (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    specification_id INTEGER,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES project(id),
    FOREIGN KEY (specification_id) REFERENCES project_specification(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ---------------------------------------------------------------------------------------------
-- specification_handoff: add description and success
-- ---------------------------------------------------------------------------------------------
ALTER TABLE specification_handoff ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE specification_handoff ADD COLUMN IF NOT EXISTS success BOOLEAN;

-- ---------------------------------------------------------------------------------------------
-- handoff_signoff: add handoff_message and success, and keep the time of day on signoff_date
-- ---------------------------------------------------------------------------------------------
ALTER TABLE handoff_signoff ADD COLUMN IF NOT EXISTS handoff_message TEXT;
ALTER TABLE handoff_signoff ADD COLUMN IF NOT EXISTS success BOOLEAN;

-- Data transformation: signoff_date was a plain date, the backend stores a timestamp. Existing dates
-- become midnight on the same day, so nothing is lost. Skipped when it is already a timestamp.
DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
       WHERE table_name = 'handoff_signoff' AND column_name = 'signoff_date') = 'date' THEN
    ALTER TABLE handoff_signoff ALTER COLUMN signoff_date TYPE TIMESTAMP USING signoff_date::timestamp;
  END IF;
END $$;

-- ---------------------------------------------------------------------------------------------
-- specification_dev_day: add project_id
-- ---------------------------------------------------------------------------------------------
ALTER TABLE specification_dev_day ADD COLUMN IF NOT EXISTS project_id INTEGER;

-- Data transformation: the project comes from the specification each row already points at
UPDATE specification_dev_day d
   SET project_id = s.project_id
  FROM project_specification s
 WHERE d.project_id IS NULL AND s.id = d.specification_id;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'specification_dev_day_project_id_fkey') THEN
    ALTER TABLE specification_dev_day
      ADD CONSTRAINT specification_dev_day_project_id_fkey FOREIGN KEY (project_id) REFERENCES project(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM specification_dev_day WHERE project_id IS NULL) THEN
    ALTER TABLE specification_dev_day ALTER COLUMN project_id SET NOT NULL;
  END IF;
END $$;

COMMIT;

-- ---------------------------------------------------------------------------------------------
-- Verification (read-only), run after the migration:
--   SELECT id, name, client, is_active FROM project ORDER BY id;
--   SELECT id, project_id, name, version, specs, build, test_sheet, launch_plan, roadmap, author_id
--     FROM project_specification ORDER BY id;
--   SELECT to_regclass('public.specification_users') IS NOT NULL AS specification_users_exists;
--   SELECT table_name, column_name, data_type FROM information_schema.columns
--    WHERE table_name IN ('specification_handoff', 'handoff_signoff', 'specification_dev_day')
--    ORDER BY table_name, ordinal_position;
-- ---------------------------------------------------------------------------------------------

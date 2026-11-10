-- Tiered competitor gating: FREE_TRIAL (1) / PREMIUM (3) / SCALE (5).
-- For databases created before this change. Fresh databases: `npm run db:push`.
-- Legacy plans map free → FREE_TRIAL, apprentice + sorcerer → PREMIUM, coven → SCALE.

BEGIN;

DO $$ BEGIN
  CREATE TYPE plan_tier_enum AS ENUM ('FREE_TRIAL', 'PREMIUM', 'SCALE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- workspaces ---------------------------------------------------------------
ALTER TABLE workspaces ALTER COLUMN plan_tier DROP DEFAULT;
ALTER TABLE workspaces ALTER COLUMN plan_tier TYPE plan_tier_enum USING (
  CASE plan_tier::text
    WHEN 'apprentice' THEN 'PREMIUM'
    WHEN 'sorcerer'   THEN 'PREMIUM'
    WHEN 'coven'      THEN 'SCALE'
    WHEN 'PREMIUM'    THEN 'PREMIUM'
    WHEN 'SCALE'      THEN 'SCALE'
    ELSE 'FREE_TRIAL'
  END
)::plan_tier_enum;
ALTER TABLE workspaces ALTER COLUMN plan_tier SET DEFAULT 'FREE_TRIAL';

ALTER TABLE workspaces RENAME COLUMN spells_balance TO monthly_task_runs_remaining;
-- Allowance comes from the new tier (apprentice had 3 runs; Premium has 10).
UPDATE workspaces SET monthly_task_runs_remaining = GREATEST(
  CASE plan_tier WHEN 'PREMIUM' THEN 10 WHEN 'SCALE' THEN 35 ELSE 1 END - spells_used, 0);

ALTER TABLE workspaces
  ADD COLUMN max_competitors_per_task integer NOT NULL DEFAULT 1,
  ADD COLUMN free_trial_consumed boolean NOT NULL DEFAULT false;

UPDATE workspaces SET
  max_competitors_per_task = CASE plan_tier WHEN 'PREMIUM' THEN 3 WHEN 'SCALE' THEN 5 ELSE 1 END,
  free_trial_consumed = (plan_tier = 'FREE_TRIAL' AND spells_used > 0);

ALTER TABLE workspaces
  ADD CONSTRAINT ws_max_competitors_chk CHECK (max_competitors_per_task BETWEEN 1 AND 5),
  ADD CONSTRAINT ws_runs_nonneg_chk CHECK (monthly_task_runs_remaining >= 0);

-- grimoire_spells (task execution audit) ----------------------------------
ALTER TABLE grimoire_spells
  ADD COLUMN competitor_count integer GENERATED ALWAYS AS (jsonb_array_length(selected_domains)) STORED,
  ADD COLUMN tier_at_execution plan_tier_enum,
  ADD COLUMN quota_state text NOT NULL DEFAULT 'reserved';

UPDATE grimoire_spells g SET tier_at_execution = w.plan_tier, quota_state = 'committed'
FROM workspaces w WHERE w.id = g.workspace_id;

ALTER TABLE grimoire_spells ALTER COLUMN tier_at_execution SET NOT NULL;

COMMIT;

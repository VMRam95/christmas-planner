-- Migration: Allow external assignments (third-party gift givers)
-- When assigned_by is NULL, it means someone outside the app will give the gift

-- Make assigned_by nullable
ALTER TABLE christmas_planner.assignments
ALTER COLUMN assigned_by DROP NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN christmas_planner.assignments.assigned_by IS
'User ID of who assigned the gift. NULL means assigned to someone external (not in the app).';

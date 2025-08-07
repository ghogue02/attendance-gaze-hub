-- Delete auto-generated absent records for Aug 6, 2025
DELETE FROM attendance 
WHERE date = '2025-08-06' 
AND status = 'absent' 
AND notes = 'Automatically marked absent (no record for day)';

-- Add Aug 6, 2025 to cancelled_days to prevent future auto-processing
INSERT INTO cancelled_days (date, reason, created_by) 
VALUES ('2025-08-06', 'Manual correction - mixed attendance already recorded', null)
ON CONFLICT (date) DO NOTHING;
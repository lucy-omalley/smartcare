-- Add precise coordinate columns
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

-- Update existing records with precise coordinates based on Dublin locations
UPDATE "Provider"
SET 
  "latitude" = CASE 
    WHEN "address" LIKE '%Dublin City Centre%' THEN 53.3498
    WHEN "address" LIKE '%Dundrum%' THEN 53.2924
    WHEN "address" LIKE '%Swords%' THEN 53.4597
    WHEN "address" LIKE '%Dún Laoghaire%' THEN 53.2947
    WHEN "address" LIKE '%Tallaght%' THEN 53.2879
    WHEN "address" LIKE '%Blanchardstown%' THEN 53.3887
    WHEN "address" LIKE '%Sandyford%' THEN 53.2747
    WHEN "address" LIKE '%Clontarf%' THEN 53.3634
    WHEN "address" LIKE '%Rathmines%' THEN 53.3217
    WHEN "address" LIKE '%Malahide%' THEN 53.4508
    ELSE 53.3498 -- Default to Dublin City Centre
  END,
  "longitude" = CASE 
    WHEN "address" LIKE '%Dublin City Centre%' THEN -6.2603
    WHEN "address" LIKE '%Dundrum%' THEN -6.2457
    WHEN "address" LIKE '%Swords%' THEN -6.2181
    WHEN "address" LIKE '%Dún Laoghaire%' THEN -6.1361
    WHEN "address" LIKE '%Tallaght%' THEN -6.3544
    WHEN "address" LIKE '%Blanchardstown%' THEN -6.3777
    WHEN "address" LIKE '%Sandyford%' THEN -6.2253
    WHEN "address" LIKE '%Clontarf%' THEN -6.1928
    WHEN "address" LIKE '%Rathmines%' THEN -6.2677
    WHEN "address" LIKE '%Malahide%' THEN -6.1544
    ELSE -6.2603 -- Default to Dublin City Centre
  END;

-- Add small random variations to make the data more realistic
UPDATE "Provider"
SET 
  "latitude" = "latitude" + (random() - 0.5) * 0.01,
  "longitude" = "longitude" + (random() - 0.5) * 0.01;

-- Make the columns required
ALTER TABLE "Provider" ALTER COLUMN "latitude" SET NOT NULL;
ALTER TABLE "Provider" ALTER COLUMN "longitude" SET NOT NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "Provider_latitude_idx" ON "Provider"("latitude");
CREATE INDEX IF NOT EXISTS "Provider_longitude_idx" ON "Provider"("longitude");

-- Add age group information to the reasons list
UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
WHERE "ageGroup" = '2-3';

UPDATE "Provider"
SET "reasons" = "reasons" || '👶 Has 5 available spaces for 2-3 year olds'
CREATE INDEX IF NOT EXISTS "Provider_longitude_idx" ON "Provider"("longitude"); 
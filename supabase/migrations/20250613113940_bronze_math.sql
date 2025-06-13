-- Add status column to Karyawan table
ALTER TABLE "Karyawan" ADD COLUMN "status" TEXT DEFAULT 'Staff';

-- Update existing records to have default status
UPDATE "Karyawan" SET "status" = 'Staff' WHERE "status" IS NULL;
-- Migration to add new fields for enhanced CRM functionality
-- Run this script to update your database schema

-- Add accountNotes field to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS "accountNotes" TEXT;

-- Add contactTypes and otherType fields to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS "contactTypes" JSON DEFAULT '[]';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS "otherType" VARCHAR;

-- Update existing contacts to have empty contactTypes array if null
UPDATE contacts SET "contactTypes" = '[]' WHERE "contactTypes" IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN accounts."accountNotes" IS 'Rich text notes for the account with formatting';
COMMENT ON COLUMN contacts."contactTypes" IS 'Array of contact type labels (DM, Budget Holder, etc.)';
COMMENT ON COLUMN contacts."otherType" IS 'Custom contact type when "Other" is selected'; 
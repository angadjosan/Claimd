-- Add reasoning output columns to applications table
-- Based on reasoning_output_schema.json
-- All fields are optional (NULLABLE)

ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS reasoning_overall_recommendation TEXT, -- overall_recommendation
ADD COLUMN IF NOT EXISTS reasoning_confidence_score FLOAT, -- confidence_score
ADD COLUMN IF NOT EXISTS reasoning_summary TEXT, -- summary
ADD COLUMN IF NOT EXISTS reasoning_phases JSONB, -- phases object
ADD COLUMN IF NOT EXISTS reasoning_missing_information JSONB, -- missing_information array
ADD COLUMN IF NOT EXISTS reasoning_suggested_actions JSONB; -- suggested_actions array
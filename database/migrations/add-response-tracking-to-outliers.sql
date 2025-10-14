-- Migration: Add response tracking fields to youtube_outliers
-- Date: 2025-10-13
-- Purpose: Track YouTube videos created in response to outliers

-- Add response_video_id and response_url columns
ALTER TABLE youtube_outliers
ADD COLUMN IF NOT EXISTS response_video_id VARCHAR(20),
ADD COLUMN IF NOT EXISTS response_url TEXT;

-- Create index for faster queries on response_video_id
CREATE INDEX IF NOT EXISTS idx_youtube_outliers_response_video_id ON youtube_outliers(response_video_id);

-- Comment on columns
COMMENT ON COLUMN youtube_outliers.response_video_id IS 'YouTube video ID of our response video';
COMMENT ON COLUMN youtube_outliers.response_url IS 'Full URL to our response video on YouTube';

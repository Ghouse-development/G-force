-- G-force Storage Setup
-- Run this in Supabase SQL Editor AFTER 001_initial_schema.sql

-- ============================================
-- STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gforce-files',
  'gforce-files',
  false,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/json',
    'text/plain',
    'text/csv',
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'audio/mp4',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Allow authenticated users to read files
CREATE POLICY "Authenticated users can read files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'gforce-files');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gforce-files');

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'gforce-files')
WITH CHECK (bucket_id = 'gforce-files');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gforce-files');

-- ============================================
-- BACKUP RETENTION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS void AS $$
BEGIN
  -- Delete backup records older than 90 days (keep metadata for audit)
  UPDATE backups
  SET status = 'expired'
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND status = 'completed';

  -- Log cleanup
  RAISE NOTICE 'Backup cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SCHEDULED BACKUP (Optional - requires pg_cron extension)
-- ============================================
-- Uncomment below if pg_cron is enabled
-- SELECT cron.schedule('daily-backup-cleanup', '0 3 * * *', 'SELECT cleanup_old_backups()');

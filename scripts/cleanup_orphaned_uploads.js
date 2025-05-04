// scripts/cleanup_orphaned_uploads.js
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials in environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function cleanupOrphanedUploads() {
  const { data: uploads, error } = await supabase
    .from('client_uploads')
    .select('id, file_path')

  if (error) {
    console.error('Error fetching uploads:', error)
    return
  }

  let deletedCount = 0

  for (const upload of uploads) {
    const { data, error: storageError } = await supabase.storage
      .from('client-uploads')
      .download(upload.file_path)

    if (storageError) {
      // File does not exist, delete the row
      const { error: dbError } = await supabase
        .from('client_uploads')
        .delete()
        .eq('id', upload.id)

      if (dbError) {
        console.error(
          `Failed to delete DB row for ${upload.file_path}:`,
          dbError,
        )
      } else {
        console.log(`Deleted orphaned DB row for: ${upload.file_path}`)
        deletedCount++
      }
    }
  }

  console.log(`Cleanup complete. Deleted ${deletedCount} orphaned rows.`)
}

cleanupOrphanedUploads()

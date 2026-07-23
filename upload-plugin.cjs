const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function upload() {
  await supabase.storage.createBucket('plugins', { public: false });
  const fileBuffer = fs.readFileSync('/workspace/app-c18l1vf2nz7l/public/aidetector-wp.zip');
  const { data, error } = await supabase.storage.from('plugins').upload('aidetector-wp.zip', fileBuffer, {
    upsert: true,
    contentType: 'application/zip'
  });
  if (error) {
    console.error('Upload failed:', error.message);
  } else {
    console.log('Upload success:', data);
  }
}
upload();

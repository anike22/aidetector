import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '/workspace/app-c18l1vf2nz7l/.env' });

const url = process.env.VITE_SUPABASE_URL;
// The env file doesn't have SUPABASE_SERVICE_ROLE_KEY, it only has anon key.
// But the shell env has SUPABASE_SERVICE_ROLE_KEY!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function upload() {
  const fileContent = fs.readFileSync('/workspace/app-c18l1vf2nz7l/public/aidetector-wp.zip');
  
  const { data, error } = await supabase.storage
    .from('plugins')
    .upload('aidetector-wp.zip', fileContent, {
      contentType: 'application/zip',
      upsert: true
    });
    
  if (error) {
    console.error('Upload failed:', error);
  } else {
    console.log('Upload successful:', data);
  }

  try {
    const chromeContent = fs.readFileSync('/workspace/app-c18l1vf2nz7l/public/aidetector-chrome.zip');
    const { data: cData, error: cError } = await supabase.storage
      .from('plugins')
      .upload('aidetector-chrome.zip', chromeContent, {
        contentType: 'application/zip',
        upsert: true
      });
    if (cError) console.error('Chrome Upload failed:', cError);
    else console.log('Chrome Upload successful:', cData);
  } catch (e) {
    console.log('No chrome extension zip found');
  }
}

upload();

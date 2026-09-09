import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.storage.from('plugins').download('aidetector-wp.zip');
  console.log("Download result:", data ? "Success: " + data.size + " bytes" : error?.message);
}
check();

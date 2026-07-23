import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hzjnrmxwzkeaodvusszx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6am5ybXh3emtlYW9kdnVzc3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMDcwOTAsImV4cCI6MjA5NTg4MzA5MH0.qs_0_MLK_y5C6ud3sefXozLpi2xWLHCe-AT5yl-mFZw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const { data, error } = await supabase.auth.signUp({
    email: 'jamesanthony.has@gmail.com',
    password: '1394Ad#$'
  });

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('User created:', data.user?.id);
  }
}

createAdmin();

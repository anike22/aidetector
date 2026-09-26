import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hzjnrmxwzkeaodvusszx.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6am5ybXh3emtlYW9kdnVzc3p4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDMwNzA5MCwiZXhwIjoyMDk1ODgzMDkwfQ.ZOO5fkOJihZQP1mKO1yEll-571xbCcb2JU4nNLlZwOI";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.functions.invoke('auth-proxy', {
    body: { action: 'reset_password', email: 'test@example.com' }
  });
  if (error) {
    try {
      const body = await error.context.json();
      console.log("Error body:", body);
    } catch (e) {
      const text = await error.context.text();
      console.log("Error text:", text);
    }
  }
}

test();

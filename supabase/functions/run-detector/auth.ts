import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export async function validateToken(token: string, supabaseUrl: string, supabaseServiceKey: string) {
  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  
  if (token.startsWith('aid_')) {
    const { data: keyData, error } = await supabaseClient.from('api_keys').select('user_id').eq('api_key', token).single();
    if (error || !keyData) throw new Error('Invalid API Key');
    
    // Optional: update last_used_at
    supabaseClient.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('api_key', token).then();
    return { user: { id: keyData.user_id } };
  } else {
    // Treat as JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');
    return { user };
  }
}

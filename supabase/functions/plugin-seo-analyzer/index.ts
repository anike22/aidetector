import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    
    let user;
    let isDirectKey = false;
    if (token.startsWith('aid_')) {
      const { data: keyData, error: keyError } = await supabaseClient.from('api_keys').select('user_id').eq('api_key', token).single();
      if (keyError || !keyData) {
        return new Response(JSON.stringify({ error: 'Invalid or expired API Key' }), { status: 401, headers: corsHeaders });
      }
      user = { id: keyData.user_id };
      supabaseClient.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('api_key', token).then();
    } else if (!token.startsWith('eyJ')) {
      user = { id: 'direct_key_user' };
      isDirectKey = true;
    } else {
      const { data: authData, error: authError } = await supabaseClient.auth.getUser(token);
      if (authError || !authData.user) {
        return new Response(JSON.stringify({ error: 'Invalid or expired API Key' }), { status: 401, headers: corsHeaders });
      }
      user = authData.user;
    }

    const { title, content, keyword } = await req.json();
    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), { status: 400, headers: corsHeaders });
    }

    let systemKeys: Record<string, string> = {};
    try {
      const { data } = await supabaseClient.from('system_api_keys').select('provider, key_value').eq('status', 'active');
      if (data) {
        data.forEach(k => { systemKeys[k.provider] = k.key_value; });
      }
    } catch (e) {}

    let geminiKey = isDirectKey && !token.startsWith('sk-') ? token : (systemKeys['gemini'] || Deno.env.get('GEMINI_API_KEY') || Deno.env.get('INTEGRATIONS_API_KEY'));
    const openAIKey = token.startsWith('sk-') ? token : (systemKeys['openai'] || Deno.env.get('OPENAI_API_KEY'));

    if (!geminiKey && !openAIKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500, headers: corsHeaders });
    }

    const prompt = `
    You are an expert SEO analyzer. Analyze the following WordPress post.
    Title: "${title || 'No title'}"
    Focus Keyword: "${keyword || 'No keyword provided'}"
    Content: "${content.substring(0, 15000)}"

    Please provide a detailed SEO analysis in valid JSON format ONLY, without any markdown formatting.
    Format exactly like this:
    {
      "seoScore": 85,
      "readabilityScore": 75,
      "keywordDensity": "2.5%",
      "missingKeywords": ["kw1", "kw2"],
      "metaTitleSuggestion": "A compelling meta title around 60 chars",
      "metaDescriptionSuggestion": "A compelling meta description around 155 chars",
      "headingAnalysis": ["Good H1", "Consider adding more H2s"],
      "internalLinkSuggestions": ["Idea for link 1", "Idea for link 2"],
      "externalLinkSuggestions": ["Link out to authority 1", "Link out to authority 2"],
      "faqSuggestions": [{"question": "Q1", "answer": "A1"}, {"question": "Q2", "answer": "A2"}],
      "schemaSuggestions": ["Article", "FAQPage"],
      "featuredSnippetSuggestions": ["Add a summary list at the top"],
      "feedback": ["Great use of keyword.", "Content is well structured."]
    }
    `;

    let resultText = '';
    
    if (token.startsWith('sk-')) {
       if (!openAIKey) throw new Error('OpenAI key not configured in admin');
       // Call OpenAI
       const res = await fetch('https://api.openai.com/v1/chat/completions', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openAIKey}` },
         body: JSON.stringify({
           model: 'gpt-4o-mini',
           messages: [{ role: 'user', content: prompt }],
           temperature: 0.2
         })
       });
       if (!res.ok) {
         const errData = await res.json().catch(() => ({}));
         throw new Error('Failed to reach OpenAI: ' + (errData.error?.message || res.statusText));
       }
       const data = await res.json();
       resultText = data.choices?.[0]?.message?.content || '';
    } else {
       if (!geminiKey) throw new Error('Gemini key not configured in admin. Please connect Gemini in the dashboard.');
       // Call Gemini
       const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
         method: 'POST',
         headers: { 
           'Content-Type': 'application/json',
           'x-goog-api-key': geminiKey
         },
         body: JSON.stringify({
           contents: [{ role: 'user', parts: [{ text: prompt }] }],
           generationConfig: { temperature: 0.2 }
         })
       });
       if (!res.ok) {
         const errData = await res.json().catch(() => ({}));
         throw new Error('Failed to reach Gemini: ' + (errData.error?.message || res.statusText));
       }
       const data = await res.json();
       resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse JSON. Raw response:', resultText);
      throw new Error('Failed to parse analysis result');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('SEO Analyzer Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message === 'Invalid or expired API Key' ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_GEMINI_API_KEY') || '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { action, text, context } = await req.json();

    // Auth check
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!text || text.trim().length < 10) {
      return new Response(JSON.stringify({ error: 'Text too short for analysis' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompts: Record<string, string> = {
      brainstorm: `You are an academic writing assistant. The student is working on: ${context?.topic || 'an academic essay'} (${context?.essay_type || 'general'} essay, ${context?.academic_level || 'undergraduate'} level).\n\nBrainstorm 5 specific, relevant ideas or arguments for the following section or topic:\n\n"${text}"\n\nProvide concrete, actionable ideas. Be academic and focused. Do NOT write the essay for them.`,
      
      explain_concept: `You are an academic tutor. Explain the following concept clearly and concisely for a ${context?.academic_level || 'undergraduate'} student:\n\n"${text}"\n\nProvide a clear explanation with an example. Keep it academic and educational.`,
      
      suggest_argument: `You are an academic writing coach. The student is writing a ${context?.essay_type || 'argumentative'} essay on: ${context?.topic || 'this topic'}.\n\nSuggest 3 strong academic arguments for the following claim or section:\n\n"${text}"\n\nEach argument should be specific, evidence-based in approach, and academically sound.`,
      
      strengthen_thesis: `You are an academic writing expert. Review this thesis statement and suggest 3 improved versions that are more specific, arguable, and academically strong:\n\n"${text}"\n\nMaintain the student's original intent. Each version should be clearer and more debatable.`,
      
      suggest_counterargument: `You are an academic debate coach. For the following argument or claim, identify 3 realistic counterarguments an opponent might raise:\n\n"${text}"\n\nFor each counterargument, briefly explain why someone might hold this opposing view. This will help the student address weaknesses in their argument.`,
      
      improve_clarity: `You are an academic editor. Rewrite the following passage to improve clarity and readability while maintaining all the original ideas and academic tone:\n\n"${text}"\n\nProvide the rewritten version only. Do not add new ideas.`,
      
      improve_grammar: `You are a grammar editor. Correct any grammatical errors in the following text while preserving the original meaning and style:\n\n"${text}"\n\nReturn only the corrected text with brief notes on key changes.`,
      
      make_concise: `You are an academic editor focused on conciseness. Rewrite the following passage to be more concise — eliminate redundancy, wordiness, and filler phrases while preserving all key ideas:\n\n"${text}"\n\nAim to reduce length by 20-30% without losing substance.`,
      
      improve_academic_tone: `You are an academic writing coach. Rewrite the following passage to use more formal, academic language appropriate for ${context?.academic_level || 'undergraduate'} level writing:\n\n"${text}"\n\nReplace informal language with academic vocabulary. Maintain the original argument and ideas.`,

      generate_outline: `You are an academic writing expert. Create a detailed, structured outline for a ${context?.essay_type || 'argumentative'} essay at ${context?.academic_level || 'undergraduate'} level.\n\nTopic: ${text}\nCitation style: ${context?.citation_style || 'APA'}\nTarget words: ${context?.target_word_count || 1000}\n\nReturn a JSON array of outline sections with this exact structure:\n[{"title": "Introduction", "description": "Hook → Background → Thesis statement", "position": 0}, ...]\n\nInclude 5-8 sections appropriate for the essay type. Return ONLY valid JSON, no markdown.`,
    };

    const prompt = prompts[action];
    if (!prompt) {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', errText);
      return new Response(JSON.stringify({ error: 'AI service temporarily unavailable' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiRes.json();
    const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return new Response(JSON.stringify({ result: responseText, action }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('essay-assist error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

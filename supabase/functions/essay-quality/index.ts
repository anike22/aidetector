import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withBillingGuard } from "../_shared/billing.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_GEMINI_API_KEY') || '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  return withBillingGuard(req, { featureSlug: 'seo_content_studio', corsHeaders }, async (ctx) => {

  try {
    const { essay_text, essay_type, academic_level, citation_style, citations_count, sources_count } = ctx.body;

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

    if (!essay_text || essay_text.trim().length < 50) {
      return new Response(JSON.stringify({ error: 'Essay too short for quality analysis (minimum 50 characters)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const wordCount = essay_text.trim().split(/\s+/).filter(Boolean).length;

    const analysisPrompt = `You are an expert academic writing evaluator. Analyze the following ${essay_type || 'academic'} essay written at ${academic_level || 'undergraduate'} level.

Essay text (${wordCount} words):
---
${essay_text.slice(0, 8000)}
---

Citation style: ${citation_style || 'APA'}
Citations found in text: ${citations_count || 0}
Sources listed: ${sources_count || 0}

Evaluate the essay on these 11 dimensions and return a JSON object with this EXACT structure (no markdown, just JSON):
{
  "scores": {
    "thesis": <0-100>,
    "argument": <0-100>,
    "evidence": <0-100>,
    "organization": <0-100>,
    "coherence": <0-100>,
    "critical_thinking": <0-100>,
    "grammar": <0-100>,
    "readability": <0-100>,
    "academic_tone": <0-100>,
    "citation_quality": <0-100>,
    "originality": <0-100>
  },
  "issues": [
    {
      "category": "evidence",
      "score": 55,
      "title": "Unsupported factual claims in paragraphs 2 and 4",
      "description": "Several factual claims appear without supporting citations or evidence.",
      "location": "Paragraph 2, Paragraph 4",
      "recommendation": "Add peer-reviewed citations for each factual claim. Consider using phrases like 'According to [Author, Year]...' before each major claim.",
      "severity": "high"
    }
  ],
  "summary": "Brief overall assessment (2-3 sentences)"
}

Scoring guidelines:
- 90-100: Exceptional academic work
- 75-89: Strong, meets graduate standards  
- 60-74: Adequate, meets undergraduate standards
- 40-59: Below expectations, significant weaknesses
- 0-39: Major revision needed

Be honest and specific. Base scores on actual content analysis, not essay length. Include 3-8 specific, actionable issues in the issues array. Return ONLY valid JSON.`;

    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: analysisPrompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', errText);
      return new Response(JSON.stringify({ error: 'Quality analysis service temporarily unavailable' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response
    let analysisResult;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      analysisResult = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      console.error('Failed to parse quality analysis JSON:', rawText.slice(0, 200));
      return new Response(JSON.stringify({ error: 'Failed to parse analysis results' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const scores = analysisResult.scores || {};
    const scoreValues = Object.values(scores).filter((v): v is number => typeof v === 'number');
    const overall = scoreValues.length > 0
      ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
      : 0;

    return new Response(JSON.stringify({
      overall_score: overall,
      thesis_score: scores.thesis ?? 0,
      argument_score: scores.argument ?? 0,
      evidence_score: scores.evidence ?? 0,
      organization_score: scores.organization ?? 0,
      coherence_score: scores.coherence ?? 0,
      critical_thinking_score: scores.critical_thinking ?? 0,
      grammar_score: scores.grammar ?? 0,
      readability_score: scores.readability ?? 0,
      academic_tone_score: scores.academic_tone ?? 0,
      citation_quality_score: scores.citation_quality ?? 0,
      originality_score: scores.originality ?? 0,
      issues: Array.isArray(analysisResult.issues) ? analysisResult.issues : [],
      summary: analysisResult.summary || '',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('essay-quality error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  });
});

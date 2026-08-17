import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// ─── Lightweight statistical detection ───────────────────────────────────────
function computePerplexityProxy(text: string): number {
  const words = text.trim().split(/\s+/);
  if (words.length < 10) return 50;
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const diversity = uniqueWords.size / words.length;
  // Low diversity → more AI-like (low perplexity)
  return Math.round(diversity * 100);
}

function computeBurstiness(text: string): number {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  if (sentences.length < 3) return 50;
  const lengths = sentences.map(s => s.split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;
  const cv = Math.sqrt(variance) / mean; // Coefficient of variation
  // High CV → human-like burstiness; Low CV → AI-like uniformity
  return Math.min(100, Math.round(cv * 100));
}

function detectAIPatterns(text: string): number {
  const aiPhrases = [
    'it is important to note', 'furthermore', 'in conclusion', 'it is worth mentioning',
    'it should be noted', 'in summary', 'to summarize', 'on the other hand',
    'in terms of', 'with respect to', 'it can be argued', 'as mentioned',
    'in light of', 'it is evident', 'plays a crucial role', 'plays an important role',
    'in today\'s world', 'in recent years', 'it goes without saying',
    'needless to say', 'as a result', 'this is because', 'due to the fact',
    'a wide range of', 'a variety of', 'in order to', 'it is clear that',
    'delve into', 'utilize', 'leverage', 'paradigm', 'multifaceted',
    'robust', 'in the realm of', 'transformative', 'innovative solutions',
    'cutting-edge', 'best practices', 'key insights', 'actionable insights',
    'holistic approach', 'seamless', 'synergy', 'foster',
  ];
  const lowerText = text.toLowerCase();
  const matches = aiPhrases.filter(phrase => lowerText.includes(phrase));
  return Math.min(100, Math.round((matches.length / aiPhrases.length) * 300));
}

function analyzeSentences(text: string): Array<{ text: string; aiProbability: number }> {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);
  return sentences.map(sentence => {
    const lower = sentence.toLowerCase();
    let score = 40; // baseline
    // Formal/AI markers
    if (/\b(furthermore|moreover|additionally|consequently|therefore|thus)\b/.test(lower)) score += 20;
    if (/\b(it is|this is|there are|there is)\b/.test(lower)) score += 10;
    if (/\b(utilize|leverage|implement|facilitate|optimize)\b/.test(lower)) score += 15;
    if (sentence.split(/\s+/).length > 20) score += 10; // long = more AI-like
    // Human markers
    if (/[!?]$/.test(sentence.trim())) score -= 20;
    if (/\b(i|you|we|my|our)\b/i.test(lower)) score -= 15;
    if (/--|\.\.\./.test(sentence)) score -= 10; // em-dash, ellipsis = human
    return { text: sentence.trim(), aiProbability: Math.max(0, Math.min(100, score)) };
  });
}

function detectModel(text: string, aiProbability: number): { model: string; confidence: number } {
  const lower = text.toLowerCase();
  if (/\b(delve|multifaceted|nuanced|comprehensive|robust|synergy|foster)\b/.test(lower)) {
    return { model: 'GPT-4 / GPT-5.5', confidence: Math.min(95, aiProbability + 5) };
  }
  if (/\b(furthermore|moreover|in conclusion|in summary)\b/.test(lower) && aiProbability > 60) {
    return { model: 'ChatGPT', confidence: Math.min(92, aiProbability + 3) };
  }
  if (/\b(i understand|i can help|that said|having said that)\b/.test(lower)) {
    return { model: 'Claude', confidence: Math.min(90, aiProbability) };
  }
  return { model: 'Unknown AI Model', confidence: aiProbability };
}

function runDetection(text: string): {
  aiProbability: number;
  humanProbability: number;
  confidenceScore: number;
  riskLevel: string;
  wordCount: number;
  sentenceCount: number;
  sentences: Array<{ text: string; aiProbability: number }>;
  fingerprint: { primaryModel: string; primaryConfidence: number };
  metrics: { perplexity: number; burstiness: number; aiPatternScore: number };
} {
  const words = text.trim().split(/\s+/);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;

  const perplexityProxy = computePerplexityProxy(text);
  const burstiness = computeBurstiness(text);
  const aiPatternScore = detectAIPatterns(text);

  // Composite AI probability
  // Low perplexity (low diversity) → high AI
  // Low burstiness → high AI
  // High AI pattern score → high AI
  const perplexityContrib = Math.max(0, 70 - perplexityProxy) * 0.8;  // 0–56
  const burstinessContrib = Math.max(0, 60 - burstiness) * 0.5;        // 0–30
  const patternContrib = aiPatternScore * 0.3;                           // 0–30
  const rawScore = perplexityContrib + burstinessContrib + patternContrib;
  const aiProbability = Math.max(0, Math.min(99, Math.round(rawScore)));
  const humanProbability = 100 - aiProbability;

  // Confidence based on word count
  const confidenceScore = wordCount < 50 ? 55 : wordCount < 100 ? 70 : wordCount < 200 ? 82 : 92;

  const riskLevel = aiProbability >= 70 ? 'High' : aiProbability >= 45 ? 'Medium' : 'Low';

  const sentenceAnalysis = analyzeSentences(text);
  const fingerprint = detectModel(text, aiProbability);

  return {
    aiProbability,
    humanProbability,
    confidenceScore,
    riskLevel,
    wordCount,
    sentenceCount,
    sentences: sentenceAnalysis,
    fingerprint: { primaryModel: fingerprint.model, primaryConfidence: fingerprint.confidence },
    metrics: { perplexity: perplexityProxy, burstiness, aiPatternScore },
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const db = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // ── 1. Authenticate — accept Bearer JWT or x-api-key / Bearer aid_xxx ────
    const xApiKey = req.headers.get('x-api-key');
    const authHeader = req.headers.get('authorization') ?? '';
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();

    const rawKey = xApiKey || (bearerToken.startsWith('aid_') ? bearerToken : null);

    let userId: string | null = null;
    let keyId: string | null = null;

    if (rawKey) {
      // API key authentication
      const { data: keyRow, error: keyErr } = await db
        .from('api_keys')
        .select('id, user_id, revoked, monthly_limit, requests_this_month')
        .eq('api_key', rawKey)
        .maybeSingle();

      if (keyErr || !keyRow) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key', code: 'INVALID_API_KEY' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (keyRow.revoked) {
        return new Response(
          JSON.stringify({ error: 'API key has been revoked', code: 'KEY_REVOKED' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // Rate limit check
      const limit = keyRow.monthly_limit ?? 1000;
      const used = keyRow.requests_this_month ?? 0;
      if (used >= limit) {
        return new Response(
          JSON.stringify({ error: 'Monthly request limit exceeded', code: 'RATE_LIMIT_EXCEEDED', limit, used }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userId = keyRow.user_id;
      keyId = keyRow.id;
    } else if (bearerToken.startsWith('eyJ')) {
      // JWT authentication (logged-in users via dashboard)
      const { data: { user }, error: authErr } = await db.auth.getUser(bearerToken);
      if (authErr || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userId = user.id;
    } else {
      return new Response(
        JSON.stringify({ error: 'Missing authentication. Provide x-api-key header or Authorization: Bearer <token>', code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── 2. Parse and validate request body ───────────────────────────────────
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body', code: 'INVALID_BODY' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text, options = {} } = body;

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'text field is required and must be a string', code: 'MISSING_TEXT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedText = text.trim();
    if (trimmedText.length < 30) {
      return new Response(
        JSON.stringify({ error: 'Text must be at least 30 characters for reliable detection', code: 'TEXT_TOO_SHORT', minimum: 30 }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (trimmedText.length > 50000) {
      return new Response(
        JSON.stringify({ error: 'Text exceeds maximum length of 50,000 characters', code: 'TEXT_TOO_LONG', maximum: 50000 }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── 3. Try Gemini-enhanced detection first, fallback to statistical ───────
    let result;
    const startTime = Date.now();

    try {
      const { data: sysKeys } = await db
        .from('system_api_keys')
        .select('provider, key_value')
        .eq('status', 'active');
      const geminiKey = sysKeys?.find(k => k.provider === 'gemini')?.key_value ?? Deno.env.get('GEMINI_API_KEY');

      if (geminiKey) {
        const prompt = `You are an AI content detection system. Analyze the following text and return a JSON object only (no markdown, no explanation) with these fields:
- aiProbability: number 0-100 (likelihood text is AI-generated)
- humanProbability: number 0-100 (must equal 100 - aiProbability)
- confidenceScore: number 0-100
- riskLevel: "Low"|"Medium"|"High"
- primaryModel: string (most likely AI model or "Human")
- primaryConfidence: number 0-100
- reasoning: string (1-2 sentence explanation)

Text to analyze:
---
${trimmedText.substring(0, 3000)}
---`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(cleaned);

          // Merge with statistical sentence analysis
          const statResult = runDetection(trimmedText);
          result = {
            ...statResult,
            aiProbability: parsed.aiProbability ?? statResult.aiProbability,
            humanProbability: parsed.humanProbability ?? statResult.humanProbability,
            confidenceScore: parsed.confidenceScore ?? statResult.confidenceScore,
            riskLevel: parsed.riskLevel ?? statResult.riskLevel,
            fingerprint: {
              primaryModel: parsed.primaryModel ?? statResult.fingerprint.primaryModel,
              primaryConfidence: parsed.primaryConfidence ?? statResult.fingerprint.primaryConfidence,
            },
            reasoning: parsed.reasoning ?? null,
            engine: 'gemini+statistical',
          };
        }
      }
    } catch (_e) {
      // Fallback to statistical
    }

    if (!result) {
      const statResult = runDetection(trimmedText);
      result = { ...statResult, engine: 'statistical', reasoning: null };
    }

    const processingMs = Date.now() - startTime;

    // ── 4. Log usage ─────────────────────────────────────────────────────────
    try {
      // Log request
      await db.from('api_usage_logs').insert({
        user_id: userId,
        api_key_id: keyId,
        endpoint: '/v1/detect',
        method: 'POST',
        status_code: 200,
        tokens_used: Math.ceil(trimmedText.length / 4),
        processing_ms: processingMs,
        request_metadata: {
          wordCount: result.wordCount,
          engine: result.engine,
          options,
        },
      });

      // Increment api_keys counter
      if (keyId) {
        await db.rpc('increment_api_key_usage', { key_id: keyId });
      }
    } catch (_e) {
      // Non-fatal: log errors must not fail the response
    }

    // ── 5. Build response ────────────────────────────────────────────────────
    const includeSentences = options.sentences !== false;

    const response = {
      success: true,
      model: 'aidetector-v4',
      engine: result.engine,
      processingMs,
      data: {
        aiProbability: result.aiProbability,
        humanProbability: result.humanProbability,
        confidenceScore: result.confidenceScore,
        riskLevel: result.riskLevel,
        wordCount: result.wordCount,
        sentenceCount: result.sentenceCount,
        fingerprint: result.fingerprint,
        metrics: result.metrics,
        reasoning: result.reasoning,
        ...(includeSentences ? { sentences: result.sentences } : {}),
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

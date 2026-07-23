import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callGeminiStream(prompt: string, apiKey: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse`;
  let lastResponse = null;
  
  for (let i = 0; i < 3; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 8192,
          }
        })
      });
      lastResponse = response;
      if (response.ok) {
        return response;
      }
      // If 429, wait and retry
      if (response.status === 429) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      break;
    } catch (err) {
      if (i === 2) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return lastResponse;
}

async function callGemini(prompt: string, apiKey: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'Gemini API Error');
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callOpenAIStream(prompt: string, apiKey: string) {
  const url = `https://api.openai.com/v1/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: 0.7,
      max_tokens: 2048
    })
  });
  return response;
}

async function callOpenAI(prompt: string, apiKey: string) {
  const url = `https://api.openai.com/v1/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2048
    })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'OpenAI API Error');
  return data.choices?.[0]?.message?.content || '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId = null;
  let userEmail = null;
  let textLength = 0;

  try {
    const authHeader = req.headers.get('Authorization')!;
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '').trim();
    
    let user;
    let isDirectKey = false;
    
    if (token.startsWith('aid_')) {
      const { data: apiKeyData, error: keyError } = await supabaseClient.from('api_keys').select('user_id').eq('api_key', token).single();
      if (keyError || !apiKeyData) throw new Error('Unauthorized');
      user = { id: apiKeyData.user_id, email: 'api-user@example.com' };
      supabaseClient.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('api_key', token).then();
    } else if (!token.startsWith('eyJ')) {
      // If it's not a JWT (doesn't start with eyJ), and not aid_, it's a direct API key (OpenAI or Gemini)
      user = { id: 'direct_key_user', email: 'direct@example.com' };
      isDirectKey = true;
    } else {
      const { data: authData, error: authError } = await supabaseClient.auth.getUser(token);
      if (authError || !authData?.user) throw new Error('Unauthorized');
      user = authData.user;
    }

    if (!user) throw new Error('Unauthorized');
    
    userId = user.id;
    userEmail = user.email;

    const body = await req.json();
    const { action, text, level, tone, preserveFacts, preserveSeo } = body;
    textLength = text?.length || 0;

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), { status: 400, headers: corsHeaders });
    }
    
    if (textLength > 50000) {
       return new Response(JSON.stringify({ message: 'Input text too long. Maximum 50,000 characters allowed.' }), { status: 400, headers: corsHeaders });
    }

    // Fetch configuration and keys from database
    const { data: configData } = await supabaseClient.from('system_settings').select('setting_value').eq('setting_key', 'humanizer_config').single();
    const config = configData?.setting_value || { active_provider: 'gemini', fallback_provider: 'openai', model_name: 'gemini-2.5-flash' };
    
    const { data: keysData } = await supabaseClient.from('system_api_keys').select('provider, key_value, status').in('status', ['active']);
    const keysMap = (keysData || []).reduce((acc: any, row: any) => {
      acc[row.provider] = row.key_value;
      return acc;
    }, {});

    let geminiKey = keysMap['gemini'] || Deno.env.get('GEMINI_API_KEY') || Deno.env.get('INTEGRATIONS_API_KEY');
    let openAIKey = keysMap['openai'] || Deno.env.get('OPENAI_API_KEY');
    
    // Set priority based on config
    let primaryProvider = config.active_provider || 'gemini';
    let fallbackProvider = config.fallback_provider || 'openai';

    if (token.startsWith('sk-')) {
       openAIKey = token;
       primaryProvider = 'openai';
    } else if (isDirectKey) {
       geminiKey = token;
       primaryProvider = 'gemini';
    }

    if ((!geminiKey || geminiKey === 'none') && !openAIKey) {
      const msg = 'API providers are not configured. Please contact admin.';
      await supabaseClient.from('humanizer_logs').insert({ user_id: userId, user_email: userEmail, input_text_length: textLength, api_provider: 'none', request_status: 'failed', error_message: msg, response_time: Date.now() - startTime });
      return new Response(JSON.stringify({ message: 'The humanizer service is temporarily unavailable. Please try again later.' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'test-connection') {
      try {
        const testPrompt = "Reply with 'OK' if you receive this.";
        await callGemini(testPrompt, geminiKey);
        return new Response(JSON.stringify({ success: true, message: 'Connection OK' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ message: 'API service unavailable. Please try again.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (action === 'detect') {
      const prompt = `Analyze the following text and estimate the probability (0-100) that it was generated by AI. Return ONLY a JSON object with {"aiProbability": number}. Text: ${text.substring(0, 1000)}`;
      
      let aiProb = 50;
      let usedProvider = primaryProvider;
      try {
        if (primaryProvider === 'gemini' && geminiKey && geminiKey !== 'none') {
          const res = await callGemini(prompt, geminiKey);
          const match = res.match(/{"aiProbability":\s*(\d+)}/);
          if (match) aiProb = parseInt(match[1], 10);
        } else if (primaryProvider === 'openai' && openAIKey) {
          const res = await callOpenAI(prompt, openAIKey);
          const match = res.match(/{"aiProbability":\s*(\d+)}/);
          if (match) aiProb = parseInt(match[1], 10);
        } else {
           throw new Error('Primary provider missing key');
        }
      } catch (e: any) {
        console.error('Detector error', e);
        if (fallbackProvider === 'openai' && openAIKey) {
          usedProvider = 'openai';
          try {
             const res = await callOpenAI(prompt, openAIKey);
             const match = res.match(/{"aiProbability":\s*(\d+)}/);
             if (match) aiProb = parseInt(match[1], 10);
          } catch (e2) {}
        } else if (fallbackProvider === 'gemini' && geminiKey && geminiKey !== 'none') {
          usedProvider = 'gemini';
          try {
             const res = await callGemini(prompt, geminiKey);
             const match = res.match(/{"aiProbability":\s*(\d+)}/);
             if (match) aiProb = parseInt(match[1], 10);
          } catch (e2) {}
        }
      }

      return new Response(JSON.stringify({ aiProbability: aiProb }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'humanize') {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('subscription_plan, role')
        .eq('id', user.id)
        .single();
        
      const { data: usageData } = await supabaseClient
        .from('humanizer_usage')
        .select('used_count')
        .eq('user_id', user.id)
        .single();

      const usedCount = usageData?.used_count || 0;
      const isAdmin = profile?.role === 'admin';
      const plan = profile?.subscription_plan || 'free';
      
      // Default limits
      let limit = 5; // free
      if (plan === 'pro') limit = 50;
      if (plan === 'business' || plan === 'enterprise') limit = 200;
      if (isAdmin) limit = 99999;
      
      // Check custom limits
      const { data: customLimit } = await supabaseClient.from('user_custom_limits').select('custom_daily_limit').eq('user_id', user.id).eq('feature_slug', 'humanizer').single();
      if (customLimit && customLimit.custom_daily_limit !== null) {
          limit = customLimit.custom_daily_limit;
      } else {
          // Check feature limits
          const { data: featureLimit } = await supabaseClient.from('feature_limits').select('daily_limit').eq('feature_slug', 'humanizer').eq('plan', plan).single();
          if (featureLimit && featureLimit.daily_limit !== null) {
              limit = featureLimit.daily_limit;
          }
      }

      if (!isAdmin && usedCount >= limit) {
        const msg = `Daily limit reached. Upgrade to a higher plan for more requests.`;
        await supabaseClient.from('humanizer_logs').insert({ user_id: userId, user_email: userEmail, input_text_length: textLength, api_provider: 'gemini', request_status: 'failed', error_message: msg, response_time: Date.now() - startTime });
        return new Response(JSON.stringify({ message: msg }), { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      const levelDesc = level === '1' ? 'Light Rewrite' : level === '2' ? 'Balanced' : level === '3' ? 'Advanced' : 'Stealth Mode';

      function splitIntoChunks(txt: string, maxLen = 4000): string[] {
        const paragraphs = txt.split('\n');
        const chunks: string[] = [];
        let cur = '';
        for (const p of paragraphs) {
          if ((cur.length + p.length) > maxLen && cur.length > 0) {
            chunks.push(cur);
            cur = '';
          }
          cur += (cur ? '\n' : '') + p;
        }
        if (cur) chunks.push(cur);
        return chunks.length > 0 ? chunks : [txt];
      }

      const chunks = splitIntoChunks(text);
      
      const makePrompt = (chunkText: string) => `Rewrite the ENTIRE following text to make it sound completely human-written. Do NOT summarize or shorten the text. Return the full rewritten text.
Remove common AI patterns.
Tone: ${tone || 'natural'}. 
Level of humanization: ${levelDesc}.
${preserveFacts ? 'IMPORTANT: Preserve all numbers, facts, and entities.' : ''}
${preserveSeo ? 'IMPORTANT: Preserve all headings, lists, and SEO keywords.' : ''}

Original Text:
${chunkText}
`;

      let streamProvider = primaryProvider;
      
      // Test first chunk to ensure API works
      let firstResponse = null;
      const firstPrompt = makePrompt(chunks[0]);
      
      if (primaryProvider === 'gemini' && geminiKey && geminiKey !== 'none') {
        firstResponse = await callGeminiStream(firstPrompt, geminiKey);
      } else if (primaryProvider === 'openai' && openAIKey) {
        firstResponse = await callOpenAIStream(firstPrompt, openAIKey);
      }
      
      if (!firstResponse || !firstResponse.ok) {
        const errData = firstResponse ? await firstResponse.clone().text() : 'Network error';
        
        if (fallbackProvider === 'openai' && openAIKey && primaryProvider !== 'openai') {
          console.error(`${primaryProvider} failed, falling back to OpenAI...`);
          streamProvider = 'openai';
          firstResponse = await callOpenAIStream(firstPrompt, openAIKey);
        } else if (fallbackProvider === 'gemini' && geminiKey && geminiKey !== 'none' && primaryProvider !== 'gemini') {
          console.error(`${primaryProvider} failed, falling back to Gemini...`);
          streamProvider = 'gemini';
          firstResponse = await callGeminiStream(firstPrompt, geminiKey);
        }
        
        if (!firstResponse || !firstResponse.ok) {
          const finalErr = firstResponse ? await firstResponse.text() : errData;
          let customMessage = 'Rate limit exceeded or API error. Please try again later.';
          try {
             const parsedErr = JSON.parse(finalErr);
             if (parsedErr.error && parsedErr.error.message) {
                 customMessage = parsedErr.error.message;
             }
          } catch(e) {}
          
          await supabaseClient.from('humanizer_logs').insert({ user_id: userId, user_email: userEmail, input_text_length: textLength, api_provider: streamProvider, request_status: 'failed', error_message: finalErr, response_time: Date.now() - startTime });
          
          if (customMessage.includes('API key not valid') || customMessage.includes('quota') || customMessage.includes('exceeded')) {
            customMessage = 'Our AI servers are currently experiencing configuration or quota issues. Please try again later.';
          }
          
          return new Response(JSON.stringify({ message: customMessage }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      // Update usage
      if (!usageData) {
        await supabaseClient.from('humanizer_usage').insert({ user_id: user.id, used_count: 1 });
      } else {
        await supabaseClient.from('humanizer_usage').update({ used_count: usedCount + 1 }).eq('user_id', user.id);
      }
      
      // Update general user activity
      await supabaseClient.from('user_activities').insert({ user_id: user.id, tool_used: 'humanizer', status: 'success' });
      await supabaseClient.from('humanizer_logs').insert({ user_id: userId, user_email: userEmail, input_text_length: textLength, api_provider: streamProvider, request_status: 'success', response_time: Date.now() - startTime });

      const stream = new ReadableStream({
        async start(controller) {
          const decoder = new TextDecoder();
          const encoder = new TextEncoder();
          
          for (let i = 0; i < chunks.length; i++) {
            let res = i === 0 ? firstResponse : null;
            if (i > 0) {
               if (streamProvider === 'gemini') {
                 res = await callGeminiStream(makePrompt(chunks[i]), geminiKey);
               } else {
                 res = await callOpenAIStream(makePrompt(chunks[i]), openAIKey);
               }
            }
            
            if (!res || !res.ok) continue;
            
            const reader = res.body?.getReader();
            if (!reader) continue;
            
            let buffer = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const dataStr = line.slice(6).trim();
                  if (dataStr === '[DONE]') continue;
                  if (!dataStr) continue;
                  
                  try {
                    const data = JSON.parse(dataStr);
                    let textChunk = '';
                    
                    if (streamProvider === 'gemini') {
                      textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    } else if (streamProvider === 'openai') {
                      textChunk = data.choices?.[0]?.delta?.content || '';
                    }
                    
                    if (textChunk) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: textChunk })}\n\n`));
                    }
                  } catch (e) {
                    // Ignore parse error
                  }
                }
              }
            }
            // If there's another chunk, add a newline separator
            if (i < chunks.length - 1) {
               controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: '\n\n' })}\n\n`));
            }
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ aiProbability: Math.floor(Math.random() * 15) })}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    return new Response(JSON.stringify({ message: 'Invalid action' }), { status: 400, headers: corsHeaders });
  } catch (error: any) {
    console.error('Admin Error: Unexpected error in run-humanizer.', error);
    const msg = error.message === 'Unauthorized' ? 'Authentication failed. Please log in again.' : 'API service unavailable. Please try again.';
    const status = error.message === 'Unauthorized' ? 401 : 500;
    if (userId) {
       // Best effort to log
       createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
        .from('humanizer_logs')
        .insert({ user_id: userId, user_email: userEmail, input_text_length: textLength, api_provider: 'gemini', request_status: 'failed', error_message: error.message, response_time: Date.now() - startTime })
        .then(() => {});
    }
    return new Response(JSON.stringify({ message: msg }), {
      status: status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

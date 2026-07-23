import ky, { type AfterResponseHook } from 'ky';
import { createParser } from 'eventsource-parser';

export interface SSEOptions {
  onData: (data: string) => void;
  onCompleted?: (error?: Error) => void;
  onAborted?: () => void;
}

function createSSEHook(options: SSEOptions): AfterResponseHook {
  return async (request, _opts, response) => {
    if (!response.ok || !response.body) return;

    let done = false;
    const finish = (err?: Error) => {
      if (!done) { done = true; options.onCompleted?.(err); }
    };

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf8');
    const parser = createParser({
      onEvent: (event) => {
        if (!event.data) return;
        for (const chunk of event.data.split('\n')) options.onData(chunk);
      },
    });

    const read = (): void => {
      reader.read().then(({ done: streamDone, value }) => {
        if (streamDone) { finish(); return; }
        parser.feed(decoder.decode(value, { stream: true }));
        read();
      }).catch((err) => {
        if ((request as Request).signal?.aborted) { options.onAborted?.(); return; }
        finish(err as Error);
      });
    };
    read();
    return response;
  };
}

export async function streamLLM(opts: {
  contents: Array<{ role: string; parts: Array<{ text: string }> }>;
  tools?: any[];
  systemInstruction?: any;
  supabaseUrl: string;
  supabaseAnonKey: string;
  onChunk: (text: string) => void;
  onComplete: () => void;
  onError: (err: Error) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const { contents, tools, systemInstruction, supabaseUrl, supabaseAnonKey, onChunk, onComplete, onError, signal } = opts;

  const sseHook = createSSEHook({
    onData: (data) => {
      try {
        const parsed = JSON.parse(data);
        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) onChunk(text);
      } catch { /* incomplete chunk */ }
    },
    onCompleted: (err) => (err ? onError(err) : onComplete()),
    onAborted: () => { /* silently cancelled */ },
  });

  try {
    const payload: any = { contents };
    if (tools) payload.tools = tools;
    if (systemInstruction) payload.systemInstruction = systemInstruction;

    await ky.post(`${supabaseUrl}/functions/v1/large-language-model`, {
      json: payload,
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      timeout: 120_000,
      signal,
      hooks: { afterResponse: [sseHook] },
    });
  } catch (err) {
    if (!signal?.aborted) onError(err as Error);
  }
}

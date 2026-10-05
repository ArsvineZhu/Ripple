import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText } from 'ai';
import defaultAssistantPrompt from '../prompts/default-assistant.md?raw';

export interface CompatibleChatRequest {
  baseUrl: string;
  apiKey: string;
  model: string;
  prompt: string;
  signal?: AbortSignal;
}

interface StreamDependencies {
  fetchImpl?: typeof fetch;
  onDelta(content: string): void;
}

export async function streamCompatibleChat(
  request: CompatibleChatRequest,
  { fetchImpl, onDelta }: StreamDependencies,
): Promise<string> {
  let baseURL: URL;
  try {
    baseURL = new URL(request.baseUrl);
  } catch {
    throw new TypeError('Base URL is invalid');
  }
  if (!['http:', 'https:'].includes(baseURL.protocol)) {
    throw new TypeError('Base URL must use HTTP or HTTPS');
  }
  if (!request.model.trim()) throw new TypeError('Model is required');
  if (!request.apiKey.trim()) throw new TypeError('API key is required');

  const provider = createOpenAICompatible({
    name: 'ripple-next',
    baseURL: request.baseUrl.replace(/\/+$/, ''),
    apiKey: request.apiKey,
    ...(fetchImpl ? { fetch: fetchImpl } : {}),
  });
  let streamError: unknown;
  const result = streamText({
    model: provider(request.model.trim()),
    system: defaultAssistantPrompt.trim(),
    prompt: request.prompt,
    abortSignal: request.signal,
    maxRetries: 0,
    onError({ error }) {
      streamError = error;
    },
  });

  let answer = '';
  for await (const text of result.textStream) {
    answer += text;
    onDelta(text);
  }
  if (streamError) throw streamError;
  return answer;
}

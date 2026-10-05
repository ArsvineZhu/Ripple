import type { AppState } from '../../shared/appState';
import type { AssistantEvent, NoticeCode } from '../../shared/contracts';
import { streamCompatibleChat } from './compatibleChat';
import type { CompatibleChatRequest } from './compatibleChat';

interface StateReader {
  load(): Promise<AppState>;
}

interface SecretReader {
  getApiKey(): Promise<string | null>;
}

type StreamFunction = (
  request: CompatibleChatRequest,
  dependencies: { fetchImpl?: typeof fetch; onDelta(content: string): void },
) => Promise<string>;

export function createAssistantService(
  stateStore: StateReader,
  secretStore: SecretReader,
  stream: StreamFunction = streamCompatibleChat,
) {
  const controllers = new Map<string, AbortController>();

  return {
    cancel(requestId: string) {
      controllers.get(requestId)?.abort();
      controllers.delete(requestId);
    },
    async start(requestId: string, prompt: string, send: (event: AssistantEvent) => void) {
      this.cancel(requestId);
      const controller = new AbortController();
      controllers.set(requestId, controller);
      let apiKey: string | null = null;
      try {
        const [state, storedApiKey] = await Promise.all([
          stateStore.load(),
          secretStore.getApiKey(),
        ]);
        apiKey = storedApiKey;
        if (!apiKey) {
          send({ requestId, kind: 'error', code: 'missingApiKey' });
          return;
        }
        const answer = await stream(
          {
            baseUrl: state.settings.aiBaseUrl,
            apiKey,
            model: state.settings.aiModel,
            prompt,
            signal: controller.signal,
          },
          { onDelta: (content) => send({ requestId, kind: 'delta', content }) },
        );
        if (controller.signal.aborted) return;
        if (!answer) {
          send({ requestId, kind: 'error', code: 'noAiResponse' });
          return;
        }
        send({ requestId, kind: 'done' });
      } catch (error) {
        if (controller.signal.aborted) return;
        const rawDetail = error instanceof Error ? error.message : String(error);
        const detail = (apiKey ? rawDetail.replaceAll(apiKey, '[redacted]') : rawDetail).slice(
          0,
          320,
        );
        const code: NoticeCode =
          detail.includes('Base URL') || detail.includes('Model') || detail.includes('API key')
            ? 'invalidAISettings'
            : 'aiRequestFailed';
        send({ requestId, kind: 'error', code, detail });
      } finally {
        if (controllers.get(requestId) === controller) controllers.delete(requestId);
      }
    },
  };
}

import type { AppState } from '../../shared/appState';
import type { AssistantEvent, NoticeCode } from '../../shared/contracts';
import { resolvePromptTimeContext } from '../prompts/injections';
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

interface AssistantServiceDependencies {
  getAppVersion(): string;
  stream?: StreamFunction;
}

export function createAssistantService(
  stateStore: StateReader,
  secretStore: SecretReader,
  { getAppVersion, stream = streamCompatibleChat }: AssistantServiceDependencies,
) {
  const controllers = new Map<string, AbortController>();

  return {
    cancel(requestId: string) {
      controllers.get(requestId)?.abort();
      controllers.delete(requestId);
    },
    async start(
      requestId: string,
      prompt: string,
      send: (event: AssistantEvent) => void,
    ): Promise<string | null> {
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
          return null;
        }
        const answer = await stream(
          {
            baseUrl: state.settings.aiBaseUrl,
            apiKey,
            model: state.settings.aiModel,
            version: getAppVersion(),
            ...resolvePromptTimeContext(state.settings.timeZone),
            prompt,
            signal: controller.signal,
          },
          { onDelta: (content) => send({ requestId, kind: 'delta', content }) },
        );
        if (controller.signal.aborted) return null;
        if (!answer) {
          send({ requestId, kind: 'error', code: 'noAiResponse' });
          return null;
        }
        send({ requestId, kind: 'done' });
        return answer;
      } catch (error) {
        if (controller.signal.aborted) return null;
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
        return null;
      } finally {
        if (controllers.get(requestId) === controller) controllers.delete(requestId);
      }
    },
  };
}

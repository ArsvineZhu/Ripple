import { describe, expect, it, vi } from 'vitest';
import { defaultAppState } from '../src/shared/appState';
import { createAssistantService } from '../src/main/services/assistant';

describe('assistant service', () => {
  it('reports a missing key without starting a network request', async () => {
    const stream = vi.fn();
    const send = vi.fn();
    const service = createAssistantService(
      { load: async () => defaultAppState },
      { getApiKey: async () => null },
      { getAppVersion: () => '4.0.0-beta.1', stream },
    );

    await service.start('request-1', 'Hello', send);

    expect(stream).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledWith({
      requestId: 'request-1',
      kind: 'error',
      code: 'missingApiKey',
    });
  });

  it('relays deltas and a completion event for a successful request', async () => {
    const state = {
      ...defaultAppState,
      settings: { ...defaultAppState.settings, aiModel: 'test-model' },
    };
    const stream = vi.fn(async (_request, dependencies) => {
      dependencies.onDelta('answer');
      return 'answer';
    });
    const send = vi.fn();
    const service = createAssistantService(
      { load: async () => state },
      { getApiKey: async () => 'test-key' },
      { getAppVersion: () => '4.0.0-beta.1', stream },
    );

    await service.start('request-2', 'Hello', send);

    expect(send.mock.calls.map(([event]) => event)).toEqual([
      { requestId: 'request-2', kind: 'delta', content: 'answer' },
      { requestId: 'request-2', kind: 'done' },
    ]);
  });
});

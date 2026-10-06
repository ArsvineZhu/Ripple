/** @vitest-environment happy-dom */
import { act, createElement, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AssistantEvent } from '../src/shared/contracts';
import { useAssistant } from '../src/renderer/hooks/useAssistant';

const mock = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock('electron-log/renderer', () => ({ default: mock }));
vi.mock('../src/renderer/components/AppStateProvider', () => ({
  useAppState: () => ({
    state: {
      settings: {
        aiBaseUrl: 'https://api.invalid/private',
        aiModel: 'private-model',
      },
    },
  }),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function assistantRequestRecords() {
  return mock.info.mock.calls.flatMap(([value]) => {
    try {
      const event = JSON.parse(String(value)).event;
      return event?.kind === 'assistant-request' ? [event] : [];
    } catch {
      return [];
    }
  });
}

async function mountAssistant(api: {
  onAssistantEvent: (callback: (event: AssistantEvent) => void) => () => void;
  startAssistant: (requestId: string, prompt: string) => Promise<string | null>;
  cancelAssistant: (requestId: string) => Promise<void>;
}) {
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    value: api,
  });
  const assistantRef: { current: ReturnType<typeof useAssistant> | null } = {
    current: null,
  };
  function Harness() {
    const assistant = useAssistant();
    useEffect(() => {
      assistantRef.current = assistant;
    }, [assistant]);
    return null;
  }
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(Harness));
  });
  return {
    current: () => {
      if (!assistantRef.current) throw new Error('Assistant hook did not mount');
      return assistantRef.current;
    },
    async dispose() {
      await act(async () => root.unmount());
      container.remove();
      Reflect.deleteProperty(window, 'electronAPI');
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('assistant request diagnostics', () => {
  it('correlates start, first delta, and completion without prompt or answer text', async () => {
    let listener: ((event: AssistantEvent) => void) | null = null;
    const response = deferred<string | null>();
    const api = {
      onAssistantEvent: vi.fn((callback: (event: AssistantEvent) => void) => {
        listener = callback;
        return () => {
          listener = null;
        };
      }),
      startAssistant: vi.fn((_requestId: string, _prompt: string) => response.promise),
      cancelAssistant: vi.fn().mockResolvedValue(undefined),
    };
    const mounted = await mountAssistant(api);

    await act(async () => mounted.current().setUserText('PRIVATE PROMPT'));
    let pending!: Promise<void>;
    await act(async () => {
      pending = mounted.current().askAI();
      await Promise.resolve();
    });
    const requestId = api.startAssistant.mock.calls[0]![0];
    await act(async () => {
      listener?.({ requestId, kind: 'delta', content: 'PRIVATE ANSWER' });
    });
    response.resolve('PRIVATE ANSWER');
    await act(async () => pending);

    const records = assistantRequestRecords();
    expect(records.map((record) => record.phase)).toEqual(['started', 'first-delta', 'completed']);
    expect(records.every((record) => record.requestId === requestId)).toBe(true);
    expect(records.at(-1)).toMatchObject({
      deltaCount: 1,
      answerCharacters: 14,
    });
    const output = JSON.stringify(mock.info.mock.calls);
    expect(output).not.toContain('PRIVATE PROMPT');
    expect(output).not.toContain('PRIVATE ANSWER');
    await mounted.dispose();
  });

  it('records cancellation once when the assistant view resets', async () => {
    const response = deferred<string | null>();
    const api = {
      onAssistantEvent: vi.fn(() => () => {}),
      startAssistant: vi.fn((_requestId: string, _prompt: string) => response.promise),
      cancelAssistant: vi.fn().mockResolvedValue(undefined),
    };
    const mounted = await mountAssistant(api);
    let pending!: Promise<void>;
    await act(async () => {
      pending = mounted.current().askAI();
      await Promise.resolve();
    });
    const requestId = api.startAssistant.mock.calls[0]![0];
    await act(async () => mounted.current().resetAssistant());
    response.resolve(null);
    await act(async () => pending);

    expect(api.cancelAssistant).toHaveBeenCalledWith(requestId);
    const records = assistantRequestRecords();
    expect(records.map((record) => record.phase)).toEqual(['started', 'cancelled']);
    expect(records.at(-1)).toMatchObject({
      elapsedMs: expect.any(Number),
      deltaCount: 0,
      answerCharacters: 0,
    });
    await mounted.dispose();
  });

  it('records a failed request without logging the provider error message', async () => {
    const api = {
      onAssistantEvent: vi.fn(() => () => {}),
      startAssistant: vi.fn().mockRejectedValue(new Error('PRIVATE PROVIDER RESPONSE')),
      cancelAssistant: vi.fn().mockResolvedValue(undefined),
    };
    const mounted = await mountAssistant(api);
    let pending!: Promise<void>;
    await act(async () => {
      pending = mounted.current().askAI();
      await pending;
    });

    expect(assistantRequestRecords().map((record) => record.phase)).toEqual(['started', 'failed']);
    expect(JSON.stringify([...mock.info.mock.calls, ...mock.error.mock.calls])).not.toContain(
      'PRIVATE PROVIDER RESPONSE',
    );
    await mounted.dispose();
  });

  it('records the service error code without logging its detail', async () => {
    let listener: ((event: AssistantEvent) => void) | null = null;
    const response = deferred<string | null>();
    const api = {
      onAssistantEvent: vi.fn((callback: (event: AssistantEvent) => void) => {
        listener = callback;
        return () => {
          listener = null;
        };
      }),
      startAssistant: vi.fn((_requestId: string, _prompt: string) => response.promise),
      cancelAssistant: vi.fn().mockResolvedValue(undefined),
    };
    const mounted = await mountAssistant(api);
    let pending!: Promise<void>;
    await act(async () => {
      pending = mounted.current().askAI();
      await Promise.resolve();
    });
    const requestId = api.startAssistant.mock.calls[0]![0];
    await act(async () => {
      listener?.({
        requestId,
        kind: 'error',
        code: 'aiRequestFailed',
        detail: 'PRIVATE PROVIDER RESPONSE',
      });
    });
    response.resolve(null);
    await act(async () => pending);

    expect(assistantRequestRecords().at(-1)).toMatchObject({
      phase: 'failed',
      errorCode: 'aiRequestFailed',
    });
    expect(JSON.stringify([...mock.info.mock.calls, ...mock.error.mock.calls])).not.toContain(
      'PRIVATE PROVIDER RESPONSE',
    );
    await mounted.dispose();
  });
});

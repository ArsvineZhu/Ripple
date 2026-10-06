import { describe, expect, it, vi } from 'vitest';
import { streamCompatibleChat } from '../src/main/services/compatibleChat';

describe('OpenAI-compatible chat streaming through AI SDK', () => {
  it('streams text from SSE frames split across network chunks', async () => {
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\r\n\r',
      '\ndata: {"choices":[{"delta":{"content":" world"}}]}\n\ndata: [DO',
      'NE]\n\ndata: {"choices":[{"delta":{},"finish_reason":"stop","index":0}]}\n\n',
    ];
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              chunks.forEach((chunk) => controller.enqueue(new TextEncoder().encode(chunk)));
              controller.close();
            },
          }),
          { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
        ),
    );
    const onDelta = vi.fn();

    const result = await streamCompatibleChat(
      {
        baseUrl: 'https://api.example.test/v1/',
        apiKey: 'secret-test-key',
        model: 'example-model',
        version: '4.0.0-beta.1',
        prompt: 'Say hello',
      },
      { fetchImpl, onDelta },
    );

    expect(result).toBe('Hello world');
    expect(onDelta.mock.calls.map(([content]) => content).join('')).toBe('Hello world');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.example.test/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('rejects invalid endpoint settings before making a request', async () => {
    const fetchImpl = vi.fn();
    await expect(
      streamCompatibleChat(
        {
          baseUrl: 'file:///tmp',
          apiKey: 'secret',
          model: 'model',
          version: '4.0.0-beta.1',
          prompt: 'Hello',
        },
        { fetchImpl, onDelta: vi.fn() },
      ),
    ).rejects.toThrow('Base URL must use HTTP or HTTPS');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

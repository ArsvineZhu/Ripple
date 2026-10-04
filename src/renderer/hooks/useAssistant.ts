import { useState } from 'react';

import { storage } from '../lib/storage';
export function useAssistant() {
  const [asked, setAsked] = useState(false);
  const [aiAnswer, setAIAnswer] = useState<string | null>(null);
  const [userText, setUserText] = useState('');
  const [aiProvider, setAiProvider] = useState(storage.getItem('ai-provider') || 'groq');
  const [aiModel, setAiModel] = useState(storage.getItem('ai-model') || 'llama-3.3-70b-versatile');
  async function askAI() {
    try {
      const apiKey = (storage.getItem('api-key') || '').trim();
      const provider = storage.getItem('ai-provider') || 'groq';
      const model =
        storage.getItem('ai-model') ||
        (provider === 'groq' ? 'llama-3.3-70b-versatile' : 'meta-llama/llama-3.3-70b-instruct');

      if (!apiKey) {
        setAIAnswer('Enter your API key in settings');
        return;
      }

      setAIAnswer('');

      const baseUrl =
        provider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://openrouter.ai/api/v1';

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          ...(provider === 'openrouter' && {
            'HTTP-Referer': 'https://github.com/TopMyster/Ripple',
            'X-Title': 'Ripple',
          }),
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content:
                'You are Ripple, a sleek and helpful desktop AI assistant. Your goal is to provide accurate, concise, and beautifully formatted answers that fit well in a compact desktop widget. \n- For general inquiries: Keep it to 2-4 sentences.\n- For complex or code-related questions: Provide detailed answers with Markdown code blocks, but stay as efficient as possible.\n- Use Markdown for bolding, lists, and headers to make information easy to scan.',
            },
            {
              role: 'user',
              content: userText,
            },
          ],
          temperature: 1,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            if (line.includes('[DONE]')) break;
            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices[0]?.delta?.content || '';
              if (delta) {
                fullText += delta;
                setAIAnswer((prev) => (prev ? prev + delta : delta));
              }
            } catch (e) {
              console.error('Error parsing AI response:', e);
            }
          }
        }
      }

      if (!fullText) {
        setAIAnswer('No response received. Check your settings.');
      }
    } catch (err) {
      setAIAnswer(`Error: ${err instanceof Error ? err.message : String(err)}`);
      console.error('askAI error:', err);
    }
  }
  return {
    asked,
    setAsked,
    aiAnswer,
    setAIAnswer,
    userText,
    setUserText,
    aiProvider,
    setAiProvider,
    aiModel,
    setAiModel,
    askAI,
  };
}

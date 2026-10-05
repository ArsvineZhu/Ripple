import { useCallback, useEffect, useRef, useState } from 'react';
import type { NoticeCode } from '../../shared/contracts';
import { useAppState } from '../components/AppStateProvider';

export function useAssistant() {
  const { state } = useAppState();
  const [assistantError, setAssistantError] = useState<{
    kind: NoticeCode;
    detail?: string;
  } | null>(null);
  const [asked, setAsked] = useState(false);
  const [aiAnswer, setAIAnswer] = useState<string | null>(null);
  const [userText, setUserText] = useState('');
  const requestIdRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = window.electronAPI.onAssistantEvent((event) => {
      if (event.requestId !== requestIdRef.current) return;
      if (event.kind === 'delta') {
        setAIAnswer((current) => `${current || ''}${event.content}`);
      } else if (event.kind === 'error') {
        requestIdRef.current = null;
        setAssistantError({ kind: event.code, detail: event.detail });
      } else {
        requestIdRef.current = null;
      }
    });
    return unsubscribe;
  }, []);

  useEffect(
    () => () => {
      if (requestIdRef.current) void window.electronAPI.cancelAssistant(requestIdRef.current);
    },
    [],
  );

  const askAI = useCallback(async () => {
    if (requestIdRef.current) void window.electronAPI.cancelAssistant(requestIdRef.current);
    const requestId = crypto.randomUUID();
    requestIdRef.current = requestId;
    setAssistantError(null);
    setAIAnswer('');
    setAsked(true);
    try {
      await window.electronAPI.startAssistant(requestId, userText);
    } catch (error) {
      requestIdRef.current = null;
      const detail = error instanceof Error ? error.message : String(error);
      setAssistantError({ kind: 'aiRequestFailed', detail });
    }
  }, [userText]);

  const resetAssistant = useCallback(() => {
    if (requestIdRef.current) void window.electronAPI.cancelAssistant(requestIdRef.current);
    requestIdRef.current = null;
    setAsked(false);
    setAIAnswer(null);
    setUserText('');
    setAssistantError(null);
  }, []);

  return {
    assistantError,
    asked,
    setAsked,
    aiAnswer,
    setAIAnswer,
    userText,
    setUserText,
    aiBaseUrl: state.settings.aiBaseUrl,
    aiModel: state.settings.aiModel,
    askAI,
    resetAssistant,
  };
}

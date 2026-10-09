import { useState, useEffect } from 'react';
import { updateClipboardHistory } from '../lib/clipboard';
import { recordRendererError } from '../lib/diagnostics';

export function useClipboard() {
  const [clipboard, setClipboard] = useState<string[]>([]);
  async function getClipboard() {
    try {
      const text = await window.electronAPI.readClipboardText();
      setClipboard((history) => updateClipboardHistory(history, text));
    } catch (error) {
      recordRendererError('clipboard', error);
    }
  }
  useEffect(() => {
    void getClipboard();
    const timer = setInterval(() => {
      void getClipboard();
    }, 2000);
    window.addEventListener('focus', getClipboard);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', getClipboard);
    };
  }, []);
  function copyToClipboard(text: string) {
    return window.electronAPI.writeClipboardText(text);
  }
  return { clipboard, copyToClipboard };
}

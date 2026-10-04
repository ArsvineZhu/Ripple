import { useState, useEffect } from 'react';
import { updateClipboardHistory } from '../lib/clipboard';

export function useClipboard() {
  const [clipboard, setClipboard] = useState<string[]>([]);
  async function getClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setClipboard((history) => updateClipboardHistory(history, text));
    } catch (error) {
      console.log(`Error reading clipboard: ${String(error)}`);
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
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text);
    }
  }
  return { clipboard, copyToClipboard };
}

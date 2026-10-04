import { useState, useEffect } from 'react';

export function useClipboard() {
  const [clipboard, setClipboard] = useState<string[]>([]);
  async function getClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setClipboard((prevClipboard) => {
        if (prevClipboard[0] === text) {
          return prevClipboard;
        }
        return [text, ...prevClipboard];
      });
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

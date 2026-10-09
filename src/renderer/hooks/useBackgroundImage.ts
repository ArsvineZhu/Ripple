import { useEffect, useState } from 'react';
import { backgroundImageUrl } from '../../shared/backgroundImage';

export function useBackgroundImage(source: string) {
  const url = backgroundImageUrl(source);
  const [result, setResult] = useState<{ url: string; loaded: boolean } | null>(null);
  useEffect(() => {
    if (!url) return;
    const image = new Image();
    let active = true;
    image.onload = () => active && setResult({ url, loaded: true });
    image.onerror = () => active && setResult({ url, loaded: false });
    const timer = setTimeout(() => {
      image.src = url;
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
    };
  }, [url]);
  const current = result?.url === url ? result : null;
  return {
    backgroundImageStyle: current?.loaded ? `url(${JSON.stringify(url)})` : 'none',
    backgroundImageError: current?.loaded === false,
  };
}

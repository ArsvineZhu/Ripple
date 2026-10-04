import { useState } from 'react';

export function useBrowserSearch() {
  const [browserSearch, setBrowserSearch] = useState('');
  function searchBrowser() {
    const trimmedSearch = browserSearch.trim();
    if (!trimmedSearch) return;
    if (trimmedSearch.includes('.')) {
      const hasProtocol = /^https?:\/\//i.test(trimmedSearch);
      const urlToOpen = hasProtocol ? trimmedSearch : `https://${trimmedSearch}`;
      if (window.electronAPI?.openExternal) {
        void window.electronAPI.openExternal(urlToOpen);
      } else {
        window.open(urlToOpen, '_blank');
      }
    } else {
      const encodedQuery = encodeURIComponent(trimmedSearch);
      const url = `https://www.google.com/search?q=${encodedQuery}`;
      if (window.electronAPI?.openExternal) {
        void window.electronAPI.openExternal(url);
      } else {
        window.open(url, '_blank');
      }
    }
  }
  return { browserSearch, setBrowserSearch, searchBrowser };
}

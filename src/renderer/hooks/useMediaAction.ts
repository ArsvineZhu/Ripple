import { useState } from 'react';
import type { NoticeCode } from '../../shared/contracts';
import { recordRendererError } from '../lib/diagnostics';

export function useMediaAction() {
  const [error, setError] = useState<NoticeCode | null>(null);
  async function perform(operation: () => Promise<void>, code: NoticeCode = 'unknownError') {
    setError(null);
    try {
      await operation();
    } catch (failure) {
      recordRendererError('media', failure);
      setError(code);
    }
  }
  return { error, perform };
}

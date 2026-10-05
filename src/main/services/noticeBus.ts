import { randomUUID } from 'node:crypto';
import { noticeAreaForCode } from '../../shared/contracts';
import type { AppNotice, NoticeArea, NoticeCode } from '../../shared/contracts';
import { getMainWindow, showMainWindow } from '../window';

export function createNoticeBus() {
  let rendererReady = false;
  const pending: AppNotice[] = [];

  const deliver = (notice: AppNotice) => {
    const window = getMainWindow();
    if (!rendererReady || !window || window.isDestroyed()) {
      pending.push(notice);
      if (pending.length > 8) pending.shift();
      return;
    }
    window.webContents.send('app-notice', notice);
  };

  return {
    report(
      code: NoticeCode,
      detail?: string,
      severity: AppNotice['severity'] = 'error',
      area: NoticeArea = noticeAreaForCode(code),
    ) {
      deliver({
        id: randomUUID(),
        severity,
        code,
        area,
        ...(detail ? { detail: detail.slice(0, 320) } : {}),
      });
    },
    rendererReady() {
      rendererReady = true;
      showMainWindow();
      const queued = pending.splice(0);
      for (const notice of queued) deliver(notice);
    },
  };
}

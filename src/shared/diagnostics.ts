import { z } from 'zod';
import type { IslandMode, NoticeCode } from './contracts';

const IslandTabIdSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]);
const DimensionsSchema = z
  .object({
    width: z.number().finite().nonnegative(),
    height: z.number().finite().nonnegative(),
  })
  .strict();

export const RendererDiagnosticContextSchema = z
  .object({
    tabId: IslandTabIdSchema,
    mode: z.enum(['still', 'quick', 'large']),
    expanded: z.boolean(),
    asked: z.boolean(),
    answerCharacters: z.number().int().nonnegative(),
    viewport: DimensionsSchema,
    inputRegion: DimensionsSchema,
  })
  .strict();
export const RENDERER_CONTEXT_PREFIX = 'RIPPLE_NEXT_CONTEXT ';

export interface SerializedDiagnosticError {
  type: string;
  frames: string[];
}

export function serializeDiagnosticError(error: unknown): SerializedDiagnosticError {
  const type = error instanceof Error ? error.constructor.name : typeof error;
  const safeType = /^[A-Za-z_$][\w$]{0,63}$/.test(type) ? type : 'Error';
  let stack: string | undefined;
  if (error instanceof Error) {
    try {
      stack = error.stack;
    } catch {
      stack = undefined;
    }
  }

  const frames = typeof stack === 'string' ? stack.split(/\r?\n/).slice(1).filter(Boolean) : [];
  return { type: safeType, frames };
}

export type RendererDiagnosticContext = {
  tabId: number;
  mode: IslandMode;
  expanded: boolean;
  asked: boolean;
  answerCharacters: number;
  viewport: { width: number; height: number };
  inputRegion: { width: number; height: number };
};

export type DiagnosticErrorSource =
  | 'application'
  | 'renderer'
  | 'window'
  | 'linux-input'
  | 'assistant'
  | 'media'
  | 'device'
  | 'clipboard'
  | 'overview'
  | 'diagnostics';

export type DiagnosticEvent =
  | {
      kind: 'app-start';
      appVersion: string;
      electronVersion: string;
      chromiumVersion: string;
      nodeVersion: string;
      platform: string;
      architecture: string;
      osRelease: string;
    }
  | {
      kind: 'window-lifecycle';
      event:
        | 'ready-to-show'
        | 'show'
        | 'hide'
        | 'focus'
        | 'blur'
        | 'unresponsive'
        | 'responsive'
        | 'closed'
        | 'did-fail-load'
        | 'renderer-ready';
      windowId: number;
      webContentsId: number;
      errorCode?: number;
      isMainFrame?: boolean;
    }
  | {
      kind: 'renderer-exit';
      reason: string;
      exitCode: number;
      windowId: number;
      webContentsId: number;
      context?: RendererDiagnosticContext;
    }
  | {
      kind: 'child-process-exit';
      processType: string;
      reason: string;
      exitCode: number;
    }
  | {
      kind: 'main-exception';
      origin: 'uncaughtException' | 'unhandledRejection';
      error: { type: string; frames: string[] };
    }
  | {
      kind: 'linux-input-shape';
      state: 'initialized' | 'ready' | 'failed' | 'updated';
      width?: number;
      height?: number;
    }
  | {
      kind: 'assistant-request';
      requestId: string;
      phase: 'started' | 'first-delta' | 'completed' | 'cancelled' | 'failed';
      errorCode?: NoticeCode;
      elapsedMs?: number;
      firstDeltaMs?: number;
      deltaCount?: number;
      answerCharacters?: number;
    }
  | {
      kind: 'renderer-context';
      context: RendererDiagnosticContext;
    };

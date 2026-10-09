import type { SetStateAction } from 'react';
import type { IslandMode } from '../../shared/contracts';

export function modeReducer(mode: IslandMode, action: SetStateAction<IslandMode>): IslandMode {
  return typeof action === 'function' ? action(mode) : action;
}
export function resolveMode(mode: IslandMode, standby: boolean, largeStandby: boolean): IslandMode {
  return mode !== 'still' ? mode : standby ? 'quick' : largeStandby ? 'large' : 'still';
}

export function enterAlertMode(mode: IslandMode): IslandMode {
  return mode === 'large' ? mode : 'quick';
}

export function leaveAlertMode(mode: IslandMode): IslandMode {
  return mode === 'quick' ? 'still' : mode;
}

import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { defaultAppState } from '../src/shared/appState';
import { createAppStateStore } from '../src/main/services/appStateStore';

const temporaryDirectories: string[] = [];
const openStores: Array<{ close?: () => void }> = [];

async function createTemporaryDirectory() {
  const directory = await mkdtemp(path.join(tmpdir(), 'ripple-next-state-'));
  temporaryDirectories.push(directory);
  return directory;
}

function trackStore<T extends { close?: () => void }>(store: T) {
  openStores.push(store);
  return store;
}

afterEach(async () => {
  for (const store of openStores.splice(0)) store.close?.();
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('Ripple Next app state database', () => {
  it('starts from defaults without importing a legacy JSON state file', async () => {
    const userDataPath = await createTemporaryDirectory();
    const legacyState = {
      ...defaultAppState,
      settings: { ...defaultAppState.settings, weatherLocation: 'Legacy location' },
    };
    await writeFile(path.join(userDataPath, 'app-state.json'), JSON.stringify(legacyState));
    const store = trackStore(createAppStateStore(userDataPath));

    expect(await store.load()).toEqual(defaultAppState);
    expect(existsSync(path.join(userDataPath, 'ripple-next.sqlite'))).toBe(true);
    expect(defaultAppState.quickApps).toEqual([]);
    expect(defaultAppState.settings.backgroundMode).toBe(false);
  });

  it('persists partial state updates after the database is reopened', async () => {
    const userDataPath = await createTemporaryDirectory();
    const store = trackStore(createAppStateStore(userDataPath));
    await store.load();

    await Promise.all([
      store.update({ tasks: ['Review the build'] }),
      store.update({ settings: { weatherLocation: 'Tokyo', backgroundMode: true } }),
      store.update({ workflows: [{ name: 'Work', urls: ['https://example.com'] }] }),
    ]);

    const restored = trackStore(createAppStateStore(userDataPath));
    expect(await restored.load()).toMatchObject({
      tasks: ['Review the build'],
      settings: { weatherLocation: 'Tokyo', backgroundMode: true },
      workflows: [{ name: 'Work', urls: ['https://example.com'] }],
    });
  });

  it('reads background mode from the persisted setting row', async () => {
    const userDataPath = await createTemporaryDirectory();
    const store = trackStore(createAppStateStore(userDataPath));
    await store.load();

    const database = new Database(path.join(userDataPath, 'ripple-next.sqlite'));
    const fixture = await readFile(
      path.join(process.cwd(), 'tests/fixtures/sqlite/enable-background-mode.sql'),
      'utf8',
    );
    database.exec(fixture);

    expect((await store.load()).settings.backgroundMode).toBe(true);
    database.close();
  });

  it('restores Settings visibility from stored state and rejects hiding it in later updates', async () => {
    const userDataPath = await createTemporaryDirectory();
    const store = trackStore(createAppStateStore(userDataPath));
    await store.load();

    const database = new Database(path.join(userDataPath, 'ripple-next.sqlite'));
    database.prepare('UPDATE app_settings SET value = ? WHERE key = ?').run('[7]', 'hiddenTabs');
    database.close();

    expect((await store.load()).settings.hiddenTabs).toEqual([]);

    const repairedDatabase = new Database(path.join(userDataPath, 'ripple-next.sqlite'));
    expect(
      JSON.parse(
        repairedDatabase
          .prepare('SELECT value FROM app_settings WHERE key = ?')
          .pluck()
          .get('hiddenTabs') as string,
      ),
    ).toEqual([]);
    repairedDatabase.close();

    const updated = await store.update({ settings: { hiddenTabs: [7] } });
    expect(updated.settings.hiddenTabs).toEqual([]);
  });

  it('rolls back a settings update when a later quick app write fails', async () => {
    const userDataPath = await createTemporaryDirectory();
    const store = trackStore(createAppStateStore(userDataPath));
    await store.load();

    const database = new Database(path.join(userDataPath, 'ripple-next.sqlite'));
    database.exec(
      await readFile(
        path.join(process.cwd(), 'tests/fixtures/sqlite/reject-quick-app.sql'),
        'utf8',
      ),
    );

    await expect(
      store.update({
        settings: { weatherLocation: 'Must roll back' },
        quickApps: [
          {
            id: 'reject',
            name: 'Reject',
            target: { kind: 'url', url: 'https://example.com' },
          },
        ],
      }),
    ).rejects.toThrow('injected write failure');

    const restored = trackStore(createAppStateStore(userDataPath));
    expect((await restored.load()).settings.weatherLocation).toBe('');
    database.close();
  });
});

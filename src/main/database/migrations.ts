import initialSchema from './migrations/001_initial_schema.sql?raw';
import type Database from 'better-sqlite3';
import { queries } from './queries';

const migrations = [{ version: 1, sql: initialSchema }];

export function migrateDatabase(database: Database.Database) {
  const currentVersion = Number(database.prepare(queries.selectUserVersion).pluck().get() ?? 0);
  const latestVersion = migrations.at(-1)?.version ?? 0;
  if (currentVersion > latestVersion) {
    throw new Error(`Database version ${currentVersion} is newer than this Ripple Next build`);
  }

  for (const migration of migrations) {
    if (migration.version <= currentVersion) continue;
    database.transaction(() => database.exec(migration.sql)).immediate();
  }
}

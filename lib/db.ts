import DatabaseCtor, { Database as BetterSqlite3Database } from "better-sqlite3";
import path from "node:path";

let db: BetterSqlite3Database | null = null;

export function getDB() {
  if (!db) {
    const file = path.join(process.cwd(), "data", "atlas.db");
    db = new DatabaseCtor(file, { fileMustExist: true });
  }
  return db;
}

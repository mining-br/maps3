import Database from "better-sqlite3";
import path from "node:path";

// tipo robusto para a instância, independente das defs do pacote
let db: InstanceType<typeof Database> | null = null;

export function getDB() {
  if (!db) {
    const file = path.join(process.cwd(), "data", "atlas.db");
    db = new Database(file, { fileMustExist: true });
  }
  return db;
}

import fs from "node:fs";
import { parse } from "csv-parse/sync";

export function readCsvSmart(filePath: string){
  const raw = fs.readFileSync(filePath);
  for (const delimiter of [",",";"]) {
    try {
      const records = parse(raw, {
        columns: true,
        skip_empty_lines: true,
        delimiter,
        bom: true,
        trim: true
      });
      if (records?.length && Object.keys(records[0]).length >= 2) return records;
    } catch {}
  }
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true
  });
  return records;
}

// lib/types.ts

export type ScaleKey = "250k" | "100k" | "50k";

export type SheetLink = {
  code?: string;
  title?: string;
  year?: string | number;
  pdf_geologia?: string;
  pdf_recursos?: string;
  pdf_relatorio?: string;
  dados_sig?: string;
  acervo?: string;
};

export type CitySheets = {
  "250k": SheetLink[];
  "100k": SheetLink[];
  "50k": SheetLink[];
};

export type UFMap = Record<string, Record<string, CitySheets>>;

export type DB = {
  byUF: UFMap;
  cities: { uf: string; city: string }[];
};

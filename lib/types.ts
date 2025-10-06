export type SheetCandidate = {
  code: string;
  title?: string;
  uf?: string;
  scale?: "1:250000" | "1:100000" | "1:50000";
};

export type RigeoItem = {
  code?: string;
  title: string;
  uf?: string;
  scale?: string;
  year?: string;
  kind?: "Geologia" | "Recursos Minerais" | "Relatório" | "SIG" | "Documento";
  links?: {
    geologia?: string;
    recursos?: string;
    relatorio?: string;
    sig?: string;
    acervo?: string;
  };
  fallbackSearch?: string;
};

export type SearchResponse = {
  city: string;
  uf: string;
  sheets: SheetCandidate[];
  groups: {
    k250: RigeoItem[];
    k100: RigeoItem[];
    k50: RigeoItem[];
    other: RigeoItem[];
  }
};

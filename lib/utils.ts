// lib/utils.ts

// Remove acentos/diacríticos e baixa para minúsculas
export function norm(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .toLowerCase()
    .trim();
}

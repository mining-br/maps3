// lib/utils.ts

/**
 * Remove acentos/diacríticos e normaliza espaços.
 */
export function stripDiacritics(input: string = ""): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Normaliza texto genérico para comparações:
 * - remove acentos
 * - converte para minúsculas
 * - comprime espaços
 * - trim
 */
export function norm(input: string = ""): string {
  return stripDiacritics(input).toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Normaliza códigos de folha/cartas (ex.: "sc 22 z-a" -> "SC-22-Z-A").
 * Regras:
 * - remove acentos
 * - UPPERCASE
 * - troca "_" por "-"
 * - remove espaços
 * - remove caracteres fora de [A-Z0-9.\-:]
 * Mantemos '.', '-' e ':' porque são comuns nos códigos oficiais.
 */
export function normalizeCode(code: string = ""): string {
  const up = stripDiacritics(code)
    .toUpperCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "");

  // Permite somente A-Z, 0-9, ponto, hífen e dois-pontos
  const cleaned = up.replace(/[^A-Z0-9.\-:]/g, "");

  // Opcional: colapsar hifens múltiplos
  return cleaned.replace(/-+/g, "-");
}

import type { Translations } from './pt';

export type ApiCategory =
  | 'races'
  | 'subraces'
  | 'classes'
  | 'subclasses'
  | 'backgrounds'
  | 'alignments'
  | 'conditions'
  | 'languages'
  | 'schools';

export function translateApiTerm(t: Translations, category: ApiCategory, key: string): string {
  const map = t.apiMappings?.[category];
  if (!map) return key || '—';
  return key && map[key] ? map[key] : key;
}

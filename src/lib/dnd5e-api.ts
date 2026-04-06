const API_BASE = 'https://www.dnd5eapi.co/api';

export type DndApiListItem = {
  index: string;
  name: string;
  url: string;
};

export type DndApiSpellDetail = {
  index: string;
  name: string;
  level: number;
  school: { name: string };
  casting_time: string;
  range: string;
  components: string[];
  material?: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  desc: string[];
  higher_level?: string[];
};

export function classNameToApiIndex(className: string): string {
  return className.trim().toLowerCase().replace(/\s+/g, '-');
}

export async function fetchClassSpells(className: string): Promise<DndApiListItem[]> {
  const index = classNameToApiIndex(className);
  const response = await fetch(`${API_BASE}/classes/${encodeURIComponent(index)}/spells`);
  if (!response.ok) {
    throw new Error(`Failed to load spell list for ${className}`);
  }
  const data = await response.json();
  return data.results as DndApiListItem[];
}

export async function fetchSpellDetails(spellIndex: string): Promise<DndApiSpellDetail> {
  const response = await fetch(`${API_BASE}/spells/${encodeURIComponent(spellIndex)}`);
  if (!response.ok) {
    throw new Error(`Failed to load spell details for ${spellIndex}`);
  }
  return response.json() as Promise<DndApiSpellDetail>;
}

export function normalizeDndSpellDetail(detail: DndApiSpellDetail) {
  const components = detail.components.join(', ') + (detail.material ? ` (${detail.material})` : '');
  const description = [
    detail.desc.join('\n\n'),
    ...(detail.higher_level ?? []),
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    name: detail.name,
    level: detail.level,
    school: detail.school.name,
    castingTime: detail.casting_time,
    range: detail.range,
    components,
    duration: detail.duration,
    description,
    isPrepared: false,
    isFavorite: false,
    isRitual: detail.ritual,
    isConcentration: detail.concentration,
    source: 'srd' as const,
  };
}

import type { Dict } from '../i18n/ui';
import type { Locale } from '../data/sources';

export interface PageData {
  locale: Locale;
  ui: Pick<Dict, 'game' | 'picker' | 'contact' | 'notImage'>;
  privacyUrl: string;
  contactEmail: string;
}

let cache: PageData | null = null;
export function pageData(): PageData {
  if (cache) return cache;
  const el = document.getElementById('page-data');
  cache = JSON.parse(el?.textContent ?? '{}') as PageData;
  return cache;
}

export function joinList(items: string[], and: string): string {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

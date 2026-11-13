import { getLocale, t } from './i18n.svelte.js';

export const GROUPS = [
  { value: 'all', taxonId: null, iconic: null },
  { value: 'mammals', taxonId: 40151, iconic: 'Mammalia' },
  { value: 'birds', taxonId: 3, iconic: 'Aves' },
  { value: 'reptiles', taxonId: 26036, iconic: 'Reptilia' },
  { value: 'amphibians', taxonId: 20978, iconic: 'Amphibia' },
  { value: 'fish', taxonId: 47178, iconic: 'Actinopterygii' },
  { value: 'insects', taxonId: 47158, iconic: 'Insecta' },
  { value: 'arachnids', taxonId: 47119, iconic: 'Arachnida' },
  { value: 'mollusks', taxonId: 47459, iconic: 'Mollusca' },
  { value: 'plants', taxonId: 47126, iconic: 'Plantae' },
  { value: 'fungi', taxonId: 47170, iconic: 'Fungi' },
];

export const RANKS = [
  'all',
  'kingdom',
  'phylum',
  'class',
  'order',
  'family',
  'genus',
  'species',
];

const CONSERVATION_COLORS = {
  EX: '#a78bfa',
  EW: '#c4b5fd',
  CR: '#f87171',
  EN: '#fb923c',
  VU: '#fbbf24',
  NT: '#facc15',
  LC: '#a3e635',
  DD: '#94a3b8',
  NE: '#94a3b8',
};

export function groupLabel(value) {
  if (!value) return t('group.generic');
  return lookup('group', value) ?? lookup('taxonGroup', value) ?? value;
}

function lookup(prefix, value) {
  const key = `${prefix}.${value}`;
  const text = t(key);
  return text === key ? null : text;
}

export function rankLabel(rank) {
  if (!rank) return t('rank.generic');
  return lookup('rank', rank) ?? rank.charAt(0).toUpperCase() + rank.slice(1);
}

export function conservationMeta(code) {
  if (!code) return null;
  const key = String(code).toUpperCase();
  const color = CONSERVATION_COLORS[key];
  if (color) {
    return { code: key, label: t(`conservation.${key}`), short: key, color, known: true };
  }
  return { code: key, label: key, short: key, color: '#94a3b8', known: false };
}

const formatters = new Map();

export function formatNumber(value) {
  const locale = getLocale();
  let formatter = formatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale);
    formatters.set(locale, formatter);
  }
  return formatter.format(value ?? 0);
}

export function wikipediaSearch(name, lang = getLocale()) {
  return `https://${lang}.wikipedia.org/w/index.php?search=${encodeURIComponent(name)}`;
}

const monthFormatters = new Map();

export function monthShort(index) {
  const locale = getLocale();
  let formatter = monthFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { month: 'short' });
    monthFormatters.set(locale, formatter);
  }
  return formatter.format(new Date(2024, index, 15)).replace(/\.$/, '');
}

import { getLocale, t } from './i18n.svelte.js';
import { CATALONIA, PLACES, PROVINCES } from './territory.js';
import { GROUPS } from './utils.js';

const BASE = 'https://api.inaturalist.org/v1';
const TTL = 10 * 60 * 1000;
const MAX_CACHE = 90;

const cache = new Map();

function remember(key, value) {
  cache.set(key, { value, at: Date.now() });
  if (cache.size > MAX_CACHE) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

async function request(path, params = {}, signal) {
  const url = new URL(BASE + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  const key = url.href;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;

  let response;
  try {
    response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error(t('error.connection'));
  }

  if (!response.ok) {
    throw new Error(t('error.http', { status: response.status }));
  }

  const data = await response.json();
  remember(key, data);
  return data;
}

export function normalizeTaxon(taxon) {
  const photo = taxon.default_photo;
  const conservation = taxon.conservation_status?.status ?? null;

  return {
    id: taxon.id,
    name: taxon.name,
    commonName: taxon.preferred_common_name || null,
    rank: taxon.rank,
    group: taxon.iconic_taxon_name || null,
    photo: photo?.medium_url || photo?.small_url || photo?.square_url || null,
    thumb: photo?.square_url || photo?.small_url || photo?.medium_url || null,
    photoAttribution: photo?.attribution || null,
    observations: taxon.observations_count ?? 0,
    conservation,
    extinct: Boolean(taxon.extinct),
  };
}

function photosOf(taxon) {
  const seen = new Set();
  const photos = [];

  const add = (photo) => {
    if (!photo || seen.has(photo.id)) return;
    const medium = photo.medium_url || photo.small_url || photo.square_url;
    if (!medium) return;
    seen.add(photo.id);
    photos.push({
      id: photo.id,
      medium,
      large: photo.large_url || photo.medium_url || medium,
      square: photo.square_url || medium,
      attribution: photo.attribution || '',
      license: photo.license_code || '',
      source: photo.native_page_url || null,
    });
  };

  add(taxon.default_photo);
  for (const entry of taxon.taxon_photos ?? []) add(entry.photo);

  return photos;
}

function htmlToText(html) {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  } catch {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

export function normalizeDetail(taxon) {
  const ancestors = (taxon.ancestors ?? [])
    .filter((ancestor) => ancestor.id !== 48460)
    .map((ancestor) => ({
      id: ancestor.id,
      name: ancestor.name,
      rank: ancestor.rank,
      commonName: ancestor.preferred_common_name || null,
      photo: ancestor.default_photo?.square_url || null,
    }));

  const children = (taxon.children ?? [])
    .map(normalizeTaxon)
    .sort((a, b) => b.observations - a.observations);

  const status = taxon.conservation_status;

  return {
    id: taxon.id,
    name: taxon.name,
    commonName: taxon.preferred_common_name || null,
    rank: taxon.rank,
    group: taxon.iconic_taxon_name || null,
    observations: taxon.observations_count ?? 0,
    extinct: Boolean(taxon.extinct),
    wikipediaUrl: taxon.wikipedia_url || null,
    wikipediaSummary: htmlToText(taxon.wikipedia_summary),
    photos: photosOf(taxon),
    ancestors,
    children,
    conservation: status
      ? {
          code: status.status,
          authority: status.authority || null,
          url: status.url || null,
          taxonId: status.taxon_id ?? null,
          taxonName: status.taxon_name ?? null,
          inherited: status.taxon_id != null && status.taxon_id !== taxon.id,
        }
      : null,
    completeSpeciesCount: taxon.complete_species_count ?? null,
  };
}

/**
 * Search or browse the iNaturalist taxonomy.
 * With a text query we use the autocomplete endpoint (relevance-ranked, no paging).
 * Without a query we browse a taxon group with full paging.
 */
export async function searchTaxa(
  { q = '', group = 'all', rank = 'all', sort = 'obs', page = 1, perPage = 24, taxon = null } = {},
  { signal } = {},
) {
  const groupFilter = GROUPS.find((entry) => entry.value === group);
  const groupTaxonId = groupFilter?.taxonId;
  const taxonId = taxon || groupTaxonId;
  const locale = getLocale();

  if (q.trim()) {
    const data = await request(
      '/taxa/autocomplete',
      {
        q: q.trim(),
        locale,
        per_page: 30,
        taxon_id: taxonId,
        rank: rank === 'all' ? undefined : rank,
      },
      signal,
    );

    return {
      items: (data.results ?? []).map(normalizeTaxon),
      total: data.total_results ?? data.results?.length ?? 0,
      page: 1,
      hasMore: false,
      mode: 'search',
    };
  }

  const data = await request(
    '/taxa',
    {
      locale,
      per_page: perPage,
      page,
      is_active: 'true',
      taxon_id: taxonId,
      rank: rank === 'all' ? undefined : rank,
      order_by: sort === 'recent' ? 'created_at' : 'observations_count',
      order: 'desc',
    },
    signal,
  );

  const items = (data.results ?? []).map(normalizeTaxon);
  const currentPage = data.page ?? page;
  const total = data.total_results ?? items.length;

  return {
    items,
    total,
    page: currentPage,
    hasMore: currentPage * perPage < total,
    mode: 'browse',
  };
}

export async function searchTaxonFilter(q, { signal } = {}) {
  if (!q.trim()) return [];
  const data = await request(
    '/taxa/autocomplete',
    { q: q.trim(), per_page: 8, locale: getLocale() },
    signal,
  );
  return (data.results ?? []).map(normalizeTaxon);
}

export async function getTaxon(id, { signal } = {}) {
  const data = await request(`/taxa/${encodeURIComponent(id)}`, { locale: getLocale() }, signal);
  const taxon = data.results?.[0];
  if (!taxon) throw new Error(t('error.notFound'));
  return normalizeDetail(taxon);
}

function speciesCounts(params, signal) {
  return request(
    '/observations/species_counts',
    { locale: getLocale(), per_page: 12, ...params },
    signal,
  );
}

function placeIdFor(place) {
  return (PLACES[place] ?? PLACES[CATALONIA]).placeId;
}

export async function getCataloniaSummary({ signal } = {}) {
  const placeId = PLACES[CATALONIA].placeId;
  const [observations, species, threatened, introduced] = await Promise.all([
    request('/observations', { place_id: placeId, per_page: 0 }, signal),
    speciesCounts({ place_id: placeId, per_page: 0 }, signal),
    speciesCounts({ place_id: placeId, threatened: true, per_page: 0 }, signal),
    speciesCounts({ place_id: placeId, introduced: true, per_page: 0 }, signal),
  ]);

  return {
    observations: observations.total_results ?? 0,
    species: species.total_results ?? 0,
    threatened: threatened.total_results ?? 0,
    introduced: introduced.total_results ?? 0,
  };
}

export async function getProvinceSummary({ signal } = {}) {
  return Promise.all(
    PROVINCES.map(async (code) => {
      const placeId = PLACES[code].placeId;
      const [observations, species] = await Promise.all([
        request('/observations', { place_id: placeId, per_page: 0 }, signal),
        speciesCounts({ place_id: placeId, per_page: 0 }, signal),
      ]);
      return {
        code,
        placeId,
        observations: observations.total_results ?? 0,
        species: species.total_results ?? 0,
      };
    }),
  );
}

export async function getTerritorySpecies(
  { place = CATALONIA, introduced = false, threatened = false, perPage = 12 } = {},
  { signal } = {},
) {
  const data = await speciesCounts(
    {
      place_id: placeIdFor(place),
      per_page: perPage,
      introduced: introduced || undefined,
      threatened: threatened || undefined,
    },
    signal,
  );

  return (data.results ?? []).map((row) => ({
    ...normalizeTaxon(row.taxon),
    territoryCount: row.count ?? 0,
  }));
}

export async function getTaxonDistribution(taxonId, { signal } = {}) {
  const [total, ...provinces] = await Promise.all([
    request(
      '/observations',
      { place_id: PLACES[CATALONIA].placeId, taxon_id: taxonId, per_page: 0 },
      signal,
    ),
    ...PROVINCES.map((code) =>
      request(
        '/observations',
        { place_id: PLACES[code].placeId, taxon_id: taxonId, per_page: 0 },
        signal,
      ),
    ),
  ]);

  return {
    total: total.total_results ?? 0,
    provinces: PROVINCES.map((code, index) => ({
      code,
      count: provinces[index]?.total_results ?? 0,
    })),
  };
}

export async function getTaxonPhenology(taxonId, { signal } = {}) {
  const data = await request(
    '/observations/histogram',
    {
      taxon_id: taxonId,
      place_id: PLACES[CATALONIA].placeId,
      interval: 'month_of_year',
      date_field: 'observed_on',
      locale: getLocale(),
    },
    signal,
  );

  const raw = data.results?.month_of_year ?? {};
  return Array.from({ length: 12 }, (_, index) => raw[index + 1] ?? raw[String(index + 1)] ?? 0);
}

function observationPoint(observation) {
  const taxon = observation.taxon;
  if (!taxon) return null;

  const [lat, lng] = String(observation.location ?? '')
    .split(',')
    .map(Number);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    ...normalizeTaxon(taxon),
    observationId: observation.id,
    lat,
    lng,
    observedOn: observation.observed_on ?? null,
  };
}

export async function getRecentObservations(
  { place = CATALONIA, taxonId = null, iconicTaxa = null, perPage = 200 } = {},
  { signal } = {},
) {
  const data = await request(
    '/observations',
    {
      place_id: placeIdFor(place),
      taxon_id: taxonId || undefined,
      iconic_taxa: iconicTaxa || undefined,
      per_page: perPage,
      order_by: 'observed_on',
      order: 'desc',
      geo: true,
      quality_grade: 'research',
      locale: getLocale(),
    },
    signal,
  );

  return (data.results ?? []).map(observationPoint).filter(Boolean);
}

export async function getTaxonChildren(parentId, { perPage = 100, signal } = {}) {
  const data = await request(
    '/taxa',
    {
      parent_id: parentId,
      per_page: perPage,
      order_by: 'observations_count',
      order: 'desc',
      locale: getLocale(),
    },
    signal,
  );

  return {
    items: (data.results ?? []).map(normalizeTaxon),
    total: data.total_results ?? 0,
  };
}

export function prefetchTaxon(id) {
  if (!id) return;
  getTaxon(id).catch(() => {});
}

export function getCacheInfo() {
  return {
    size: cache.size,
    max: MAX_CACHE,
    ttl: TTL,
    entries: [...cache.entries()]
      .map(([url, entry]) => ({ url, at: entry.at }))
      .sort((a, b) => b.at - a.at),
  };
}

export function clearCache() {
  cache.clear();
}

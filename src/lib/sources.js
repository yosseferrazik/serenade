export const SOURCES = [
  {
    id: 'inaturalist',
    name: 'iNaturalist',
    url: 'https://www.inaturalist.org',
    roleKey: 'sources.inat.role',
    licenseKey: 'sources.license.variable',
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    url: 'https://www.wikipedia.org',
    roleKey: 'sources.wikipedia.role',
    licenseKey: 'sources.license.ccbysa',
  },
  {
    id: 'gbif',
    name: 'GBIF',
    url: 'https://www.gbif.org',
    roleKey: 'sources.gbif.role',
    licenseKey: 'sources.license.reference',
  },
  {
    id: 'iucn',
    name: 'IUCN Red List',
    url: 'https://www.iucnredlist.org',
    roleKey: 'sources.iucn.role',
    licenseKey: 'sources.license.reference',
  },
  {
    id: 'catalogue',
    name: 'Catalogue of Life',
    url: 'https://www.catalogueoflife.org',
    roleKey: 'sources.col.role',
    licenseKey: 'sources.license.reference',
  },
  {
    id: 'eol',
    name: 'Encyclopedia of Life',
    url: 'https://eol.org',
    roleKey: 'sources.eol.role',
    licenseKey: 'sources.license.reference',
  },
  {
    id: 'bdbc',
    name: 'BDBC',
    url: 'https://mediambient.gencat.cat/ca/05_ambits_dactuacio/patrimoni_natural/sistemes_dinformacio/banc_de_dades_de_biodiversitat',
    roleKey: 'sources.bdbc.role',
    licenseKey: 'sources.license.institutional',
  },
];

export const PIPELINE = [
  { id: 'request', titleKey: 'sources.pipeline.request.title', copyKey: 'sources.pipeline.request.copy' },
  {
    id: 'normalize',
    titleKey: 'sources.pipeline.normalize.title',
    copyKey: 'sources.pipeline.normalize.copy',
  },
  { id: 'cache', titleKey: 'sources.pipeline.cache.title', copyKey: 'sources.pipeline.cache.copy' },
  { id: 'render', titleKey: 'sources.pipeline.render.title', copyKey: 'sources.pipeline.render.copy' },
];

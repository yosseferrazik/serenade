export const catalogState = $state({
  query: '',
  group: 'all',
  rank: 'species',
  sort: 'obs',
  taxon: null,
  applied: null,
  items: [],
  total: 0,
  page: 1,
  loaded: false,
  hasMore: false,
});

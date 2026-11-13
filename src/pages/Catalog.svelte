<script>
  import { onMount, untrack } from 'svelte';
  import { searchTaxa } from '../lib/api.js';
  import { catalogState } from '../lib/store.svelte.js';
  import { i18n, t } from '../lib/i18n.svelte.js';
  import { formatNumber } from '../lib/utils.js';
  import Filters from '../components/Filters.svelte';
  import TaxonCard from '../components/TaxonCard.svelte';
  import Icon from '../components/Icon.svelte';

  let loading = $state(false);
  let loadingMore = $state(false);
  let error = $state('');
  let ready = false;
  let timer;
  let activeRequest;

  async function load({ append = false } = {}) {
    const snapshot = {
      q: catalogState.query.trim(),
      group: catalogState.group,
      rank: catalogState.rank,
      sort: catalogState.sort,
      taxon: catalogState.taxon?.id ?? null,
      page: append ? catalogState.page + 1 : 1,
    };

    const controller = new AbortController();
    activeRequest?.abort();
    activeRequest = controller;
    error = '';
    if (append) loadingMore = true;
    else loading = true;

    try {
      const result = await searchTaxa(snapshot, { signal: controller.signal });

      if (append) {
        const seen = new Set(catalogState.items.map((item) => item.id));
        catalogState.items = [
          ...catalogState.items,
          ...result.items.filter((item) => !seen.has(item.id)),
        ];
        catalogState.page = result.page;
      } else {
        catalogState.items = result.items;
        catalogState.total = result.total;
        catalogState.page = 1;
        catalogState.applied = {
          q: snapshot.q,
          group: snapshot.group,
          rank: snapshot.rank,
          sort: snapshot.sort,
          taxon: snapshot.taxon,
        };
      }

      catalogState.hasMore = result.hasMore;
      catalogState.loaded = true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        error = err.message || t('error.catalog');
      }
    } finally {
      if (activeRequest === controller) {
        loading = false;
        loadingMore = false;
      }
    }
  }

  $effect(() => {
    // Dependencias explícitas: cualquier cambio de filtro reinicia la búsqueda.
    const filters = [
      catalogState.query,
      catalogState.group,
      catalogState.rank,
      catalogState.sort,
      catalogState.taxon,
      i18n.locale,
    ];
    void filters;

    if (!ready) {
      ready = true;
      if (!catalogState.loaded) untrack(() => load());
      return;
    }

    clearTimeout(timer);
    timer = setTimeout(() => untrack(() => load()), 320);
    return () => clearTimeout(timer);
  });

  onMount(() => () => activeRequest?.abort());

  function resetFilters() {
    catalogState.query = '';
    catalogState.group = 'all';
    catalogState.rank = 'species';
    catalogState.sort = 'obs';
    catalogState.taxon = null;
  }

  let shown = $derived(catalogState.items.length);
  let total = $derived(catalogState.total);
  let stale = $derived(
    catalogState.loaded &&
      catalogState.applied &&
      (catalogState.applied.q !== catalogState.query.trim() ||
        catalogState.applied.group !== catalogState.group ||
        catalogState.applied.rank !== catalogState.rank ||
        catalogState.applied.sort !== catalogState.sort ||
        (catalogState.applied.taxon ?? null) !== (catalogState.taxon?.id ?? null)),
  );
  let busy = $derived(loading || stale);
</script>

<main class="catalog shell">
  <section class="hero">
    <p class="eyebrow"><span class="pip"></span> {t('catalog.hero.eyebrow')}</p>
    <h1>
      {t('catalog.hero.line1')}<br />{t('catalog.hero.line2')}<em>{t('catalog.hero.accent')}</em>.
    </h1>
    <p class="lead">{t('catalog.hero.lead')}</p>
    <a class="hero-cta" href="#/territori">
      {t('catalog.hero.territory')}
      <Icon name="arrow-right" size={15} />
    </a>
    <div class="rankline" aria-hidden="true">
      <span>{t('rank.kingdom')}</span><i></i><span>{t('rank.phylum')}</span><i></i><span
        >{t('rank.class')}</span
      ><i></i><span>{t('rank.order')}</span><i></i><span>{t('rank.family')}</span><i></i><span
        >{t('rank.genus')}</span
      ><i></i><span>{t('rank.species')}</span>
    </div>
  </section>

  <Filters {loading} />

  <section class="results" aria-busy={busy}>
    <div class="results-head">
      <div>
        <h2>{catalogState.query.trim() ? t('catalog.results.searchTitle') : t('catalog.results.browseTitle')}</h2>
        <p class="summary" aria-live="polite">
          {#if error}
            {t('catalog.results.error')}
          {:else if busy && shown === 0}
            {t('catalog.results.searching')}
          {:else if busy}
            {t('catalog.results.updating')}
          {:else if total === 0}
            {t('catalog.results.none')}
          {:else if catalogState.query.trim()}
            {t('catalog.results.matches', { shown: formatNumber(shown), total: formatNumber(total) })}
          {:else}
            {t('catalog.results.count', { shown: formatNumber(shown), total: formatNumber(total) })}
          {/if}
        </p>
      </div>

      {#if catalogState.query.trim()}
        <a
          class="external-search"
          href="https://www.inaturalist.org/search?q={encodeURIComponent(catalogState.query.trim())}"
          target="_blank"
          rel="noreferrer"
        >
          {t('catalog.external')}
          <Icon name="arrow-up-right" size={14} />
        </a>
      {/if}
    </div>

    {#if error}
      <div class="alert" role="alert">
        <span class="alert-icon"><Icon name="alert" size={19} /></span>
        <div>
          <strong>{t('catalog.alert.title')}</strong>
          <p>{error}</p>
        </div>
        <button type="button" onclick={() => load()}>
          <Icon name="refresh" size={15} />
          {t('catalog.retry')}
        </button>
      </div>
    {:else if busy && shown === 0}
      <div class="grid" aria-hidden="true">
        {#each Array(8) as _, index}
          <div class="skel-card" style="--i: {index}">
            <div class="skel-media skeleton"></div>
            <div class="skel-body">
              <div class="skeleton line wide"></div>
              <div class="skeleton line short"></div>
              <div class="skeleton line tiny"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if shown === 0}
      <div class="empty">
        <span class="empty-icon"><Icon name="search" size={26} /></span>
        <h3>{t('catalog.empty.title')}</h3>
        <p>{t('catalog.empty.copy')}</p>
        <button type="button" class="empty-action" onclick={resetFilters}>
          {t('catalog.empty.action')}
        </button>
      </div>
    {:else}
      <div class="grid" class:busy={busy}>
        {#each catalogState.items as taxon, index (taxon.id)}
          <TaxonCard {taxon} index={index % 12} />
        {/each}
      </div>

      {#if loadingMore}
        <div class="grid loading-more" aria-hidden="true">
          {#each Array(4) as _}
            <div class="skel-card">
              <div class="skel-media skeleton"></div>
              <div class="skel-body">
                <div class="skeleton line wide"></div>
                <div class="skeleton line short"></div>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <div class="pager">
        {#if catalogState.hasMore}
          <button class="more" type="button" onclick={() => load({ append: true })} disabled={loadingMore}>
            {#if loadingMore}
              <span class="mini-spinner" aria-hidden="true"></span>
              {t('catalog.pager.loading')}
            {:else}
              {t('catalog.pager.more')}
              <Icon name="chevron-down" size={15} />
            {/if}
          </button>
        {:else}
          <p class="end">
            <Icon name="check" size={14} />
            {t('catalog.pager.end')}
          </p>
        {/if}
      </div>
    {/if}
  </section>
</main>

<style>
  .catalog {
    padding-top: clamp(24px, 3vw, 36px);
    padding-bottom: 72px;
  }

  .hero {
    margin-bottom: 24px;
    padding: clamp(24px, 4vw, 44px);
    border: 1px solid var(--border);
    border-top: 4px solid var(--accent);
    border-radius: var(--radius-md);
    background: var(--surface);
    animation: rise 400ms both;
  }

  .hero h1 {
    max-width: 800px;
    margin: 14px 0;
    font-family: var(--font-sans);
    font-size: clamp(2.2rem, 5vw, 3.6rem);
    font-weight: 700;
    line-height: 1.08;
    letter-spacing: -0.7px;
  }

  .hero h1 em {
    color: var(--accent);
    font-style: normal;
    font-weight: 700;
  }

  .lead {
    max-width: 640px;
    color: var(--muted);
    font-size: 1rem;
    line-height: 1.65;
  }

  .hero-cta {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: 20px;
    padding: 10px 16px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-sm);
    color: #ffffff;
    background: var(--accent);
    font-size: 0.84rem;
    font-weight: 600;
    transition:
      background 150ms ease,
      border-color 150ms ease;
  }

  .hero-cta:hover {
    border-color: #333333;
    background: #333333;
  }

  .hero-cta:active {
    border-color: #660000;
    background: #660000;
  }

  .rankline {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-top: 24px;
    color: var(--faint);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    overflow: hidden;
  }

  .rankline i {
    width: 14px;
    height: 1px;
    flex: 0 0 auto;
    background: var(--border);
  }

  .results {
    margin-top: 28px;
  }

  .results-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 18px;
  }

  .results-head h2 {
    padding-left: 12px;
    border-left: 4px solid var(--accent);
    font-family: var(--font-sans);
    font-size: clamp(1.35rem, 2.2vw, 1.7rem);
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.4px;
  }

  .summary {
    margin-top: 5px;
    color: var(--muted);
    font-size: 0.82rem;
    font-variant-numeric: tabular-nums;
  }

  .external-search {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    padding-bottom: 2px;
    color: var(--link);
    font-size: 0.8rem;
    font-weight: 600;
    border-bottom: 1px solid currentColor;
  }

  .external-search:hover {
    color: var(--accent);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(232px, 1fr));
    gap: 16px;
    transition: opacity 200ms ease;
  }

  .grid.busy {
    opacity: 0.5;
    pointer-events: none;
  }

  .skel-card {
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    animation: rise 400ms both;
    animation-delay: calc(var(--i, 0) * 30ms);
  }

  .skel-media {
    aspect-ratio: 4 / 3;
  }

  .skel-body {
    display: flex;
    flex-direction: column;
    gap: 9px;
    padding: 15px 16px;
  }

  .line {
    height: 11px;
    border-radius: 2px;
  }

  .line.wide {
    width: 78%;
  }

  .line.short {
    width: 48%;
  }

  .line.tiny {
    width: 32%;
    height: 9px;
  }

  .loading-more {
    margin-top: 18px;
  }

  .alert {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    border: 1px solid #f5b4b4;
    border-radius: var(--radius-md);
    background: #fbeeed;
    color: #333;
  }

  .alert-icon {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    flex: 0 0 auto;
    border: 1px solid #f5b4b4;
    border-radius: 2px;
    color: #dd0404;
    background: #fff;
  }

  .alert strong {
    color: #900000;
    font-size: 0.9rem;
  }

  .alert p {
    color: #6e6e6e;
    font-size: 0.82rem;
  }

  .alert button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    flex: 0 0 auto;
    padding: 9px 13px;
    border: 1px solid #c00000;
    border-radius: 2px;
    color: #c00000;
    font-size: 0.8rem;
    font-weight: 600;
    background: #fff;
  }

  .alert button:hover {
    border-color: #333;
    color: #333;
    background: #f5f5f5;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 56px 24px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    text-align: center;
    background: var(--surface);
  }

  .empty-icon {
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    margin-bottom: 16px;
    border: 1px solid #d96666;
    border-radius: 2px;
    color: #c00000;
    background: #f2cccc;
  }

  .empty h3 {
    font-family: var(--font-sans);
    font-size: 1.35rem;
    font-weight: 700;
  }

  .empty p {
    max-width: 440px;
    margin: 7px 0 18px;
    color: var(--muted);
    font-size: 0.9rem;
  }

  .empty-action {
    padding: 10px 18px;
    border-radius: 2px;
    color: #fff;
    background: #c00000;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .empty-action:hover {
    background: #333;
  }

  .pager {
    display: flex;
    justify-content: center;
    margin-top: 32px;
  }

  .more {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 20px;
    border: 1px solid var(--accent);
    border-radius: 2px;
    background: var(--surface);
    color: var(--accent);
    font-size: 0.875rem;
    font-weight: 600;
    transition:
      color 150ms ease,
      border-color 150ms ease,
      background 150ms ease;
  }

  .more:hover:not(:disabled) {
    color: var(--text);
    border-color: var(--text);
    background: var(--surface-2);
  }

  .more:disabled {
    cursor: progress;
    opacity: 0.7;
  }

  .mini-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .end {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--faint);
    font-size: 0.78rem;
  }

  @media (max-width: 640px) {
    .results-head {
      align-items: flex-start;
      flex-direction: column;
      gap: 10px;
    }

    .hero {
      padding: 20px;
    }

    .grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
    }

    .skel-body {
      padding: 12px;
    }

    .rankline {
      gap: 7px;
      font-size: 0.6rem;
    }

    .rankline i {
      width: 8px;
    }

    .alert {
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .alert button {
      margin-left: 52px;
    }
  }
</style>

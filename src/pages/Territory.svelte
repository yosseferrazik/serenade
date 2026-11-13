<script>
  import {
    getCataloniaSummary,
    getProvinceSummary,
    getRecentObservations,
    getTerritorySpecies,
  } from '../lib/api.js';
  import { i18n, t } from '../lib/i18n.svelte.js';
  import { BDB_URL, CATALONIA } from '../lib/territory.js';
  import { formatNumber, GROUPS } from '../lib/utils.js';
  import Icon from '../components/Icon.svelte';
  import OccurrenceMap from '../components/OccurrenceMap.svelte';
  import SpeciesRow from '../components/SpeciesRow.svelte';

  let summary = $state(null);
  let provinces = $state([]);
  let threatened = $state([]);
  let introduced = $state([]);
  let overviewLoading = $state(true);
  let summaryError = $state('');
  let selected = $state(CATALONIA);
  let species = $state([]);
  let speciesLoading = $state(true);
  let speciesError = $state('');
  let mapGroup = $state('all');
  let mapPoints = $state([]);
  let mapLoading = $state(true);
  let mapError = $state('');
  let reloadKey = $state(0);

  $effect(() => {
    void i18n.locale;
    void reloadKey;

    const controller = new AbortController();
    const { signal } = controller;

    overviewLoading = true;
    summaryError = '';
    Promise.allSettled([
      getCataloniaSummary({ signal }),
      getProvinceSummary({ signal }),
      getTerritorySpecies({ place: CATALONIA, threatened: true, perPage: 6 }, { signal }),
      getTerritorySpecies({ place: CATALONIA, introduced: true, perPage: 6 }, { signal }),
    ]).then(([overview, provinceRows, threatenedRows, introducedRows]) => {
      if (signal.aborted) return;
      overviewLoading = false;

      if (overview.status === 'fulfilled') summary = overview.value;
      else summaryError = overview.reason?.message || t('territory.error');

      if (provinceRows.status === 'fulfilled') provinces = provinceRows.value;
      if (threatenedRows.status === 'fulfilled') threatened = threatenedRows.value;
      if (introducedRows.status === 'fulfilled') introduced = introducedRows.value;
    });

    return () => controller.abort();
  });

  $effect(() => {
    const place = selected;
    void i18n.locale;
    void reloadKey;

    const controller = new AbortController();
    speciesLoading = true;
    speciesError = '';

    getTerritorySpecies({ place, perPage: 12 }, { signal: controller.signal })
      .then((rows) => {
        if (controller.signal.aborted) return;
        species = rows;
        speciesLoading = false;
      })
      .catch((error) => {
        if (controller.signal.aborted || error.name === 'AbortError') return;
        speciesError = error.message || t('territory.top.error');
        speciesLoading = false;
      });

    return () => controller.abort();
  });

  $effect(() => {
    const place = selected;
    const group = mapGroup;
    void i18n.locale;
    void reloadKey;

    const controller = new AbortController();
    mapLoading = true;
    mapError = '';

    const iconicTaxa = GROUPS.find((entry) => entry.value === group)?.iconic ?? null;

    getRecentObservations(
      { place, iconicTaxa, perPage: 200 },
      { signal: controller.signal },
    )
      .then((rows) => {
        if (controller.signal.aborted) return;
        mapPoints = rows;
        mapLoading = false;
      })
      .catch((error) => {
        if (controller.signal.aborted || error.name === 'AbortError') return;
        mapError = error.message || t('territory.map.error');
        mapLoading = false;
      });

    return () => controller.abort();
  });

  let provinceCards = $derived([
    ...(summary
      ? [
          {
            code: CATALONIA,
            observations: summary.observations,
            species: summary.species,
          },
        ]
      : []),
    ...provinces,
  ]);

  let selectedLabel = $derived(t(`territory.province.${selected}`));
</script>

<main class="territory shell">
  <section class="hero">
    <p class="eyebrow"><span class="pip"></span> {t('territory.eyebrow')}</p>
    <h1>
      {t('territory.title.line1')}<br />{t('territory.title.line2')}<em
        >{t('territory.title.accent')}</em
      >.
    </h1>
    <p class="lead">{t('territory.lead')}</p>
    <a class="hero-link" href={BDB_URL} target="_blank" rel="noreferrer">
      {t('territory.data.bdb')}
      <Icon name="arrow-up-right" size={14} />
    </a>
  </section>

  {#if summaryError && !summary}
    <div class="alert" role="alert">
      <span class="alert-icon"><Icon name="alert" size={19} /></span>
      <div>
        <strong>{t('territory.error.title')}</strong>
        <p>{summaryError}</p>
      </div>
      <button type="button" onclick={() => (reloadKey += 1)}>
        <Icon name="refresh" size={15} />
        {t('territory.retry')}
      </button>
    </div>
  {:else}
    <section class="stats-band" aria-busy={!summary}>
      <div class="stat">
        <strong>{summary ? formatNumber(summary.observations) : '—'}</strong>
        <span>{t('territory.stat.observations')}</span>
      </div>
      <div class="stat">
        <strong>{summary ? formatNumber(summary.species) : '—'}</strong>
        <span>{t('territory.stat.species')}</span>
      </div>
      <div class="stat">
        <strong>{summary ? formatNumber(summary.threatened) : '—'}</strong>
        <span>{t('territory.stat.threatened')}</span>
      </div>
      <div class="stat">
        <strong>{summary ? formatNumber(summary.introduced) : '—'}</strong>
        <span>{t('territory.stat.introduced')}</span>
      </div>
    </section>

    <section class="block">
      <div class="section-title">
        <h2>{t('territory.provinces.title')}</h2>
        <span class="count">{t('territory.provinces.hint')}</span>
      </div>

      <div class="province-grid">
        {#each provinceCards as province (province.code)}
          <button
            type="button"
            class="province-card"
            class:active={selected === province.code}
            aria-pressed={selected === province.code}
            onclick={() => (selected = province.code)}
          >
            <span class="province-name">{t(`territory.province.${province.code}`)}</span>
            <span class="province-data">
              <span>
                <strong>{formatNumber(province.observations)}</strong>
                {t('territory.stat.observations')}
              </span>
              <span>
                <strong>{formatNumber(province.species)}</strong>
                {t('territory.stat.species')}
              </span>
            </span>
          </button>
        {/each}
        {#if overviewLoading && provinces.length === 0}
          {#each Array(5) as _}
            <div class="province-card province-skeleton skeleton" aria-hidden="true"></div>
          {/each}
        {/if}
      </div>
    </section>

    <section class="block">
      <div class="section-title">
        <h2>{t('territory.top.title')}</h2>
        <span class="count">{t('territory.top.in', { place: selectedLabel })}</span>
      </div>

      {#if speciesLoading}
        <div class="list-skeleton" aria-hidden="true">
          {#each Array(6) as _}
            <div class="skeleton row-skeleton"></div>
          {/each}
        </div>
      {:else if speciesError}
        <p class="muted">{speciesError}</p>
      {:else if species.length === 0}
        <p class="muted">{t('territory.top.empty')}</p>
      {:else}
        <div class="species-grid">
          {#each species as taxon (taxon.id)}
            <SpeciesRow {taxon} count={taxon.territoryCount} />
          {/each}
        </div>
      {/if}
    </section>

    <section class="block">
      <div class="section-title">
        <h2>{t('territory.map.title')}</h2>
        <span class="count"
          >{t('territory.map.count', { count: formatNumber(mapPoints.length) })}</span
        >
      </div>
      <p class="block-lead">{t('territory.map.lead', { place: selectedLabel })}</p>

      <div class="map-toolbar">
        <label class="map-field">
          <span>{t('territory.map.group')}</span>
          <select bind:value={mapGroup}>
            {#each GROUPS as group}
              <option value={group.value}>{t(`group.${group.value}`)}</option>
            {/each}
          </select>
        </label>
        <span class="map-hint">{t('territory.map.hint')}</span>
      </div>

      {#if mapLoading}
        <div class="map-skeleton skeleton" aria-hidden="true"></div>
      {:else if mapError}
        <p class="muted">{mapError}</p>
      {:else}
        <OccurrenceMap
          points={mapPoints}
          label={t('territory.map.aria', { place: selectedLabel })}
          legend
          emptyLabel={t('territory.map.empty')}
        />
      {/if}
    </section>

    <div class="two-col">
      <section class="block panel">
        <div class="section-title">
          <h2>{t('territory.threatened.title')}</h2>
          <span class="count">{t('territory.threatened.count')}</span>
        </div>
        <p class="block-lead">{t('territory.threatened.lead')}</p>
        {#if overviewLoading}
          <div class="list-skeleton" aria-hidden="true">
            {#each Array(3) as _}
              <div class="skeleton row-skeleton"></div>
            {/each}
          </div>
        {:else if threatened.length === 0}
          <p class="muted">{t('territory.top.empty')}</p>
        {:else}
          {#each threatened as taxon (taxon.id)}
            <SpeciesRow {taxon} count={taxon.territoryCount} />
          {/each}
        {/if}
      </section>

      <section class="block panel">
        <div class="section-title">
          <h2>{t('territory.introduced.title')}</h2>
          <span class="count">{t('territory.introduced.count')}</span>
        </div>
        <p class="block-lead">{t('territory.introduced.lead')}</p>
        {#if overviewLoading}
          <div class="list-skeleton" aria-hidden="true">
            {#each Array(3) as _}
              <div class="skeleton row-skeleton"></div>
            {/each}
          </div>
        {:else if introduced.length === 0}
          <p class="muted">{t('territory.top.empty')}</p>
        {:else}
          {#each introduced as taxon (taxon.id)}
            <SpeciesRow {taxon} count={taxon.territoryCount} />
          {/each}
        {/if}
      </section>
    </div>

    <section class="data-note">
      <h2>{t('territory.data.title')}</h2>
      <p>
        {t('territory.data.note')}
        <a href={BDB_URL} target="_blank" rel="noreferrer">{t('territory.data.bdb')}</a>,
        <a href="#/fonts">{t('territory.data.sources')}</a>.
      </p>
    </section>
  {/if}
</main>

<style>
  .territory {
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
  }

  .hero h1 {
    max-width: 820px;
    margin: 14px 0;
    font-size: clamp(2.2rem, 5vw, 3.6rem);
    font-weight: 700;
    letter-spacing: -0.7px;
    line-height: 1.08;
  }

  .hero h1 em {
    color: var(--accent);
    font-style: normal;
  }

  .lead {
    max-width: 660px;
    color: var(--muted);
    font-size: 1rem;
    line-height: 1.65;
  }

  .hero-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 18px;
    color: var(--link);
    font-size: 0.82rem;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .hero-link:hover {
    color: var(--accent);
  }

  .stats-band {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    margin-bottom: 26px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 20px 22px;
    border-right: 1px solid var(--border);
  }

  .stat:last-child {
    border-right: 0;
  }

  .stat strong {
    font-size: clamp(1.5rem, 2.6vw, 2.1rem);
    font-weight: 700;
    letter-spacing: -0.6px;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }

  .stat span {
    color: var(--muted);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .block {
    margin-top: 28px;
  }

  .panel {
    margin-top: 0;
    padding: 20px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .block .section-title {
    margin-bottom: 14px;
  }

  .block .section-title h2 {
    padding-left: 12px;
    border-left: 4px solid var(--accent);
    font-size: clamp(1.3rem, 2.1vw, 1.6rem);
    letter-spacing: -0.4px;
  }

  .block-lead {
    margin: -4px 0 10px;
    color: var(--muted);
    font-size: 0.8rem;
    line-height: 1.5;
  }

  .province-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 12px;
  }

  .province-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 86px;
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-top: 3px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    text-align: left;
    transition:
      border-color 150ms ease,
      background 150ms ease;
  }

  .province-card:hover {
    border-color: var(--border-strong);
    background: var(--surface-2);
  }

  .province-card.active {
    border-color: var(--accent);
    border-top-color: var(--accent);
    background: var(--accent-soft);
  }

  .province-card.province-skeleton {
    background: var(--surface-3);
  }

  .province-name {
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: -0.2px;
  }

  .province-data {
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: var(--muted);
    font-size: 0.7rem;
  }

  .province-data strong {
    margin-right: 4px;
    color: var(--text-soft);
    font-size: 0.82rem;
    font-variant-numeric: tabular-nums;
  }

  .species-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
    gap: 0 22px;
    padding: 4px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .two-col {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
    margin-top: 28px;
  }

  .data-note {
    margin-top: 28px;
    padding: 18px 20px;
    border: 1px solid var(--border);
    border-left: 4px solid var(--accent);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .data-note h2 {
    font-size: 1rem;
    font-weight: 700;
  }

  .data-note p {
    max-width: 820px;
    margin-top: 5px;
    color: var(--muted);
    font-size: 0.82rem;
    line-height: 1.6;
  }

  .data-note a {
    color: var(--link);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .muted {
    color: var(--muted);
    font-size: 0.85rem;
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

  .list-skeleton {
    padding: 8px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .row-skeleton {
    height: 40px;
    margin: 8px 0;
    border-radius: 2px;
  }

  .map-toolbar {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .map-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .map-field span {
    color: var(--text-soft);
    font-size: 0.7rem;
    font-weight: 600;
  }

  .map-field select {
    height: 40px;
    min-width: 180px;
    padding: 0 10px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text);
    font-size: 0.82rem;
  }

  .map-hint {
    color: var(--faint);
    font-size: 0.72rem;
  }

  .map-skeleton {
    height: 380px;
    border-radius: var(--radius-md);
  }

  @media (max-width: 900px) {
    .stats-band {
      grid-template-columns: repeat(2, 1fr);
    }

    .stat:nth-child(2) {
      border-right: 0;
    }

    .stat:nth-child(-n + 2) {
      border-bottom: 1px solid var(--border);
    }

    .two-col {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .hero {
      padding: 20px;
    }

    .block .section-title {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }

    .block .section-title h2 {
      font-size: 1.25rem;
    }

    .stats-band {
      grid-template-columns: 1fr 1fr;
    }

    .stat {
      padding: 14px;
    }

    .species-grid {
      grid-template-columns: 1fr;
      padding: 4px 12px;
    }

    .map-skeleton {
      height: 280px;
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

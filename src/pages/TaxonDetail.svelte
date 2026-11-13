<script>
  import { getTaxon, getTaxonDistribution, getTaxonPhenology, getRecentObservations } from '../lib/api.js';
  import { i18n, t } from '../lib/i18n.svelte.js';
  import {
    conservationMeta,
    formatNumber,
    groupLabel,
    monthShort,
    rankLabel,
    wikipediaSearch,
  } from '../lib/utils.js';
  import Icon from '../components/Icon.svelte';
  import OccurrenceMap from '../components/OccurrenceMap.svelte';

  let { id } = $props();

  let taxon = $state(null);
  let loading = $state(true);
  let error = $state('');
  let activePhoto = $state(0);
  let reloadKey = $state(0);
  let distribution = $state(null);
  let phenology = $state([]);
  let distributionLoading = $state(false);
  let distributionError = $state('');
  let mapPoints = $state([]);
  let mapLoading = $state(false);
  let mapError = $state('');

  function buildTaxonomy(t) {
    const order = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'];
    const nodes = new Map();

    for (const ancestor of t.ancestors) {
      if (!nodes.has(ancestor.rank)) nodes.set(ancestor.rank, ancestor);
    }
    nodes.set(t.rank, { id: t.id, name: t.name, rank: t.rank });

    return order
      .filter((rank) => nodes.has(rank))
      .map((rank) => {
        const node = nodes.get(rank);
        return { ...node, rank, rankLabel: rankLabel(rank) };
      });
  }

  function licenseLabel(code) {
    if (!code) return t('detail.license.reserved');
    if (code === 'cc0') return t('detail.license.cc0');
    return code.toUpperCase().replace('CC-', 'CC ');
  }

  function licenseUrl(code) {
    if (!code) return null;
    if (code === 'cc0') return 'https://creativecommons.org/publicdomain/zero/1.0/';
    return `https://creativecommons.org/licenses/${code.replace(/^cc-/, '')}/4.0/`;
  }

  $effect(() => {
    const currentId = id;
    void reloadKey;
    void i18n.locale;

    const controller = new AbortController();
    taxon = null;
    activePhoto = 0;
    loading = true;
    error = '';
    document.title = t('detail.title.loading');

    getTaxon(currentId, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        taxon = data;
        loading = false;
        document.title = data.commonName
          ? t('detail.title.withCommon', { name: data.name, common: data.commonName })
          : t('detail.title.plain', { name: data.name });
      })
      .catch((err) => {
        if (controller.signal.aborted || err.name === 'AbortError') return;
        error = err.message || t('error.notFound');
        loading = false;
        document.title = t('detail.title.error');
      });

    return () => controller.abort();
  });

  $effect(() => () => {
    document.title = t('app.title');
  });

  $effect(() => {
    const taxonId = taxon?.id;
    void i18n.locale;

    if (!taxonId) {
      distribution = null;
      phenology = [];
      distributionLoading = false;
      return;
    }

    const controller = new AbortController();
    distributionLoading = true;
    distributionError = '';

    Promise.all([
      getTaxonDistribution(taxonId, { signal: controller.signal }),
      getTaxonPhenology(taxonId, { signal: controller.signal }),
    ])
      .then(([territory, months]) => {
        if (controller.signal.aborted) return;
        distribution = territory;
        phenology = months;
        distributionLoading = false;
      })
      .catch((error) => {
        if (controller.signal.aborted || error.name === 'AbortError') return;
        distributionError = error.message || t('detail.territory.error');
        distributionLoading = false;
      });

    return () => controller.abort();
  });

  let distributionMax = $derived(
    distribution ? Math.max(1, ...distribution.provinces.map((province) => province.count)) : 1,
  );
  let phenologyMax = $derived(phenology.length ? Math.max(1, ...phenology) : 1);

  $effect(() => {
    const taxonId = taxon?.id;
    void i18n.locale;

    if (!taxonId) {
      mapPoints = [];
      mapLoading = false;
      return;
    }

    const controller = new AbortController();
    mapLoading = true;
    mapError = '';

    getRecentObservations({ taxonId, perPage: 200 }, { signal: controller.signal })
      .then((rows) => {
        if (controller.signal.aborted) return;
        mapPoints = rows;
        mapLoading = false;
      })
      .catch((error) => {
        if (controller.signal.aborted || error.name === 'AbortError') return;
        mapError = error.message || t('detail.map.error');
        mapLoading = false;
      });

    return () => controller.abort();
  });

  let photos = $derived(taxon?.photos ?? []);
  let mainPhoto = $derived(photos[activePhoto] ?? photos[0] ?? null);
  let cons = $derived(
    taxon?.conservation ? conservationMeta(taxon.conservation.code) : null,
  );
  let taxonomy = $derived(taxon ? buildTaxonomy(taxon) : []);
  let lineage = $derived(
    taxon ? [...taxon.ancestors, { id: taxon.id, name: taxon.name }] : [],
  );

  let references = $derived(
    taxon
      ? [
          {
            label: 'iNaturalist',
            desc: t('detail.ref.inatDesc'),
            href: `https://www.inaturalist.org/taxa/${taxon.id}`,
            icon: 'globe',
          },
          {
            label: 'Wikipedia',
            desc: t('detail.ref.wikipediaDesc'),
            href: taxon.wikipediaUrl || wikipediaSearch(taxon.name),
            icon: 'book',
          },
          {
            label: 'GBIF',
            desc: t('detail.ref.gbifDesc'),
            href: `https://www.gbif.org/species/search?q=${encodeURIComponent(taxon.name)}`,
            icon: 'database',
          },
          {
            label: 'Catalogue of Life',
            desc: t('detail.ref.colDesc'),
            href: `https://www.catalogueoflife.org/data/search?q=${encodeURIComponent(taxon.name)}`,
            icon: 'database',
          },
          {
            label: 'Encyclopedia of Life',
            desc: t('detail.ref.eolDesc'),
            href: `https://eol.org/search?q=${encodeURIComponent(taxon.name)}`,
            icon: 'globe',
          },
          {
            label: 'IUCN Red List',
            desc: cons ? t('detail.ref.iucnDescKnown') : t('detail.ref.iucnDesc'),
            href:
              taxon.conservation?.url ||
              `https://www.iucnredlist.org/search?query=${encodeURIComponent(taxon.name)}`,
            icon: 'alert',
          },
        ]
      : [],
  );
</script>

{#if loading}
  <main class="detail shell">
    <div class="crumb-skeleton skeleton"></div>
    <div class="hero">
      <div class="stage skeleton"></div>
      <div class="intro">
        <div class="skeleton tagline"></div>
        <div class="skeleton title"></div>
        <div class="skeleton subtitle"></div>
        <div class="skeleton paragraph"></div>
        <div class="skeleton paragraph short"></div>
      </div>
    </div>
  </main>
{:else if error}
  <main class="detail shell">
    <div class="error-card">
      <span class="error-icon"><Icon name="alert" size={26} /></span>
      <p class="eyebrow">{t('detail.error.eyebrow')}</p>
      <h1>{t('detail.error.title')}</h1>
      <p class="error-copy">{error}</p>
      <div class="error-actions">
        <a class="primary" href="#/">{t('detail.back')}</a>
        <button class="ghost" type="button" onclick={() => (reloadKey += 1)}>
          <Icon name="refresh" size={15} />
          {t('detail.retry')}
        </button>
      </div>
    </div>
  </main>
{:else if taxon}
  <main class="detail shell">
    <a class="back" href="#/">
      <Icon name="arrow-left" size={16} />
      {t('detail.back')}
    </a>

    <nav class="crumbs" aria-label={t('detail.crumbsAria')}>
      {#each lineage as node, index (node.id)}
        {#if index > 0}<Icon name="chevron-right" size={11} />{/if}
        {#if node.id === taxon.id}
          <span aria-current="page">{node.name}</span>
        {:else}
          <a href="#/taxon/{node.id}">{node.name}</a>
        {/if}
      {/each}
    </nav>

    <section class="hero">
      <div class="gallery">
        <div class="stage">
          {#if mainPhoto}
            <img
              src={mainPhoto.large}
              alt={taxon.name}
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />
            <div class="credit">
              <span>{mainPhoto.attribution}</span>
              {#if mainPhoto.license}
                {#if licenseUrl(mainPhoto.license)}
                  <a href={licenseUrl(mainPhoto.license)} target="_blank" rel="noreferrer">
                    {licenseLabel(mainPhoto.license)}
                  </a>
                {:else}
                  <span>{licenseLabel(mainPhoto.license)}</span>
                {/if}
              {/if}
            </div>
          {:else}
            <div class="stage-placeholder" aria-hidden="true">
              <span class="initial">{taxon.name.charAt(0)}</span>
              <Icon name="leaf" size={42} />
            </div>
          {/if}
        </div>

        {#if photos.length > 1}
          <div class="thumbs" role="group" aria-label={t('detail.galleryAria')}>
            {#each photos.slice(0, 8) as photo, index (photo.id)}
              <button
                type="button"
                class:active={activePhoto === index}
                onclick={() => (activePhoto = index)}
                aria-label={t('detail.thumbAria', { index: index + 1, name: taxon.name })}
                title={photo.attribution}
              >
                <img src={photo.square} alt="" loading="lazy" decoding="async" />
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="intro">
        <div class="tags">
          <span class="tag rank">{rankLabel(taxon.rank)}</span>
          <span class="tag group">{groupLabel(taxon.group)}</span>
          {#if cons}
            <span
              class="tag cons"
              style="--c: {cons.color}"
              title={taxon.conservation?.inherited
                ? t('detail.consInherited', { name: taxon.conservation.taxonName })
                : taxon.conservation?.authority
                  ? t('detail.consTitleAuthority', {
                      label: cons.label,
                      authority: taxon.conservation.authority,
                    })
                  : t('detail.consTitle', { label: cons.label })}
            >
              <span class="dot"></span>
              {#if cons.known}{cons.short} · {cons.label}{:else}{cons.short}{/if}
            </span>
          {/if}
          {#if taxon.extinct}<span class="tag extinct">{t('common.extinct')}</span>{/if}
        </div>

        <h1 class="sci">{taxon.name}</h1>
        {#if taxon.commonName}
          <p class="common">{taxon.commonName}</p>
        {:else}
          <p class="common muted">{t('common.noCommonName')}</p>
        {/if}

        <div class="stats">
          <div>
            <strong>{formatNumber(taxon.observations)}</strong>
            <span>{t('detail.stats.observations')}</span>
          </div>
          <div>
            <strong>{formatNumber(taxon.children.length)}</strong>
            <span>{t('detail.stats.children')}</span>
          </div>
          <div>
            <strong>{rankLabel(taxon.rank)}</strong>
            <span>{t('detail.stats.rank')}</span>
          </div>
        </div>

        <div class="actions">
          <a
            class="primary"
            href="https://www.inaturalist.org/taxa/{taxon.id}"
            target="_blank"
            rel="noreferrer"
          >
            {t('detail.actions.inaturalist')}
            <Icon name="arrow-up-right" size={15} />
          </a>
          <a
            class="ghost"
            href={taxon.wikipediaUrl || wikipediaSearch(taxon.name)}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="book" size={15} />
            Wikipedia
          </a>
        </div>
      </div>
    </section>

    <div class="columns">
      <div class="main">
        {#if taxon.wikipediaSummary}
          <section class="panel">
            <div class="section-title">
              <h2>{t('detail.section.summary')}</h2>
              <a
                class="section-link"
                href={taxon.wikipediaUrl || wikipediaSearch(taxon.name)}
                target="_blank"
                rel="noreferrer"
              >
                {t('detail.section.readWikipedia')}
                <Icon name="arrow-up-right" size={13} />
              </a>
            </div>
            <p class="prose">{taxon.wikipediaSummary}</p>
          </section>
        {/if}

        <section class="panel">
          <div class="section-title">
            <h2>{t('detail.territory.title')}</h2>
            {#if distribution}
              <span class="count"
                >{t('detail.territory.total', {
                  count: formatNumber(distribution.total),
                })}</span
              >
            {/if}
          </div>

          {#if distributionLoading}
            <div class="territory-skeleton skeleton" aria-hidden="true"></div>
          {:else if distributionError}
            <p class="muted">{distributionError}</p>
          {:else if distribution}
            {#if distribution.total === 0}
              <p class="muted">{t('detail.territory.empty')}</p>
            {:else}
              <div class="province-bars">
                {#each distribution.provinces as province (province.code)}
                  <div class="province-row">
                    <span class="province-label">{t(`territory.province.${province.code}`)}</span>
                    <span class="province-track">
                      <span
                        class="province-fill"
                        style="width: {(province.count / distributionMax) * 100}%"
                      ></span>
                    </span>
                    <strong>{formatNumber(province.count)}</strong>
                  </div>
                {/each}
              </div>

              <h3 class="chart-title">{t('detail.territory.phenology')}</h3>
              <div
                class="phenology"
                role="img"
                aria-label={t('detail.territory.chartAria')}
              >
                {#each phenology as count, index}
                  <div
                    class="month"
                    title={t('detail.territory.monthAria', {
                      month: monthShort(index),
                      count: formatNumber(count),
                    })}
                  >
                    <span class="bar-area">
                      <span
                        class="month-bar"
                        style="height: {Math.max(2, (count / phenologyMax) * 100)}%"
                      ></span>
                    </span>
                    <span class="month-label">{monthShort(index)}</span>
                  </div>
                {/each}
              </div>

              <p class="territory-note">{t('detail.territory.note')}</p>

              <h3 class="chart-title">{t('detail.map.title')}</h3>
              {#if mapLoading}
                <div class="map-skeleton skeleton" aria-hidden="true"></div>
              {:else if mapError}
                <p class="muted">{mapError}</p>
              {:else}
                <OccurrenceMap
                  points={mapPoints}
                  label={t('detail.map.aria', { name: taxon.name })}
                  emptyLabel={t('detail.map.empty')}
                />
              {/if}
            {/if}
          {:else}
            <p class="muted">{t('detail.territory.error')}</p>
          {/if}
        </section>

        <section class="panel">
          <div class="section-title">
            <h2>{t('detail.section.inside', { name: taxon.name })}</h2>
            <span class="count"
              >{t('detail.section.childrenCount', {
                count: formatNumber(taxon.children.length),
              })}</span
            >
          </div>

          {#if taxon.children.length > 0}
            <div class="children">
              {#each taxon.children.slice(0, 12) as child (child.id)}
                <a class="child" href="#/taxon/{child.id}">
                  <span class="child-media">
                    {#if child.thumb}
                      <img src={child.thumb} alt="" loading="lazy" decoding="async" />
                    {:else}
                      <Icon name="leaf" size={19} />
                    {/if}
                  </span>
                  <span class="child-copy">
                    <span class="child-rank">{rankLabel(child.rank)}</span>
                    <strong>{child.name}</strong>
                    {#if child.commonName}<small>{child.commonName}</small>{/if}
                  </span>
                  <Icon name="chevron-right" size={15} />
                </a>
              {/each}
            </div>

            {#if taxon.children.length > 12}
              <a
                class="see-all"
                href="https://www.inaturalist.org/taxa/{taxon.id}"
                target="_blank"
                rel="noreferrer"
              >
                {t('detail.section.seeAll', {
                  count: formatNumber(taxon.children.length),
                })}
                <Icon name="arrow-up-right" size={14} />
              </a>
            {/if}
          {:else}
            <p class="muted">{t('detail.section.noChildren')}</p>
          {/if}
        </section>

        {#if photos.length > 1}
          <section class="panel">
            <div class="section-title">
              <h2>{t('detail.section.gallery')}</h2>
              <span class="count"
                >{t('detail.section.images', { count: formatNumber(photos.length) })}</span
              >
            </div>
            <div class="photo-grid">
              {#each photos.slice(0, 6) as photo, index (photo.id)}
                <a
                  class="photo"
                  href={photo.source || photo.large}
                  target="_blank"
                  rel="noreferrer"
                  title={photo.attribution}
                >
                  <img
                    src={photo.medium}
                    alt={t('detail.photoAlt', { index: index + 1, name: taxon.name })}
                    loading="lazy"
                    decoding="async"
                  />
                  <span class="photo-credit">{photo.attribution}</span>
                </a>
              {/each}
            </div>
          </section>
        {/if}
      </div>

      <aside class="side">
        <section class="panel facts">
          <div class="section-title">
            <h2>{t('detail.facts.title')}</h2>
          </div>
          <dl>
            <div class="fact">
              <dt>{t('detail.fact.scientificName')}</dt>
              <dd class="sci-inline">{taxon.name}</dd>
            </div>
            {#each taxonomy as row (row.rank)}
              <div class="fact">
                <dt>{row.rankLabel}</dt>
                <dd>
                  {#if row.id === taxon.id}
                    <span>{row.name}</span>
                  {:else}
                    <a href="#/taxon/{row.id}">{row.name}</a>
                  {/if}
                </dd>
              </div>
            {/each}
            <div class="fact">
              <dt>{t('detail.fact.group')}</dt>
              <dd>{groupLabel(taxon.group)}</dd>
            </div>
            <div class="fact">
              <dt>{t('detail.fact.observations')}</dt>
              <dd>{formatNumber(taxon.observations)}</dd>
            </div>
            <div class="fact">
              <dt>{t('detail.fact.children')}</dt>
              <dd>{formatNumber(taxon.children.length)}</dd>
            </div>
            {#if cons}
              <div class="fact">
                <dt>{t('detail.fact.iucn')}</dt>
                <dd>
                  <span class="mini-cons" style="--c: {cons.color}">
                    <span class="dot"></span>
                    {#if cons.known}{cons.short} · {cons.label}{:else}{cons.short}{/if}
                  </span>
                  {#if !cons.known && taxon.conservation?.authority}
                    <small class="inherited">{taxon.conservation.authority}</small>
                  {/if}
                  {#if taxon.conservation?.inherited}
                    <small class="inherited"
                      >{t('detail.fact.inheritedFrom', {
                        name: taxon.conservation.taxonName,
                      })}</small
                    >
                  {/if}
                </dd>
              </div>
            {/if}
            <div class="fact">
              <dt>{t('detail.fact.extinct')}</dt>
              <dd>{taxon.extinct ? t('detail.fact.yes') : t('detail.fact.no')}</dd>
            </div>
            <div class="fact">
              <dt>{t('detail.fact.id')}</dt>
              <dd>{taxon.id}</dd>
            </div>
          </dl>
        </section>

        <section class="panel">
          <div class="section-title">
            <h2>{t('detail.refs.title')}</h2>
          </div>
          <ul class="refs">
            {#each references as reference}
              <li>
                <a href={reference.href} target="_blank" rel="noreferrer">
                  <span class="ref-icon"><Icon name={reference.icon} size={16} /></span>
                  <span class="ref-copy">
                    <strong>{reference.label}</strong>
                    <small>{reference.desc}</small>
                  </span>
                  <Icon name="arrow-up-right" size={14} />
                </a>
              </li>
            {/each}
          </ul>
        </section>
      </aside>
    </div>
  </main>
{/if}

<style>
  .detail {
    padding-top: 28px;
    padding-bottom: 84px;
  }

  .back {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: var(--muted);
    font-size: 0.82rem;
    font-weight: 600;
  }

  .back:hover {
    color: var(--accent);
  }

  .crumbs {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 16px;
    padding-bottom: 4px;
    overflow-x: auto;
    color: var(--faint);
    font-size: 0.75rem;
    white-space: nowrap;
    scrollbar-width: none;
  }

  .crumbs::-webkit-scrollbar {
    display: none;
  }

  .crumbs a {
    color: var(--link);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .crumbs a:hover {
    color: var(--accent);
  }

  .crumbs span[aria-current] {
    color: var(--text-soft);
    font-weight: 600;
  }

  .crumbs :global(svg) {
    flex: 0 0 auto;
    opacity: 0.55;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(0, 1fr);
    gap: clamp(24px, 4vw, 46px);
    align-items: center;
    margin-top: 22px;
    padding: clamp(18px, 3vw, 28px);
    border: 1px solid var(--border);
    border-top: 4px solid var(--accent);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .gallery,
  .intro {
    min-width: 0;
  }

  .stage {
    position: relative;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface-2);
  }

  .stage > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .credit {
    position: absolute;
    inset: auto 0 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 12px;
    background: rgba(51, 51, 51, 0.92);
    color: #dddddd;
    font-size: 0.65rem;
    line-height: 1.3;
  }

  .credit span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .credit a {
    flex: 0 0 auto;
    color: #ffffff;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .credit a:hover {
    color: #f1c40f;
  }

  .stage-placeholder {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: var(--border-strong);
    background: var(--surface-2);
  }

  .stage-placeholder .initial {
    position: absolute;
    font-family: var(--font-sans);
    font-size: clamp(8rem, 20vw, 14rem);
    font-weight: 700;
    line-height: 1;
    opacity: 0.07;
  }

  .thumbs {
    display: flex;
    gap: 7px;
    margin-top: 10px;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;
  }

  .thumbs::-webkit-scrollbar {
    display: none;
  }

  .thumbs button {
    width: 58px;
    height: 58px;
    flex: 0 0 auto;
    overflow: hidden;
    padding: 0;
    border: 2px solid transparent;
    border-radius: var(--radius-sm);
    opacity: 0.62;
    background: var(--surface-2);
    transition:
      opacity 160ms ease,
      border-color 160ms ease;
  }

  .thumbs button:hover,
  .thumbs button.active {
    opacity: 1;
    border-color: var(--accent);
  }

  .thumbs img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 7px;
    margin-bottom: 14px;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .tag.rank {
    color: #ffffff;
    background: #333333;
    border-color: #333333;
  }

  .tag.group {
    color: var(--text-soft);
    background: var(--surface-2);
    border-color: var(--border);
  }

  .tag.cons {
    color: var(--c);
    background: color-mix(in srgb, var(--c) 12%, var(--surface));
    border-color: color-mix(in srgb, var(--c) 35%, var(--surface));
    letter-spacing: 0.03em;
  }

  .tag.cons .dot,
  .mini-cons .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
  }

  .tag.extinct {
    color: #ffffff;
    background: #900000;
    border-color: #900000;
  }

  .sci {
    font-family: var(--font-sans);
    font-size: clamp(2.1rem, 4.2vw, 3.2rem);
    font-weight: 700;
    font-style: italic;
    line-height: 1.08;
    letter-spacing: -0.7px;
    overflow-wrap: anywhere;
  }

  .common {
    margin-top: 7px;
    color: var(--text-soft);
    font-size: clamp(1rem, 1.8vw, 1.18rem);
  }

  .muted {
    color: var(--muted);
  }

  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: clamp(18px, 4vw, 36px);
    margin: 26px 0;
    padding: 18px 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }

  .stats div {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .stats strong {
    font-family: var(--font-sans);
    font-size: 1.45rem;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.4px;
  }

  .stats span {
    color: var(--muted);
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
  }

  .primary,
  .ghost {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 11px 16px;
    border-radius: var(--radius-sm);
    font-size: 0.84rem;
    font-weight: 600;
    transition:
      background 150ms ease,
      color 150ms ease,
      border-color 150ms ease;
  }

  .primary {
    color: #ffffff;
    background: var(--accent);
    border: 1px solid var(--accent);
  }

  .primary:hover {
    background: #333333;
    border-color: #333333;
  }

  .primary:active {
    background: #660000;
    border-color: #660000;
  }

  .ghost {
    color: var(--accent);
    background: transparent;
    border: 1px solid var(--accent);
  }

  .ghost:hover {
    color: #333333;
    border-color: #333333;
    background: var(--surface-2);
  }

  .columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 342px;
    gap: 24px;
    align-items: start;
    margin-top: clamp(30px, 4vw, 46px);
  }

  .main,
  .side {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }

  .side {
    position: sticky;
    top: 90px;
  }

  .panel {
    padding: 22px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .panel .section-title {
    margin-bottom: 14px;
  }

  .panel .section-title h2 {
    font-size: 1.28rem;
  }

  .section-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--link);
    font-size: 0.74rem;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
    white-space: nowrap;
  }

  .section-link:hover {
    color: var(--accent);
  }

  .prose {
    color: var(--text-soft);
    font-size: 0.94rem;
    line-height: 1.75;
  }

  .territory-skeleton {
    height: 170px;
    border-radius: var(--radius-sm);
  }

  .province-bars {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .province-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .province-label {
    width: 96px;
    flex: 0 0 auto;
    color: var(--text-soft);
    font-size: 0.76rem;
    font-weight: 600;
  }

  .province-track {
    flex: 1;
    height: 9px;
    overflow: hidden;
    border-radius: 2px;
    background: var(--surface-3);
  }

  .province-fill {
    display: block;
    height: 100%;
    background: var(--accent);
  }

  .province-row strong {
    width: 72px;
    flex: 0 0 auto;
    text-align: right;
    font-size: 0.76rem;
    font-variant-numeric: tabular-nums;
  }

  .chart-title {
    margin: 20px 0 6px;
    color: var(--muted);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .phenology {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 130px;
    padding-top: 4px;
    border-bottom: 1px solid var(--border);
  }

  .month {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    height: 100%;
    min-width: 0;
  }

  .bar-area {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    width: 100%;
    flex: 1;
    min-height: 0;
  }

  .month-bar {
    width: 68%;
    min-height: 2px;
    background: var(--accent);
  }

  .month-label {
    flex: 0 0 auto;
    color: var(--faint);
    font-size: 0.56rem;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .territory-note {
    margin-top: 10px;
    color: var(--faint);
    font-size: 0.7rem;
  }

  .map-skeleton {
    height: 300px;
    margin-top: 4px;
    border-radius: var(--radius-sm);
  }

  .children {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 7px;
  }

  .child {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    transition:
      background 150ms ease,
      border-color 150ms ease;
  }

  .child:hover {
    background: var(--surface-2);
    border-color: var(--accent);
  }

  .child-media {
    display: grid;
    place-items: center;
    width: 45px;
    height: 45px;
    flex: 0 0 auto;
    overflow: hidden;
    border-radius: var(--radius-sm);
    color: var(--muted);
    background: var(--surface-2);
  }

  .child-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .child-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.25;
  }

  .child-rank {
    color: var(--faint);
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .child-copy strong {
    font-family: var(--font-sans);
    font-size: 0.98rem;
    font-style: italic;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .child-copy small {
    color: var(--muted);
    font-size: 0.72rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .child > :global(svg) {
    margin-left: auto;
    flex: 0 0 auto;
    color: var(--faint);
  }

  .see-all {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 14px;
    color: var(--link);
    font-size: 0.78rem;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .see-all:hover {
    color: var(--accent);
  }

  .photo-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 7px;
  }

  .photo {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-2);
  }

  .photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 300ms ease;
  }

  .photo:hover img {
    transform: scale(1.04);
  }

  .photo-credit {
    position: absolute;
    inset: auto 0 0 0;
    padding: 16px 7px 6px;
    background: rgba(51, 51, 51, 0.92);
    color: #dddddd;
    font-size: 0.56rem;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 150ms ease;
  }

  .photo:hover .photo-credit {
    opacity: 1;
  }

  dl {
    display: flex;
    flex-direction: column;
    margin: 0;
  }

  .fact {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 14px;
    padding: 9px 0;
    border-bottom: 1px solid var(--border);
  }

  .fact:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  .fact dt {
    flex: 0 0 auto;
    color: var(--muted);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .fact dd {
    margin: 0;
    text-align: right;
    font-size: 0.84rem;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .fact dd a {
    color: var(--link);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .fact dd a:hover {
    color: var(--accent);
  }

  .sci-inline {
    font-style: italic;
  }

  .mini-cons {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 7px;
    border: 1px solid color-mix(in srgb, var(--c) 35%, var(--surface));
    border-radius: var(--radius-sm);
    color: var(--c);
    background: color-mix(in srgb, var(--c) 12%, var(--surface));
    font-size: 0.68rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .inherited {
    display: block;
    margin-top: 3px;
    color: var(--faint);
    font-size: 0.64rem;
    font-weight: 400;
  }

  .refs {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .refs a {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    transition:
      background 150ms ease,
      border-color 150ms ease;
  }

  .refs a:hover {
    background: var(--surface-2);
    border-color: var(--border);
  }

  .ref-icon {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    flex: 0 0 auto;
    border-radius: var(--radius-sm);
    color: var(--accent);
    background: var(--accent-soft);
  }

  .ref-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.3;
  }

  .ref-copy strong {
    font-size: 0.82rem;
    font-weight: 600;
  }

  .ref-copy small {
    color: var(--muted);
    font-size: 0.7rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .refs a > :global(svg) {
    margin-left: auto;
    flex: 0 0 auto;
    color: var(--faint);
  }

  .refs a:hover > :global(svg) {
    color: var(--accent);
  }

  .crumb-skeleton {
    width: 280px;
    height: 13px;
    margin-top: 22px;
    border-radius: var(--radius-sm);
  }

  .intro .tagline {
    width: 120px;
    height: 20px;
    margin-bottom: 16px;
    border-radius: var(--radius-sm);
  }

  .intro .title {
    width: 78%;
    height: 52px;
    margin-bottom: 12px;
    border-radius: var(--radius-sm);
  }

  .intro .subtitle {
    width: 42%;
    height: 18px;
    margin-bottom: 30px;
    border-radius: var(--radius-sm);
  }

  .intro .paragraph {
    width: 100%;
    height: 13px;
    margin-bottom: 10px;
    border-radius: var(--radius-sm);
  }

  .intro .paragraph.short {
    width: 64%;
  }

  .error-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 520px;
    margin: 10vh auto 0;
    padding: 42px 32px;
    border: 1px solid var(--border);
    border-top: 4px solid var(--accent);
    border-radius: var(--radius-md);
    background: var(--surface);
    text-align: center;
  }

  .error-icon {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    margin-bottom: 16px;
    border: 1px solid #f5b4b4;
    border-radius: var(--radius-sm);
    color: #dd0404;
    background: #fbeeed;
  }

  .error-card h1 {
    margin: 9px 0 7px;
    font-family: var(--font-sans);
    font-size: 1.85rem;
    font-weight: 700;
    letter-spacing: -0.4px;
  }

  .error-copy {
    max-width: 380px;
    color: var(--muted);
    font-size: 0.9rem;
  }

  .error-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    margin-top: 22px;
  }

  @media (max-width: 980px) {
    .hero {
      grid-template-columns: 1fr;
    }

    .columns {
      grid-template-columns: 1fr;
    }

    .side {
      position: static;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      align-items: start;
    }

    .stage {
      aspect-ratio: 16 / 10;
    }
  }

  @media (max-width: 640px) {
    .detail {
      padding-top: 18px;
    }

    .hero {
      gap: 22px;
      padding: 14px;
    }

    .stage {
      aspect-ratio: 4 / 3;
    }

    .thumbs button {
      width: 50px;
      height: 50px;
    }

    .panel {
      padding: 16px;
    }

    .stats {
      gap: 18px;
    }

    .stats strong {
      font-size: 1.18rem;
    }

    .children {
      grid-template-columns: 1fr;
    }

    .photo-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .side {
      display: flex;
    }

    .error-card {
      padding: 32px 20px;
    }
  }
</style>

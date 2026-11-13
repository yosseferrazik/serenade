<script>
  import { getTaxonChildren } from '../lib/api.js';
  import { i18n, t } from '../lib/i18n.svelte.js';
  import { formatNumber, rankLabel } from '../lib/utils.js';
  import Icon from '../components/Icon.svelte';

  const ROOT_ID = 48460;

  let path = $state([]);
  let items = $state([]);
  let total = $state(0);
  let loading = $state(true);
  let error = $state('');
  let reloadKey = $state(0);

  let parentId = $derived(path.length ? path[path.length - 1].id : ROOT_ID);
  let current = $derived(path.length ? path[path.length - 1] : null);

  $effect(() => {
    const parent = parentId;
    void i18n.locale;
    void reloadKey;

    const controller = new AbortController();
    loading = true;
    error = '';

    getTaxonChildren(parent, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        items = result.items;
        total = result.total;
        loading = false;
      })
      .catch((requestError) => {
        if (controller.signal.aborted || requestError.name === 'AbortError') return;
        error = requestError.message || t('taxonomy.error');
        loading = false;
      });

    return () => controller.abort();
  });

  function drill(taxon) {
    path = [...path, taxon];
  }

  function goTo(index) {
    path = path.slice(0, index);
  }
</script>

<main class="taxonomy shell">
  <section class="hero">
    <p class="eyebrow"><span class="pip"></span> {t('taxonomy.eyebrow')}</p>
    <h1>
      {t('taxonomy.title.line1')}<br />{t('taxonomy.title.line2')}<em
        >{t('taxonomy.title.accent')}</em
      >.
    </h1>
    <p class="lead">{t('taxonomy.lead')}</p>
  </section>

  <nav class="breadcrumb" aria-label={t('taxonomy.breadcrumbAria')}>
    <button type="button" class="crumb" onclick={() => goTo(0)}>
      {t('taxonomy.root')}
    </button>
    {#each path as taxon, index (taxon.id)}
      <Icon name="chevron-right" size={11} />
      {#if index === path.length - 1}
        <span class="crumb-current">{taxon.name}</span>
      {:else}
        <button type="button" class="crumb" onclick={() => goTo(index + 1)}>
          {taxon.name}
        </button>
      {/if}
    {/each}
  </nav>

  {#if current}
    <section class="current">
      <div class="current-copy">
        <span class="current-rank">{rankLabel(current.rank)}</span>
        <h2>{current.name}</h2>
        {#if current.commonName}<p>{current.commonName}</p>{/if}
      </div>
      <a class="current-link" href="#/taxon/{current.id}">
        {t('taxonomy.sheet')}
        <Icon name="arrow-up-right" size={14} />
      </a>
    </section>
  {/if}
  {#if loading}
    <div class="nodes" aria-hidden="true">
      {#each Array(8) as _}
        <div class="node-skeleton skeleton"></div>
      {/each}
    </div>
  {:else if error}
    <div class="alert" role="alert">
      <span class="alert-icon"><Icon name="alert" size={19} /></span>
      <div>
        <strong>{t('taxonomy.error.title')}</strong>
        <p>{error}</p>
      </div>
      <button type="button" onclick={() => (reloadKey += 1)}>
        <Icon name="refresh" size={15} />
        {t('taxonomy.retry')}
      </button>
    </div>
  {:else if items.length === 0}
    <div class="empty">
      <span class="empty-icon"><Icon name="leaf" size={24} /></span>
      <h3>{t('taxonomy.empty')}</h3>
      <p>{t('taxonomy.emptyHint')}</p>
      {#if current}
        <a class="sheet-link" href="#/taxon/{current.id}">{t('taxonomy.sheet')}</a>
      {/if}
    </div>
  {:else}
    <div class="section-title">
      <h2>{path.length ? t('taxonomy.descendants') : t('taxonomy.kingdoms')}</h2>
      <span class="count">{t('taxonomy.count', { count: formatNumber(total) })}</span>
    </div>

    <div class="nodes">
      {#each items as taxon (taxon.id)}
        <article class="node">
          <button type="button" class="node-main" onclick={() => drill(taxon)}>
            <span class="thumb">
              {#if taxon.thumb}
                <img src={taxon.thumb} alt="" loading="lazy" decoding="async" />
              {:else}
                <Icon name="leaf" size={20} />
              {/if}
            </span>
            <span class="node-copy">
              <span class="node-rank">{rankLabel(taxon.rank)}</span>
              <span class="node-name">{taxon.name}</span>
              {#if taxon.commonName}<span class="node-common">{taxon.commonName}</span>{/if}
            </span>
            <span class="node-count">{formatNumber(taxon.observations)}</span>
            <Icon name="chevron-right" size={15} />
          </button>
          <a class="node-link" href="#/taxon/{taxon.id}">{t('taxonomy.sheet')}</a>
        </article>
      {/each}
    </div>

    <p class="limit">{t('taxonomy.limit')}</p>
  {/if}
</main>

<style>
  .taxonomy {
    padding-top: clamp(24px, 3vw, 36px);
    padding-bottom: 72px;
  }

  .hero {
    margin-bottom: 22px;
    padding: clamp(24px, 4vw, 44px);
    border: 1px solid var(--border);
    border-top: 4px solid var(--accent);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .hero h1 {
    max-width: 760px;
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

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 5px;
    overflow-x: auto;
    margin-bottom: 16px;
    color: var(--faint);
    font-size: 0.78rem;
    white-space: nowrap;
    scrollbar-width: none;
  }

  .breadcrumb::-webkit-scrollbar {
    display: none;
  }

  .crumb {
    padding: 2px 0;
    border: 0;
    color: var(--link);
    font-size: inherit;
    font-weight: 600;
    background: transparent;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .crumb:hover {
    color: var(--accent);
  }

  .crumb-current {
    color: var(--text-soft);
    font-weight: 600;
  }

  .breadcrumb :global(svg) {
    flex: 0 0 auto;
    opacity: 0.55;
  }

  .current {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 20px;
    padding: 16px 20px;
    border: 1px solid var(--border);
    border-left: 4px solid var(--accent);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .current-copy {
    min-width: 0;
  }

  .current-rank {
    color: var(--accent);
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .current h2 {
    margin-top: 2px;
    font-size: 1.5rem;
    font-style: italic;
    letter-spacing: -0.3px;
  }

  .current p {
    color: var(--muted);
    font-size: 0.84rem;
  }

  .current-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex: 0 0 auto;
    color: var(--link);
    font-size: 0.8rem;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .current-link:hover {
    color: var(--accent);
  }

  .section-title {
    margin-bottom: 14px;
  }

  .section-title h2 {
    padding-left: 12px;
    border-left: 4px solid var(--accent);
    font-size: clamp(1.3rem, 2.1vw, 1.6rem);
    letter-spacing: -0.4px;
  }

  .nodes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 0 22px;
    padding: 4px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .node {
    display: flex;
    align-items: stretch;
    border-bottom: 1px solid var(--border);
  }

  .node-main {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
    padding: 8px 4px;
    border: 0;
    background: transparent;
    text-align: left;
  }

  .node-main:hover {
    background: var(--surface-2);
  }

  .thumb {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    flex: 0 0 auto;
    overflow: hidden;
    border-radius: var(--radius-sm);
    color: var(--muted);
    background: var(--surface-2);
  }

  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .node-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.25;
  }

  .node-rank {
    color: var(--faint);
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .node-name {
    overflow: hidden;
    font-size: 0.94rem;
    font-style: italic;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .node-common {
    overflow: hidden;
    color: var(--muted);
    font-size: 0.72rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .node-count {
    margin-left: auto;
    color: var(--faint);
    font-size: 0.72rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .node-main > :global(svg) {
    flex: 0 0 auto;
    color: var(--faint);
  }

  .node-link {
    display: flex;
    align-items: center;
    align-self: center;
    flex: 0 0 auto;
    padding: 4px 2px 4px 8px;
    color: var(--link);
    font-size: 0.68rem;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .node-link:hover {
    color: var(--accent);
  }

  .limit {
    margin-top: 10px;
    color: var(--faint);
    font-size: 0.72rem;
  }

  .node-skeleton {
    height: 56px;
    margin: 8px 0;
    border-radius: 2px;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 24px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    text-align: center;
  }

  .empty-icon {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    margin-bottom: 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--muted);
    background: var(--surface-2);
  }

  .empty h3 {
    font-size: 1.15rem;
    font-weight: 700;
  }

  .empty p {
    max-width: 440px;
    margin: 6px 0 16px;
    color: var(--muted);
    font-size: 0.84rem;
  }

  .sheet-link {
    padding: 9px 14px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-sm);
    color: var(--accent);
    font-size: 0.8rem;
    font-weight: 600;
  }

  .sheet-link:hover {
    border-color: #333;
    color: #333;
    background: var(--surface-2);
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

  @media (max-width: 640px) {
    .hero {
      padding: 20px;
    }

    .nodes {
      grid-template-columns: 1fr;
      padding: 4px 12px;
    }

    .current {
      align-items: flex-start;
      flex-direction: column;
      gap: 8px;
    }

    .current-link {
      align-self: flex-start;
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

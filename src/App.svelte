<script>
  import { onMount } from 'svelte';
  import { initRouter, router } from './lib/router.svelte.js';
  import { i18n, t } from './lib/i18n.svelte.js';
  import Header from './components/Header.svelte';
  import Catalog from './pages/Catalog.svelte';
  import Territory from './pages/Territory.svelte';
  import Taxonomy from './pages/Taxonomy.svelte';
  import TaxonDetail from './pages/TaxonDetail.svelte';
  import Sources from './pages/Sources.svelte';
  import Logo from './components/Logo.svelte';
  import { BDB_URL } from './lib/territory.js';

  onMount(() => initRouter());

  let segments = $derived(router.path.split('/').filter(Boolean));
  let taxonId = $derived(segments[0] === 'taxon' ? segments[1] : null);
  let isTerritory = $derived(segments[0] === 'territori');
  let isTaxonomy = $derived(segments[0] === 'taxonomia');
  let isSources = $derived(segments[0] === 'fonts');

  $effect(() => {
    void router.path;
    window.scrollTo({ top: 0, behavior: 'auto' });
  });

  $effect(() => {
    void i18n.locale;
    if (!taxonId) {
      document.title = isTerritory
        ? t('territory.pageTitle')
        : isTaxonomy
          ? t('taxonomy.pageTitle')
          : isSources
            ? t('sources.pageTitle')
            : t('app.title');
    }
  });
</script>

<Header />

{#if taxonId}
  <TaxonDetail id={taxonId} />
{:else if isTerritory}
  <Territory />
{:else if isTaxonomy}
  <Taxonomy />
{:else if isSources}
  <Sources />
{:else}
  <Catalog />
{/if}

<footer class="site-footer">
  <div class="shell foot">
    <div class="brandline">
      <Logo inverse size={30} />
    </div>
    <p class="attribution">
      {t('footer.data')}
      <a href="https://www.inaturalist.org" target="_blank" rel="noreferrer">iNaturalist</a>,
      <a href="https://www.gbif.org" target="_blank" rel="noreferrer">GBIF</a> {t('footer.and')}
      <a href="https://www.wikipedia.org" target="_blank" rel="noreferrer">Wikipedia</a>.
      {t('footer.rights')}
      <a class="inspired" href={BDB_URL} target="_blank" rel="noreferrer">
        {t('footer.inspired')}
      </a>
      <a class="inspired" href="#/fonts">{t('footer.sources')}</a>
    </p>
    <p class="stack">{t('footer.stack')}</p>
  </div>
</footer>

<style>
  .site-footer {
    margin-top: auto;
    border-top: 4px solid var(--accent);
    background: #333333;
    color: #dddddd;
  }

  .foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
    padding-top: 26px;
    padding-bottom: 26px;
    font-size: 0.75rem;
  }

  .brandline {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
  }

  .attribution {
    max-width: 560px;
    color: #dddddd;
    line-height: 1.5;
    text-align: center;
  }

  .attribution a {
    color: #ffffff;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .attribution a:hover {
    color: #f1c40f;
  }

  .attribution .inspired {
    display: block;
    margin-top: 3px;
    color: #b3b3b3;
  }

  .stack {
    flex: 0 0 auto;
    color: #b3b3b3;
    white-space: nowrap;
  }

  @media (max-width: 900px) {
    .foot {
      flex-direction: column;
      align-items: flex-start;
      gap: 14px;
    }

    .attribution {
      text-align: left;
    }
  }
</style>

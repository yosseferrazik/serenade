<script>
  import { catalogState as state } from '../lib/store.svelte.js';
  import { GROUPS, RANKS } from '../lib/utils.js';
  import { t } from '../lib/i18n.svelte.js';
  import Icon from './Icon.svelte';
  import TaxonFilter from './TaxonFilter.svelte';

  let { loading = false } = $props();

  let dirty = $derived(
    state.query !== '' ||
      state.group !== 'all' ||
      state.rank !== 'species' ||
      state.sort !== 'obs' ||
      Boolean(state.taxon),
  );
  let searching = $derived(state.query.trim() !== '');

  function reset() {
    state.query = '';
    state.group = 'all';
    state.rank = 'species';
    state.sort = 'obs';
    state.taxon = null;
  }
</script>

<section class="filters" aria-label={t('filters.label')}>
  <div class="search-row">
    <div class="searchbox" class:busy={loading}>
      <Icon name="search" size={19} />
      <input
        type="search"
        bind:value={state.query}
        placeholder={t('filters.searchPlaceholder')}
        aria-label={t('filters.searchAria')}
        autocomplete="off"
        spellcheck="false"
      />
      {#if state.query}
        <button
          class="clear"
          type="button"
          onclick={() => (state.query = '')}
          aria-label={t('filters.clear')}
        >
          <Icon name="x" size={15} />
        </button>
      {/if}
      {#if loading}
        <span class="spinner" aria-hidden="true"></span>
      {/if}
    </div>

    <TaxonFilter />

    <label class="field">
      <span>{t('filters.rank')}</span>
      <div class="select">
        <select bind:value={state.rank}>
          {#each RANKS as value}
            <option {value}>{t(`rank.${value}`)}</option>
          {/each}
        </select>
        <Icon name="chevron-down" size={14} />
      </div>
    </label>

    <label class="field">
      <span>{t('filters.sort')}</span>
      <div class="select">
        <select
          bind:value={state.sort}
          disabled={searching}
          title={searching ? t('filters.sortRelevanceHint') : t('filters.sortHint')}
        >
          <option value="obs">{t('filters.sortObs')}</option>
          <option value="recent">{t('filters.sortRecent')}</option>
        </select>
        <Icon name="chevron-down" size={14} />
      </div>
    </label>
  </div>

  <div class="chips-row">
    <div class="chips" role="group" aria-label={t('filters.groupsAria')}>
      {#each GROUPS as group}
        <button
          type="button"
          class="chip"
          class:active={state.group === group.value}
          aria-pressed={state.group === group.value}
          onclick={() => (state.group = group.value)}
        >
          {t(`group.${group.value}`)}
        </button>
      {/each}
    </div>

    {#if dirty}
      <button class="reset" type="button" onclick={reset}>
        <Icon name="x" size={13} />
        {t('filters.reset')}
      </button>
    {/if}
  </div>
</section>

<style>
  .filters {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 18px 20px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .search-row {
    display: flex;
    align-items: flex-end;
    gap: 12px;
  }

  .searchbox {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1 1 auto;
    min-width: 0;
    height: 48px;
    padding: 0 14px;
    border: 1px solid var(--border-strong);
    border-radius: 2px;
    background: var(--surface);
    color: var(--accent);
    transition:
      border-color 150ms ease,
      outline-color 150ms ease;
  }

  .searchbox:focus-within {
    border-color: var(--text-soft);
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }

  .searchbox input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--text);
    font-size: 0.95rem;
  }

  .searchbox input::placeholder {
    color: var(--faint);
  }

  .searchbox input::-webkit-search-cancel-button {
    display: none;
  }

  .clear {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    flex: 0 0 auto;
    border-radius: 2px;
    color: var(--muted);
    background: var(--surface-2);
  }

  .clear:hover {
    color: var(--text);
    background: var(--surface-3);
  }

  .spinner {
    width: 16px;
    height: 16px;
    flex: 0 0 auto;
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

  .field {
    display: flex;
    flex-direction: column;
    gap: 5px;
    flex: 0 0 auto;
  }

  .field > span {
    padding-left: 1px;
    color: var(--text-soft);
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0;
  }

  .select {
    position: relative;
    display: flex;
    align-items: center;
    height: 48px;
    border: 1px solid var(--border-strong);
    border-radius: 2px;
    background: var(--surface);
    color: var(--text);
  }

  .select select {
    appearance: none;
    height: 100%;
    min-width: 148px;
    padding: 0 36px 0 13px;
    border: 0;
    outline: 0;
    background: transparent;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .select select:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .select :global(svg) {
    position: absolute;
    right: 12px;
    pointer-events: none;
    color: var(--text-soft);
  }

  .chips-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .chips {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;
  }

  .chips::-webkit-scrollbar {
    display: none;
  }

  .chip {
    flex: 0 0 auto;
    padding: 7px 13px;
    border: 1px solid var(--border);
    border-radius: 2px;
    color: var(--text-soft);
    font-size: 0.82rem;
    font-weight: 600;
    white-space: nowrap;
    background: var(--surface);
    transition:
      color 150ms ease,
      background 150ms ease,
      border-color 150ms ease;
  }

  .chip:hover {
    border-color: var(--border-strong);
    background: var(--surface-2);
  }

  .chip.active {
    color: #fff;
    background: var(--accent);
    border-color: var(--accent);
  }

  .reset {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex: 0 0 auto;
    padding: 7px 4px;
    color: var(--accent);
    font-size: 0.78rem;
    font-weight: 600;
  }

  .reset:hover {
    text-decoration: underline;
  }

  @media (max-width: 820px) {
    .search-row {
      flex-wrap: wrap;
    }

    .searchbox {
      flex-basis: 100%;
    }

    .field {
      flex: 1 1 0;
    }

    .select select {
      width: 100%;
      min-width: 0;
    }
  }

  @media (max-width: 640px) {
    .filters {
      padding: 14px;
      border-radius: 4px;
    }

    .chips-row {
      flex-wrap: wrap;
    }

    .reset {
      margin-left: auto;
    }
  }
</style>

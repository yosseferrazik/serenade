<script>
  import { searchTaxonFilter } from '../lib/api.js';
  import { t } from '../lib/i18n.svelte.js';
  import { catalogState as catalog } from '../lib/store.svelte.js';
  import { rankLabel } from '../lib/utils.js';
  import Icon from './Icon.svelte';

  let query = $state('');
  let results = $state([]);
  let open = $state(false);
  let loading = $state(false);
  let error = $state('');
  let timer;
  let activeRequest;

  let selected = $derived(catalog.taxon);

  $effect(() => {
    if (catalog.taxon) {
      query = '';
      results = [];
      open = false;
    }
  });

  function resetSuggestions() {
    results = [];
    open = false;
    loading = false;
  }

  async function search() {
    const value = query.trim();
    if (value.length < 2) {
      resetSuggestions();
      return;
    }

    activeRequest?.abort();
    const controller = new AbortController();
    activeRequest = controller;
    loading = true;

    try {
      const rows = await searchTaxonFilter(value, { signal: controller.signal });
      if (controller.signal.aborted) return;
      results = rows;
      open = true;
      error = '';
    } catch (requestError) {
      if (requestError.name === 'AbortError') return;
      results = [];
      error = t('filters.taxonError');
      open = true;
    } finally {
      if (activeRequest === controller) loading = false;
    }
  }

  function onInput(event) {
    query = event.currentTarget.value;
    clearTimeout(timer);
    error = '';
    if (query.trim().length < 2) {
      activeRequest?.abort();
      resetSuggestions();
      return;
    }
    timer = setTimeout(search, 260);
  }

  function choose(taxon) {
    catalog.taxon = {
      id: taxon.id,
      name: taxon.name,
      rank: taxon.rank,
      commonName: taxon.commonName,
    };
    catalog.group = 'all';
    query = '';
    results = [];
    open = false;
  }

  function clear() {
    catalog.taxon = null;
    query = '';
    resetSuggestions();
  }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      open = false;
      return;
    }
    if (event.key === 'Enter' && results.length > 0) {
      event.preventDefault();
      choose(results[0]);
    }
  }

  function onBlur() {
    setTimeout(() => {
      open = false;
    }, 140);
  }

  function keepFocus(event) {
    event.preventDefault();
  }
</script>

<div class="taxon-field">
  <span class="label">{t('filters.taxon')}</span>

  <div class="box">
    {#if selected}
      <span class="selected">
        <span class="selected-name">{selected.name}</span>
        <span class="selected-rank">{rankLabel(selected.rank)}</span>
      </span>
      <button
        type="button"
        class="clear"
        onclick={clear}
        aria-label={t('filters.clearTaxon')}
        title={t('filters.clearTaxon')}
      >
        <Icon name="x" size={13} />
      </button>
    {:else}
      <Icon name="search" size={16} />
      <input
        type="search"
        bind:value={query}
        oninput={onInput}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="taxon-suggestions"
        onfocus={() => {
          if (results.length > 0) open = true;
        }}
        onblur={onBlur}
        onkeydown={onKeydown}
        placeholder={t('filters.taxonPlaceholder')}
        aria-label={t('filters.taxon')}
        autocomplete="off"
        spellcheck="false"
      />
      {#if loading}
        <span class="mini-spinner" aria-hidden="true"></span>
      {/if}
    {/if}
  </div>

  {#if open && (results.length > 0 || error || query.trim().length >= 2)}
    <div class="suggestions" id="taxon-suggestions" role="listbox">
      {#if error}
        <p class="suggestion-empty">{error}</p>
      {:else if results.length === 0 && !loading}
        <p class="suggestion-empty">{t('filters.taxonEmpty')}</p>
      {:else}
        {#each results as taxon (taxon.id)}
          <button
            type="button"
            class="suggestion"
            role="option"
            aria-selected="false"
            onmousedown={keepFocus}
            onclick={() => choose(taxon)}
          >
            <span class="suggestion-name">{taxon.name}</span>
            <span class="suggestion-meta">
              {rankLabel(taxon.rank)}{taxon.commonName ? ` · ${taxon.commonName}` : ''}
            </span>
          </button>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .taxon-field {
    position: relative;
    display: flex;
    flex: 1 1 200px;
    flex-direction: column;
    gap: 5px;
    min-width: 170px;
  }

  .label {
    padding-left: 1px;
    color: var(--text-soft);
    font-size: 0.78rem;
    font-weight: 600;
  }

  .box {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 48px;
    padding: 0 10px;
    border: 1px solid var(--border-strong);
    border-radius: 2px;
    background: var(--surface);
    color: var(--muted);
    transition:
      border-color 150ms ease,
      outline-color 150ms ease;
  }

  .box:focus-within {
    border-color: var(--text-soft);
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }

  .box input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--text);
    font-size: 0.85rem;
  }

  .box input::placeholder {
    color: var(--faint);
  }

  .box input::-webkit-search-cancel-button {
    display: none;
  }

  .selected {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    flex: 1;
  }

  .selected-name {
    overflow: hidden;
    color: var(--text);
    font-size: 0.82rem;
    font-style: italic;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .selected-rank {
    flex: 0 0 auto;
    color: var(--faint);
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .clear {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    flex: 0 0 auto;
    border-radius: 2px;
    color: var(--muted);
    background: var(--surface-2);
  }

  .clear:hover {
    color: var(--text);
    background: var(--surface-3);
  }

  .mini-spinner {
    width: 14px;
    height: 14px;
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

  .suggestions {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    left: 0;
    z-index: 30;
    max-height: 270px;
    overflow-y: auto;
    border: 1px solid var(--border);
    border-radius: 2px;
    background: var(--surface);
    box-shadow: var(--shadow-hover);
  }

  .suggestion {
    display: flex;
    flex-direction: column;
    gap: 1px;
    width: 100%;
    padding: 8px 10px;
    border-bottom: 1px solid var(--border);
    background: transparent;
    text-align: left;
  }

  .suggestion:last-child {
    border-bottom: 0;
  }

  .suggestion:hover,
  .suggestion:focus-visible {
    background: var(--surface-2);
  }

  .suggestion-name {
    color: var(--text);
    font-size: 0.82rem;
    font-style: italic;
    font-weight: 600;
  }

  .suggestion-meta {
    color: var(--muted);
    font-size: 0.68rem;
  }

  .suggestion-empty {
    margin: 0;
    padding: 10px;
    color: var(--muted);
    font-size: 0.78rem;
  }

  @media (max-width: 820px) {
    .taxon-field {
      flex-basis: 100%;
    }
  }
</style>

<script>
  import { onMount } from 'svelte';
  import { prefetchTaxon } from '../lib/api.js';
  import { t } from '../lib/i18n.svelte.js';
  import { conservationMeta, formatNumber, groupLabel, rankLabel } from '../lib/utils.js';
  import Icon from './Icon.svelte';

  let { taxon, index = 0 } = $props();

  let prefetchTimer;
  let cons = $derived(taxon.conservation ? conservationMeta(taxon.conservation) : null);

  function schedulePrefetch() {
    clearTimeout(prefetchTimer);
    prefetchTimer = setTimeout(() => prefetchTaxon(taxon.id), 180);
  }

  function cancelPrefetch() {
    clearTimeout(prefetchTimer);
  }

  onMount(() => () => clearTimeout(prefetchTimer));
</script>

<a
  class="card"
  href="#/taxon/{taxon.id}"
  style="--i: {index}"
  onpointerenter={schedulePrefetch}
  onpointerleave={cancelPrefetch}
  onfocus={schedulePrefetch}
  onblur={cancelPrefetch}
>
  <div class="media">
    {#if taxon.photo}
      <img
        src={taxon.photo}
        alt={taxon.name}
        loading="lazy"
        decoding="async"
        width="480"
        height="360"
      />
    {:else}
      <div class="placeholder" aria-hidden="true">
        <span class="initial">{taxon.name.charAt(0)}</span>
        <Icon name="leaf" size={30} />
      </div>
    {/if}

    <div class="top-badges">
      <span class="rank">{rankLabel(taxon.rank)}</span>
      {#if taxon.extinct}
        <span class="extinct">{t('common.extinct')}</span>
      {/if}
    </div>

    {#if cons && cons.known}
      <span
        class="cons"
        style="--c: {cons.color}"
        title={t('common.consTitle', { label: cons.label })}
      >
        <span class="dot"></span>
        {cons.short}
      </span>
    {/if}
  </div>

  <div class="body">
    <div class="names">
      <h3 class="sci">{taxon.name}</h3>
      <p class="common">{taxon.commonName || t('common.noCommonName')}</p>
    </div>
    <div class="meta">
      <span class="obs">
        <span class="obs-dot"></span>
        {t('common.obs', { count: formatNumber(taxon.observations) })}
      </span>
      <span class="sep" aria-hidden="true"></span>
      <span class="group">{groupLabel(taxon.group)}</span>
      <span class="go" aria-hidden="true"><Icon name="arrow-up-right" size={14} /></span>
    </div>
  </div>
</a>

<style>
  .card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    box-shadow: var(--shadow);
    animation: rise 420ms both;
    animation-delay: calc(var(--i) * 24ms);
    transition:
      transform 180ms ease,
      border-color 180ms ease,
      box-shadow 180ms ease;
  }

  .card:hover,
  .card:focus-visible {
    transform: translateY(-2px);
    border-color: var(--accent);
    box-shadow: var(--shadow-hover);
  }

  .media {
    position: relative;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    background: var(--surface-2);
  }

  .media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 400ms ease;
  }

  .card:hover .media img {
    transform: scale(1.03);
  }

  .placeholder {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: var(--border-strong);
    background: var(--surface-2);
  }

  .placeholder .initial {
    position: absolute;
    font-family: var(--font-sans);
    font-size: 8rem;
    font-weight: 700;
    line-height: 1;
    opacity: 0.06;
    transform: translateY(6px);
  }

  .top-badges {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .rank,
  .extinct,
  .cons {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px;
    border-radius: 2px;
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .rank {
    color: #fff;
    background: #333;
    border: 1px solid #333;
  }

  .extinct {
    color: #fff;
    background: #900000;
    border: 1px solid #900000;
  }

  .cons {
    position: absolute;
    right: 10px;
    bottom: 10px;
    z-index: 2;
    color: var(--c);
    background: color-mix(in srgb, var(--c) 12%, var(--surface));
    border: 1px solid color-mix(in srgb, var(--c) 35%, var(--surface));
    letter-spacing: 0.03em;
  }

  .cons .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px 16px 15px;
  }

  .names {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .sci {
    font-family: var(--font-sans);
    font-size: 1.08rem;
    font-weight: 700;
    font-style: italic;
    line-height: 1.25;
    letter-spacing: -0.2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .common {
    color: var(--muted);
    font-size: 0.82rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--faint);
    font-size: 0.75rem;
  }

  .obs {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--text-soft);
  }

  .obs-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent);
  }

  .sep {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--border);
  }

  .group {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .go {
    margin-left: auto;
    color: var(--faint);
    opacity: 0;
    transform: translate(-3px, 3px);
    transition:
      opacity 180ms ease,
      transform 180ms ease;
  }

  .card:hover .go,
  .card:focus-visible .go {
    opacity: 1;
    transform: translate(0, 0);
    color: var(--accent);
  }
</style>

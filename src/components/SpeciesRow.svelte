<script>
  import { formatNumber } from '../lib/utils.js';
  import Icon from './Icon.svelte';

  let { taxon, count = taxon.observations, label = '' } = $props();
</script>

<a class="species-row" href="#/taxon/{taxon.id}">
  <span class="thumb">
    {#if taxon.photo}
      <img src={taxon.photo} alt="" loading="lazy" decoding="async" />
    {:else}
      <Icon name="leaf" size={17} />
    {/if}
  </span>

  <span class="copy">
    <span class="sci">{taxon.name}</span>
    <span class="common">{taxon.commonName || label}</span>
  </span>

  <span class="count">{formatNumber(count)}</span>
  <Icon name="chevron-right" size={14} />
</a>

<style>
  .species-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 6px;
    border-bottom: 1px solid var(--border);
    transition: background 150ms ease;
  }

  .species-row:last-child {
    border-bottom: 0;
  }

  .species-row:hover {
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

  .copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.25;
  }

  .sci {
    overflow: hidden;
    font-size: 0.9rem;
    font-style: italic;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .common {
    overflow: hidden;
    color: var(--muted);
    font-size: 0.72rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .count {
    margin-left: auto;
    color: var(--text-soft);
    font-size: 0.76rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .species-row > :global(svg) {
    flex: 0 0 auto;
    color: var(--faint);
  }
</style>

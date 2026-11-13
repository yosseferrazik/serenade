<script>
  import { t } from '../lib/i18n.svelte.js';
  import { MAP_HEIGHT, MAP_WIDTH, PROVINCE_SHAPES, projectPoint } from '../lib/catalonia-map.js';
  import { groupLabel } from '../lib/utils.js';

  let { points = [], label = '', legend = false, emptyLabel = '' } = $props();

  const COLORS = {
    Animalia: '#c00000',
    Mammalia: '#c00000',
    Aves: '#006db5',
    Reptilia: '#3f7200',
    Amphibia: '#7320c2',
    Actinopterygii: '#00838f',
    Insecta: '#b7950f',
    Arachnida: '#6e6e6e',
    Mollusca: '#bc5000',
    Plantae: '#2e7d32',
    Fungi: '#8d6e63',
    Protozoa: '#7320c2',
    Chromista: '#8d6e63',
    Bacteria: '#6e6e6e',
    Viruses: '#6e6e6e',
  };

  function colorFor(group) {
    return COLORS[group] ?? '#333333';
  }

  let dots = $derived(
    points
      .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
      .map((point) => {
        const [x, y] = projectPoint(point.lat, point.lng);
        return { ...point, x, y };
      }),
  );

  let legendItems = $derived.by(() => {
    const counts = new Map();
    for (const point of dots) {
      const key = point.group || 'other';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 9)
      .map(([group, count]) => ({
        group,
        count,
        color: colorFor(group),
        label: group === 'other' ? t('group.generic') : groupLabel(group),
      }));
  });
</script>

<div class="map">
  <svg viewBox="0 0 {MAP_WIDTH} {MAP_HEIGHT}" role="img" aria-label={label}>
    <g class="land">
      {#each PROVINCE_SHAPES as province (province.code)}
        <path class="province" d={province.path} />
      {/each}
    </g>

    <g class="labels" aria-hidden="true">
      {#each PROVINCE_SHAPES as province (province.code)}
        <text class="province-label" x={province.label[0]} y={province.label[1]}>
          {t(`territory.province.${province.code}`)}
        </text>
      {/each}
    </g>

    <g class="points">
      {#each dots as dot, index (dot.observationId ?? `${dot.taxonId}-${index}`)}
        <a
          class="map-point"
          href="#/taxon/{dot.taxonId}"
          style="--c: {colorFor(dot.group)}"
          aria-label={dot.commonName || dot.name}
        >
          <circle cx={dot.x} cy={dot.y} r="3.2" />
          <title>
            {dot.name}{dot.commonName ? ` · ${dot.commonName}` : ''}{dot.observedOn
              ? ` · ${dot.observedOn}`
              : ''}
          </title>
        </a>
      {/each}
    </g>
  </svg>

  {#if legend && legendItems.length > 0}
    <ul class="legend">
      {#each legendItems as item (item.group)}
        <li>
          <span class="swatch" style="--c: {item.color}"></span>
          <span>{item.label}</span>
          <span class="legend-count">{item.count}</span>
        </li>
      {/each}
    </ul>
  {/if}

  {#if dots.length === 0 && emptyLabel}
    <p class="empty">{emptyLabel}</p>
  {/if}
</div>

<style>
  .map {
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .province {
    fill: var(--surface-2);
    stroke: var(--border-strong);
    stroke-width: 0.8;
    vector-effect: non-scaling-stroke;
  }

  .province-label {
    fill: var(--faint);
    font-family: var(--font-sans);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-anchor: middle;
    text-transform: uppercase;
    pointer-events: none;
  }

  .map-point circle {
    fill: var(--c);
    stroke: var(--surface);
    stroke-width: 1;
    opacity: 0.82;
    transition:
      opacity 150ms ease,
      stroke-width 150ms ease;
  }

  .map-point:hover circle,
  .map-point:focus-visible circle {
    stroke: var(--text);
    stroke-width: 1.8;
    opacity: 1;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin: 0;
    padding: 10px 14px 12px;
    border-top: 1px solid var(--border);
    list-style: none;
  }

  .legend li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--muted);
    font-size: 0.72rem;
  }

  .swatch {
    width: 8px;
    height: 8px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: var(--c);
  }

  .legend-count {
    color: var(--faint);
    font-variant-numeric: tabular-nums;
  }

  .empty {
    margin: 0;
    padding: 14px;
    border-top: 1px solid var(--border);
    color: var(--muted);
    font-size: 0.82rem;
  }
</style>

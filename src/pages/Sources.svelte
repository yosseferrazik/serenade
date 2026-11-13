<script>
  import { onMount } from 'svelte';
  import { clearCache, getCacheInfo } from '../lib/api.js';
  import { getLocale, i18n, t } from '../lib/i18n.svelte.js';
  import { PIPELINE, SOURCES } from '../lib/sources.js';
  import Icon from '../components/Icon.svelte';

  let info = $state(getCacheInfo());
  let cleared = $state(false);
  const bdbcUrl = SOURCES.find((source) => source.id === 'bdbc')?.url ?? '#';

  onMount(() => refresh());

  function refresh() {
    info = getCacheInfo();
    cleared = false;
  }

  function clear() {
    clearCache();
    info = getCacheInfo();
    cleared = true;
  }

  function reload() {
    clearCache();
    window.location.reload();
  }

  function timeOf(at) {
    if (!at) return '—';
    return new Intl.DateTimeFormat(getLocale(), {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(at);
  }

  function shortUrl(url) {
    return url.replace('https://api.inaturalist.org/v1', '');
  }

  function cacheLabel() {
    return `${info.size} / ${info.max}`;
  }
</script>

<main class="sources shell">
  <section class="hero">
    <p class="eyebrow"><span class="pip"></span> {t('sources.eyebrow')}</p>
    <h1>{t('sources.title')}</h1>
    <p class="lead">{t('sources.lead')}</p>
  </section>

  <section class="block">
    <div class="section-title">
      <h2>{t('sources.list.title')}</h2>
    </div>

    <div class="source-grid">
      {#each SOURCES as source (source.id)}
        <article class="source-card">
          <div class="source-head">
            <h3>{source.name}</h3>
            <a href={source.url} target="_blank" rel="noreferrer" aria-label={source.name}>
              <Icon name="arrow-up-right" size={14} />
            </a>
          </div>
          <p>{t(source.roleKey)}</p>
          <span class="license">{t(source.licenseKey)}</span>
        </article>
      {/each}
    </div>
  </section>

  <section class="block">
    <div class="section-title">
      <h2>{t('sources.pipeline.title')}</h2>
    </div>
    <p class="block-lead">{t('sources.pipeline.lead')}</p>

    <ol class="pipeline">
      {#each PIPELINE as step, index (step.id)}
        <li>
          <span class="step-number">{String(index + 1).padStart(2, '0')}</span>
          <strong>{t(step.titleKey)}</strong>
          <p>{t(step.copyKey)}</p>
        </li>
      {/each}
    </ol>
  </section>

  <section class="block diagnostics">
    <div class="section-title">
      <h2>{t('sources.diagnostics.title')}</h2>
      <span class="count">{t('sources.diagnostics.hint')}</span>
    </div>

    <div class="diagnostic-grid">
      <div class="diagnostic">
        <span>{t('sources.diagnostics.locale')}</span>
        <strong>{i18n.locale.toUpperCase()}</strong>
      </div>
      <div class="diagnostic">
        <span>{t('sources.diagnostics.cache')}</span>
        <strong>{cacheLabel()}</strong>
      </div>
      <div class="diagnostic">
        <span>{t('sources.diagnostics.ttl')}</span>
        <strong>{Math.round(info.ttl / 60000)} min</strong>
      </div>
      <div class="diagnostic">
        <span>{t('sources.diagnostics.last')}</span>
        <strong>{info.entries.length > 0 ? timeOf(info.entries[0].at) : '—'}</strong>
      </div>
    </div>

    <div class="diagnostic-actions">
      <button type="button" class="button primary" onclick={reload}>
        <Icon name="refresh" size={15} />
        {t('sources.diagnostics.refresh')}
      </button>
      <button type="button" class="button ghost" onclick={clear}>
        {t('sources.diagnostics.clear')}
      </button>
      {#if cleared}
        <span class="cleared" role="status">{t('sources.diagnostics.cleared')}</span>
      {/if}
    </div>

    {#if info.entries.length > 0}
      <div class="entries">
        <h3>{t('sources.diagnostics.entries')}</h3>
        <ul>
          {#each info.entries.slice(0, 8) as entry (entry.url)}
            <li>
              <code title={entry.url}>{shortUrl(entry.url)}</code>
              <span>{timeOf(entry.at)}</span>
            </li>
          {/each}
        </ul>
      </div>
    {:else}
      <p class="muted">{t('sources.diagnostics.none')}</p>
    {/if}
  </section>

  <section class="bdbc">
    <h2>{t('sources.bdbc.title')}</h2>
    <p>{t('sources.bdbc.copy')}</p>
    <a href={bdbcUrl} target="_blank" rel="noreferrer">
      {t('sources.bdbc.link')}
      <Icon name="arrow-up-right" size={14} />
    </a>
  </section>

  <p class="geo-note">
    {t('sources.geo.note')}
    <a href="https://github.com/codeforgermany/click_that_hood" target="_blank" rel="noreferrer"
      >click_that_hood</a
    >.
  </p>
</main>

<style>
  .sources {
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
    font-size: clamp(2.2rem, 5vw, 3.4rem);
    font-weight: 700;
    letter-spacing: -0.7px;
    line-height: 1.08;
  }

  .lead {
    max-width: 700px;
    color: var(--muted);
    font-size: 1rem;
    line-height: 1.65;
  }

  .block {
    margin-top: 28px;
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
    max-width: 780px;
    margin: -4px 0 14px;
    color: var(--muted);
    font-size: 0.86rem;
    line-height: 1.6;
  }

  .source-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
  }

  .source-card {
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 16px 18px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .source-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .source-head h3 {
    font-size: 1rem;
    font-weight: 700;
  }

  .source-head a {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border: 1px solid var(--border);
    border-radius: 2px;
    color: var(--muted);
  }

  .source-head a:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .source-card p {
    color: var(--text-soft);
    font-size: 0.8rem;
    line-height: 1.5;
  }

  .license {
    align-self: flex-start;
    margin-top: auto;
    padding: 2px 6px;
    border: 1px solid var(--border);
    border-radius: 2px;
    color: var(--faint);
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .pipeline {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .pipeline li {
    padding: 16px 18px;
    border: 1px solid var(--border);
    border-top: 3px solid var(--accent);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .step-number {
    display: block;
    margin-bottom: 6px;
    color: var(--accent);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
  }

  .pipeline strong {
    display: block;
    font-size: 0.9rem;
    font-weight: 700;
  }

  .pipeline p {
    margin-top: 4px;
    color: var(--muted);
    font-size: 0.78rem;
    line-height: 1.5;
  }

  .diagnostics {
    padding: 20px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .diagnostic-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
  }

  .diagnostic {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 12px 14px;
    border-right: 1px solid var(--border);
  }

  .diagnostic:last-child {
    border-right: 0;
  }

  .diagnostic span {
    color: var(--muted);
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .diagnostic strong {
    font-size: 1rem;
    font-variant-numeric: tabular-nums;
  }

  .diagnostic-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 9px;
    margin-top: 14px;
  }

  .button {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 14px;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    font-weight: 600;
  }

  .primary {
    border: 1px solid var(--accent);
    color: #ffffff;
    background: var(--accent);
  }

  .primary:hover {
    border-color: #333;
    background: #333;
  }

  .ghost {
    border: 1px solid var(--accent);
    color: var(--accent);
    background: transparent;
  }

  .ghost:hover {
    border-color: #333;
    color: #333;
    background: var(--surface-2);
  }

  .cleared {
    color: var(--muted);
    font-size: 0.76rem;
  }

  .entries {
    margin-top: 18px;
  }

  .entries h3 {
    margin-bottom: 6px;
    color: var(--muted);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .entries ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .entries li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 0;
    border-bottom: 1px solid var(--border);
  }

  .entries li:last-child {
    border-bottom: 0;
  }

  .entries code {
    overflow: hidden;
    color: var(--text-soft);
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 0.7rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .entries li > span {
    flex: 0 0 auto;
    color: var(--faint);
    font-size: 0.68rem;
    font-variant-numeric: tabular-nums;
  }

  .muted {
    color: var(--muted);
    font-size: 0.82rem;
  }

  .bdbc {
    margin-top: 28px;
    padding: 20px;
    border: 1px solid var(--border);
    border-left: 4px solid var(--accent);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .bdbc h2 {
    font-size: 1rem;
    font-weight: 700;
  }

  .bdbc p {
    max-width: 820px;
    margin-top: 5px;
    color: var(--muted);
    font-size: 0.82rem;
    line-height: 1.6;
  }

  .bdbc a {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 10px;
    color: var(--link);
    font-size: 0.8rem;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .bdbc a:hover {
    color: var(--accent);
  }

  .geo-note {
    margin-top: 12px;
    color: var(--faint);
    font-size: 0.72rem;
  }

  .geo-note a {
    color: var(--link);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .geo-note a:hover {
    color: var(--accent);
  }

  @media (max-width: 640px) {
    .hero {
      padding: 20px;
    }

    .diagnostics {
      padding: 14px;
    }

    .diagnostic {
      border-right: 0;
      border-bottom: 1px solid var(--border);
    }

    .diagnostic:last-child {
      border-bottom: 0;
    }

    .block .section-title {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }
  }
</style>

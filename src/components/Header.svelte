<script>
  import { router } from '../lib/router.svelte.js';
  import { i18n, LOCALES, setLocale, t } from '../lib/i18n.svelte.js';
  import Icon from './Icon.svelte';
  import Logo from './Logo.svelte';

  let theme = $state(document.documentElement.dataset.theme || 'light');
  let isHome = $derived(router.path === '/');
  let isTerritory = $derived(router.path === '/territori');
  let isTaxonomy = $derived(router.path === '/taxonomia');

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('serenade-theme', theme);
    } catch {
      /* almacenamiento no disponible */
    }
  }
</script>

<header class="site-header">
  <div class="utility">
    <div class="shell utility-inner">
      <p>{t('header.tagline')}</p>
      <div class="utility-right">
        <p class="utility-meta">{t('header.meta')}</p>
        <div class="languages" role="group" aria-label={t('header.language')}>
          {#each LOCALES as code}
            <button
              type="button"
              class="lang"
              class:active={i18n.locale === code}
              aria-pressed={i18n.locale === code}
              title={t(`header.language.${code}`)}
              onclick={() => setLocale(code)}
            >
              {code.toUpperCase()}
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <div class="shell main-inner">
    <a class="brand" href="#/" aria-label={t('header.brandAria')}>
      <Logo />
    </a>

    <nav aria-label={t('header.nav.aria')}>
      <a class="navlink" class:active={isHome} href="#/">{t('header.nav.catalog')}</a>
      <a class="navlink" class:active={isTerritory} href="#/territori"
        >{t('header.nav.territory')}</a
      >
      <a class="navlink" class:active={isTaxonomy} href="#/taxonomia"
        >{t('header.nav.taxonomy')}</a
      >
      <a
        class="navlink external"
        href="https://www.inaturalist.org"
        target="_blank"
        rel="noreferrer"
      >
        iNaturalist
        <Icon name="arrow-up-right" size={13} />
      </a>
      <button
        class="theme"
        type="button"
        onclick={toggleTheme}
        aria-label={theme === 'dark' ? t('header.theme.toLight') : t('header.theme.toDark')}
        title={theme === 'dark' ? t('header.theme.light') : t('header.theme.dark')}
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
      </button>
    </nav>
  </div>
</header>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 50;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    box-shadow: var(--shadow);
  }

  .utility {
    background: #333;
    color: #ddd;
    font-size: 0.75rem;
  }

  .utility-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    height: 32px;
  }

  .utility-inner p {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .utility-meta {
    color: #b3b3b3;
  }

  .utility-right {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 0 0 auto;
  }

  .languages {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .lang {
    min-height: 26px;
    padding: 4px 6px;
    border: 0;
    border-bottom: 2px solid transparent;
    color: #dddddd;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    line-height: 1.4;
    background: transparent;
    transition:
      color 150ms ease,
      border-color 150ms ease;
  }

  .lang:hover {
    color: #ffffff;
  }

  .lang.active {
    border-bottom-color: #f1c40f;
    color: #ffffff;
    font-weight: 700;
  }

  .main-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    height: 76px;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    min-width: 0;
  }

  nav {
    display: flex;
    align-items: stretch;
    align-self: stretch;
  }

  .navlink {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 100%;
    padding: 0 14px;
    color: var(--text-soft);
    font-size: 0.875rem;
    font-weight: 600;
    transition: color 150ms ease;
  }

  .navlink:hover {
    color: var(--accent);
  }

  .navlink.active {
    color: var(--text);
  }

  .navlink.active::after {
    content: '';
    position: absolute;
    right: 12px;
    bottom: -1px;
    left: 12px;
    height: 3px;
    background: var(--accent);
  }

  .theme {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    align-self: center;
    margin-left: 10px;
    border: 1px solid var(--border-strong);
    border-radius: 2px;
    background: var(--surface);
    color: var(--text-soft);
    transition:
      color 150ms ease,
      border-color 150ms ease,
      background 150ms ease;
  }

  .theme:hover {
    border-color: var(--accent);
    background: var(--surface-2);
    color: var(--accent);
  }

  @media (max-width: 640px) {
    .utility-meta {
      display: none;
    }

    .main-inner {
      flex-wrap: wrap;
      height: auto;
      padding: 8px 0 0;
      gap: 6px;
    }

    .brand {
      flex: 1 1 100%;
    }

    nav {
      width: 100%;
      height: 46px;
      justify-content: space-between;
    }

    .navlink {
      flex: 1;
      justify-content: center;
      padding: 0 9px;
    }
    .navlink.active::after {
      right: 7px;
      left: 7px;
    }

    .navlink.external {
      display: none;
    }

    .theme {
      width: 36px;
      height: 36px;
      margin-left: 4px;
    }
  }

  @media (max-width: 520px) {
    .navlink {
      padding: 0 4px;
      font-size: 0.8rem;
    }

    .theme {
      width: 32px;
      height: 32px;
    }
  }
</style>

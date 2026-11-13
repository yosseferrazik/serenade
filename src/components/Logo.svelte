<script>
  import { t } from '../lib/i18n.svelte.js';

  let { size = 38, inverse = false, compact = false } = $props();
</script>

<span class="logo" class:inverse>
  <svg
    class="mark"
    width={size}
    height={size}
    viewBox="0 0 40 40"
    aria-hidden="true"
    focusable="false"
  >
    <rect width="40" height="40" fill="#f1c40f" />
    <rect y="4" width="40" height="5" fill="#c00000" />
    <rect y="13" width="40" height="5" fill="#c00000" />
    <rect y="22" width="40" height="5" fill="#c00000" />
    <rect y="31" width="40" height="5" fill="#c00000" />
    <rect x="0.5" y="0.5" width="39" height="39" fill="none" stroke="rgba(0, 0, 0, 0.18)" />
  </svg>

  {#if !compact}
    <span class="word">
      <strong>serenade</strong>
      <small>{t('brand.descriptor')}</small>
    </span>
  {/if}
</span>

<style>
  .logo {
    display: inline-flex;
    align-items: center;
    gap: 11px;
    min-width: 0;
  }

  .mark {
    flex: 0 0 auto;
    border-radius: 2px;
  }

  .word {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
  }

  .word strong {
    color: var(--text);
    font-size: 1.3rem;
    font-weight: 700;
    letter-spacing: -0.5px;
  }

  .word small {
    margin-top: 3px;
    color: var(--muted);
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .inverse .word strong {
    color: #fff;
  }

  .inverse .word small {
    color: #ddd;
  }

  @media (max-width: 520px) {
    .word small {
      display: none;
    }
  }
</style>

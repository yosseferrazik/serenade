<script>
  let { name, size = 18, stroke = 1.8, className = '' } = $props();
</script>

<svg
  class={className}
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={stroke}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
>
  {#if name === 'leaf'}
    <path
      d="M20 4C13.4 4.2 7.5 6.4 5.3 11.6c-1.3 3.1.1 6.1 3 7.1 3 1.1 6.4-.5 7.9-3.6C17.9 11.7 18 8 20 4Z"
      fill="currentColor"
      stroke="none"
    />
    <path d="M4 21c2.5-6.6 6.6-11.2 12.8-14.1" stroke="var(--accent-ink, #0a0e0b)" stroke-width="1.9" />
  {:else if name === 'search'}
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  {:else if name === 'x'}
    <path d="m6 6 12 12M18 6 6 18" />
  {:else if name === 'sun'}
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  {:else if name === 'moon'}
    <path d="M20 14.4A8.4 8.4 0 0 1 9.6 4a8.4 8.4 0 1 0 10.4 10.4Z" />
  {:else if name === 'arrow-left'}
    <path d="M19 12H5M11 18l-6-6 6-6" />
  {:else if name === 'arrow-right'}
    <path d="M5 12h14M13 6l6 6-6 6" />
  {:else if name === 'arrow-up-right'}
    <path d="M7 17 17 7M8 7h9v9" />
  {:else if name === 'chevron-down'}
    <path d="m6 9 6 6 6-6" />
  {:else if name === 'chevron-right'}
    <path d="m9 6 6 6-6 6" />
  {:else if name === 'database'}
    <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
    <path d="M4.5 5.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" />
    <path d="M4.5 11.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" />
  {:else if name === 'book'}
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
    <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
  {:else if name === 'globe'}
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.3 2.3 3.5 5.2 3.5 8.5S14.3 18.2 12 20.5c-2.3-2.3-3.5-5.2-3.5-8.5S9.7 5.8 12 3.5Z" />
  {:else if name === 'alert'}
    <path d="M12 3 2.8 19.5h18.4L12 3Z" />
    <path d="M12 9v4.5M12 17h.01" />
  {:else if name === 'refresh'}
    <path d="M20 11a8 8 0 1 0-2.3 6.3" />
    <path d="M20 4v7h-7" />
  {:else if name === 'image'}
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="m4 17 5.2-5.2a2 2 0 0 1 2.8 0L20 19" />
  {:else if name === 'sparkle'}
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z" />
  {:else if name === 'filter'}
    <path d="M4 6h16M7 12h10M10 18h4" />
  {:else if name === 'check'}
    <path d="m4.5 12.5 5 5 10-11" />
  {/if}
</svg>

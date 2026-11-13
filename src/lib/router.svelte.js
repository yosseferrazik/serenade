export const router = $state({
  path: '/',
  query: {},
});

function read() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  router.path = path || '/';
  router.query = Object.fromEntries(new URLSearchParams(qs || ''));
}

export function initRouter() {
  if (!window.location.hash) {
    window.history.replaceState(null, '', '#/');
  }
  read();
  window.addEventListener('hashchange', read);
  return () => window.removeEventListener('hashchange', read);
}

export function navigate(to) {
  window.location.hash = to.startsWith('/') ? to : `/${to}`;
}

export function replace(to) {
  window.history.replaceState(null, '', `#${to.startsWith('/') ? to : `/${to}`}`);
  read();
}

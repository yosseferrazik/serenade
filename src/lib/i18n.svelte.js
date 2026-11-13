import es from './messages/es.js';
import ca from './messages/ca.js';
import en from './messages/en.js';

const messages = { es, ca, en };

export const LOCALES = ['es', 'ca', 'en'];

const FALLBACK = 'ca';
const STORAGE_KEY = 'serenade-locale';

function detectLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (LOCALES.includes(stored)) return stored;
  } catch {
    /* almacenamiento no disponible */
  }

  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const language of languages) {
    const code = String(language).slice(0, 2).toLowerCase();
    if (LOCALES.includes(code)) return code;
  }

  return FALLBACK;
}

export const i18n = $state({ locale: detectLocale() });

function applyDocumentLang(locale) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
}

applyDocumentLang(i18n.locale);

export function setLocale(locale) {
  if (!LOCALES.includes(locale) || locale === i18n.locale) return;
  i18n.locale = locale;
  applyDocumentLang(locale);
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* almacenamiento no disponible */
  }
}

export function getLocale() {
  return i18n.locale;
}

function interpolate(text, params) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value === undefined || value === null ? match : String(value);
  });
}

export function t(key, params) {
  const dictionary = messages[i18n.locale] ?? messages[FALLBACK];
  const text = dictionary[key] ?? messages[FALLBACK][key] ?? key;
  return interpolate(text, params);
}

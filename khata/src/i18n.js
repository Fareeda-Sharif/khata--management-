import { useSyncExternalStore } from "react";
import en from "./locales/en.json";
import ur from "./locales/ur.json";

// Default language when nothing is saved yet: "en" or "ur"
export const DEFAULT_LANG = "en";
const STORAGE_KEY = "khata-lang";

export const LANGS = {
  en: { label: "English", dir: "ltr", html: "en" },
  ur: { label: "اردو", dir: "rtl", html: "ur" },
};
const DICTS = { en, ur };

const readStored = () => {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && LANGS[v]) return v;
  } catch { /* storage unavailable */ }
  return DEFAULT_LANG;
};

let current = typeof window !== "undefined" ? readStored() : DEFAULT_LANG;
const listeners = new Set();

const lookup = (dict, key) => key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), dict);

// t("customers.title") ya t("khata.errLine", { n: 2, fields: "..." })
export function t(key, params) {
  let s = lookup(DICTS[current], key);
  if (typeof s !== "string") s = lookup(DICTS.en, key);
  if (typeof s !== "string") return key;
  return params ? s.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? params[k] : m)) : s;
}
export const hasKey = (key) => typeof lookup(DICTS.en, key) === "string";
export const getLang = () => current;
export const getDir = () => LANGS[current].dir;

export function applyDocument() {
  if (typeof document === "undefined") return;
  const l = LANGS[current];
  document.documentElement.lang = l.html;
  document.documentElement.dir = l.dir;
  document.documentElement.dataset.lang = current;
}

export function setLang(code) {
  if (!LANGS[code]) return;
  try { window.localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ } // always saved, even if it equals the default
  if (code === current) return;
  current = code;
  applyDocument();
  listeners.forEach((f) => f());
}

const subscribe = (f) => { listeners.add(f); return () => listeners.delete(f); };

// In a component: const { t } = useI18n(); the component re-renders when the language changes
export function useI18n() {
  const lang = useSyncExternalStore(subscribe, getLang, () => DEFAULT_LANG);
  return { t, lang, dir: LANGS[lang].dir, setLang };
}

// Turns a server error (by its code) into text in the current language
export const apiErrorText = (e) => {
  if (!e) return "";
  if (e.code && hasKey(`api.${e.code}`)) return t(`api.${e.code}`);
  return e.message || t("api.unknown");
};

applyDocument();

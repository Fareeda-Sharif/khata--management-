import { LANGS, useI18n } from "../../i18n";
import { cx } from "../../utils/formatting";

// tone="dark" for the sidebar, tone="light" for the login page
export function LanguageSwitcher({ tone = "dark" }) {
  const { t, lang, setLang } = useI18n();
  const dark = tone === "dark";
  return (
    <div role="group" aria-label={t("lang.label")} className={cx("inline-flex flex-wrap rounded-xl p-0.5 text-xs font-semibold", dark ? "bg-white/10" : "bg-slate-100")}>
      {Object.entries(LANGS).map(([code, l]) => (
        <button key={code} type="button" lang={l.html} aria-pressed={lang === code} onClick={() => setLang(code)}
          className={cx("rounded-lg px-2.5 py-1 transition", lang === code ? (dark ? "bg-white text-emerald-900" : "bg-white text-emerald-800 shadow-sm") : dark ? "text-emerald-100 hover:bg-white/10" : "text-slate-600 hover:bg-white/70")}>
          {l.label}
        </button>
      ))}
    </div>
  );
}

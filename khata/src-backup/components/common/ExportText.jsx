import { useRef, useState } from "react";
import { Button } from "./Button";
import { field } from "./Field";
import { useI18n } from "../../i18n";
import { cx } from "../../utils/formatting";

// Used where a file cannot be downloaded: shows the text so it can be copied
export function ExportText({ name, text }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch { /* fallback below */ }
    if (!ok) { ref.current.select(); try { ok = document.execCommand("copy"); } catch { /* ignore */ } }
    setCopied(ok);
  };
  return (
    <>
      <h2 className="mb-1 pe-6 text-lg font-bold" dir="ltr">{name}</h2>
      <p className="mb-3 text-sm text-slate-500">{t("export.note", { name })}</p>
      <textarea ref={ref} readOnly dir="ltr" rows={10} value={text} onFocus={(e) => e.target.select()} className={cx(field, "font-mono text-xs")} />
      <div className="mt-4 flex justify-end"><Button onClick={copy}>{copied ? t("export.copied") : t("export.copy")}</Button></div>
    </>
  );
}

import { useState } from "react";
import { Download, FileDown, Printer } from "lucide-react";
import { useI18n } from "../../i18n";
import { downloadPdf, printDoc } from "../../services/documents/exportDoc";
import { Button } from "../common/Button";

// Download PDF = a real generated PDF file. Print = the browser print dialog. Save as PDF = print dialog with a hint.
export function DocButtons({ build, filename, onCsv, className = "" }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const pdf = async () => {
    setBusy(true); setMsg(null);
    try { await downloadPdf(build(), filename); } catch (e) { console.error(e); setMsg({ err: true, text: t("doc.pdfFailed") }); } finally { setBusy(false); }
  };
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Button onClick={pdf} disabled={busy}><Download size={16} />{busy ? t("doc.generating") : t("doc.downloadPdf")}</Button>
      <Button v="o" onClick={() => printDoc(build())}><Printer size={16} />{t("common.print")}</Button>
      <Button v="o" onClick={() => { setMsg({ text: t("doc.saveAsPdfHint") }); printDoc(build()); }}><FileDown size={16} />{t("doc.savePdf")}</Button>
      {onCsv && <Button v="o" onClick={onCsv}><Download size={16} />{t("common.csvExport")}</Button>}
      {msg && <span className={`text-xs ${msg.err ? "text-rose-600" : "text-slate-500"}`}>{msg.text}</span>}
    </div>
  );
}

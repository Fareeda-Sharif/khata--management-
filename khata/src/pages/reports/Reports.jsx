import { useState } from "react";
import { Card } from "../../components/common/Card";
import { DocTables } from "../../components/common/DocTables";
import { Input } from "../../components/common/Field";
import { DocButtons } from "../../components/documents/DocButtons";
import { PageHeader } from "../../components/layout/PageHeader";
import { useI18n } from "../../i18n";
import { REPORT_KEYS, buildReportDoc, reportTitle } from "../../services/documents/builders";
import { exportCsv } from "../../services/documents/exportDoc";
import { ago, cx, today } from "../../utils/formatting";
import { BackupRestore } from "./BackupRestore";
import { ShopSettings } from "./ShopSettings";

const RANGED = ["transactions", "payments", "dateWise"];

export function Reports({ db, setDb, upd, toast }) {
  const { t } = useI18n();
  const [key, setKey] = useState("outstanding"), [from, setFrom] = useState(ago(30)), [to, setTo] = useState(today());
  const ranged = RANGED.includes(key);
  const doc = buildReportDoc(db, key, ranged ? { from, to } : {});
  const file = `report-${key}-${today()}`;
  return (
    <>
      <PageHeader>{t("reports.title")}</PageHeader>
      <Card>
        <div className="mb-4 flex flex-wrap gap-2">
          {REPORT_KEYS.map((k) => (
            <button key={k} onClick={() => setKey(k)} aria-pressed={key === k} className={cx("rounded-full px-4 py-1.5 text-sm font-medium transition", key === k ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{reportTitle(k)}</button>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-2">
            {ranged && <><div className="w-40"><Input label={t("reports.from")} type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div><div className="w-40"><Input label={t("reports.to")} type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div></>}
          </div>
          <DocButtons build={() => doc} filename={`${file}.pdf`} onCsv={() => exportCsv(doc, `${file}.csv`)} />
        </div>
        {key === "summary" && <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{doc.header.map(([l, v]) => <div key={l} className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">{l}</div><div className="text-lg font-bold tabular-nums"><bdi>{v}</bdi></div></div>)}</div>}
        <DocTables doc={doc} />
      </Card>
      <ShopSettings key={JSON.stringify(db.settings)} db={db} upd={upd} toast={toast} />
      <BackupRestore db={db} setDb={setDb} toast={toast} />
    </>
  );
}

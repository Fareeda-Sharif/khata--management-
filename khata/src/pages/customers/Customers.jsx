import { useState } from "react";
import { Plus, Search, Pencil, Archive, FileText } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { DataTable, Due, EmptyState, Td } from "../../components/common/DataTable";
import { field } from "../../components/common/Field";
import { Ltr } from "../../components/common/Ltr";
import { PageHeader } from "../../components/layout/PageHeader";
import { useI18n } from "../../i18n";
import { bal, cust } from "../../utils/calculations";
import { cx } from "../../utils/formatting";
import { applyChanges } from "../../utils/transactions";
import { CustomerForm } from "./CustomerForm";

export function Customers({ db, upd, open, close, toast, go }) {
  const { t } = useI18n();
  const [q, setQ] = useState(""), [showA, setShowA] = useState(false);
  const L = db.customers.filter((c) => (showA || !c.arch) && (c.name + c.cnic + c.phone).toLowerCase().includes(q.toLowerCase()));
  const form = (init) => open(<CustomerForm db={db} init={init} upd={upd} close={close} toast={toast} />);
  const ledger = (c) => go("ledger", { cnic: c.cnic });
  return (
    <>
      <PageHeader action={<Button onClick={() => form()}><Plus size={16} />{t("customers.add")}</Button>}>{t("customers.title")}</PageHeader>
      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-4">
          <div className="relative w-full max-w-xs"><Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} dir={q ? "auto" : undefined} placeholder={t("customers.searchPlaceholder")} aria-label={t("customers.searchPlaceholder")} className={cx(field, "mt-0 ps-9")} /></div>
          <label className="flex items-center gap-2 text-sm text-slate-500"><input type="checkbox" checked={showA} onChange={(e) => setShowA(e.target.checked)} className="accent-emerald-600" />{t("customers.showArchived")}</label>
        </div>
        <DataTable head={[t("customers.colCnic"), t("common.name"), t("common.phone"), t("common.address"), t("customers.colBalance"), ""]} right={[4, 5]}>
          {L.map((c) => (
            <tr key={c.cnic} className={c.arch ? "opacity-60" : ""}>
              <Td className="font-mono text-xs"><Ltr>{c.cnic}</Ltr></Td>
              <Td className="font-medium"><button type="button" onClick={() => ledger(c)} title={t("customers.openLedger")} className="flex items-center gap-2 font-semibold text-emerald-700 hover:underline">{c.photo && <img src={c.photo} alt="" className="h-6 w-6 rounded-full object-cover" />}<bdi>{c.name}</bdi></button>{c.arch && <span className="text-xs text-slate-400"> ({t("common.archived")})</span>}</Td>
              <Td><Ltr>{c.phone}</Ltr></Td><Td className="max-w-[200px] truncate"><bdi>{c.address}</bdi></Td>
              <Td r><Due v={bal(db, c.cnic)} /></Td>
              <Td r><div className="flex justify-end gap-1">
                <Button v="g" title={t("customers.openLedger")} aria-label={t("customers.openLedger")} onClick={() => ledger(c)}><FileText size={16} /></Button>
                <Button v="g" title={t("common.edit")} aria-label={t("common.edit")} onClick={() => form(c)}><Pencil size={16} /></Button>
                <Button v="g" title={c.arch ? t("common.restore") : t("common.archive")} aria-label={c.arch ? t("common.restore") : t("common.archive")} onClick={() => upd((d) => { const k = cust(d, c.cnic); applyChanges(k, { arch: !k.arch }, k.arch ? "restore" : "archive"); return d; })}><Archive size={16} /></Button>
              </div></Td>
            </tr>
          ))}
          {!L.length && <EmptyState cols={6} text={t("customers.empty")} />}
        </DataTable>
      </Card>
    </>
  );
}

import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Pencil, Plus, Wallet } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Ltr } from "../../components/common/Ltr";
import { DocButtons } from "../../components/documents/DocButtons";
import { PageHeader } from "../../components/layout/PageHeader";
import { useI18n } from "../../i18n";
import { buildLedgerDoc } from "../../services/documents/builders";
import { exportCsv } from "../../services/documents/exportDoc";
import { buildLedger, filterRows, presetRange, statementFor } from "../../utils/ledger";
import { cx, fmtNum, rs } from "../../utils/formatting";
import { CustomerForm } from "../customers/CustomerForm";
import { AddTransactionForm } from "./AddTransactionForm";
import { LedgerFilters } from "./LedgerFilters";
import { LedgerSummary } from "./LedgerSummary";
import { LedgerTable } from "./LedgerTable";
import { TransactionDetail } from "./TransactionDetail";

const Fact = ({ label, children }) => <div className="min-w-0"><div className="text-xs text-slate-400">{label}</div><div className="truncate text-sm font-semibold text-slate-800">{children || "–"}</div></div>;

export function CustomerLedger({ db, upd, params, go, open, close, toast }) {
  const { t } = useI18n();
  const cnic = params.cnic;
  const L = useMemo(() => buildLedger(db, cnic), [db, cnic]);
  const c = L.customer;
  const [flt, setFlt] = useState({ preset: "all", from: "", to: "", kind: "", method: "", search: "" });
  if (!c) return <Card><p className="text-sm text-slate-500">{t("ledger.notFound")}</p><Button className="mt-3" onClick={() => go("cust")}>{t("ledger.back")}</Button></Card>;

  const range = flt.preset === "custom" ? { from: flt.from, to: flt.to } : presetRange(flt.preset);
  const filters = { ...range, kind: flt.kind, method: flt.method, search: flt.search };
  const st = statementFor(L, range);
  const rows = filterRows(st.rows, filters);
  const S = L.summary;
  const firstTx = L.rows[0]?.date;
  const registered = c.createdAt ? c.createdAt.slice(0, 10) : firstTx || "";
  const buildDoc = () => buildLedgerDoc(db, cnic, filters);
  const fileBase = `ledger-${cnic}-${new Date().toISOString().slice(0, 10)}`;

  return (
    <>
      <PageHeader action={<Button v="o" onClick={() => go("cust")}><ArrowLeft size={16} className="rtl:rotate-180" />{t("ledger.back")}</Button>}>{t("ledger.title")}</PageHeader>

      <Card>
        <div className="flex flex-wrap items-start gap-5">
          {c.photo ? <img src={c.photo} alt="" className="h-20 w-20 rounded-2xl object-cover" /> : <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-3xl font-bold text-emerald-700">{Array.from(c.name.trim())[0] || "?"}</div>}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold"><bdi>{c.name}</bdi></h2>{c.arch && <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{t("common.archived")}</span>}</div>
            <div className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              <Fact label={t("common.phone")}><Ltr>{c.phone}</Ltr></Fact>
              <Fact label={t("doc.cnic")}><Ltr>{c.cnic}</Ltr></Fact>
              <Fact label={t("common.address")}><bdi>{c.address}</bdi></Fact>
              <Fact label={t("doc.registered")}><Ltr>{registered}</Ltr></Fact>
              <Fact label={t("customers.opening")}>{rs(S.opening)}</Fact>
              <Fact label={t("ledger.lastTx")}><Ltr>{S.lastTxDate}</Ltr></Fact>
              <Fact label={t("doc.totalUdhaar")}>{rs(S.totalUdhaar)}</Fact>
              <Fact label={t("doc.totalPayments")}>{rs(S.totalPayments)}</Fact>
              <Fact label={t("ledger.totalPurchases")}>{rs(S.totalPurchases)}</Fact>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-5 py-3 text-center"><div className="text-xs text-slate-500">{t("ledger.outstanding")}</div><div className={cx("text-3xl font-bold tabular-nums", S.balance > 0 ? "text-rose-600" : "text-emerald-600")}>{rs(S.balance)}</div></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <Button onClick={() => go("khata", { cnic })}><BookOpen size={16} />{t("ledger.addUdhaar")}</Button>
          <Button onClick={() => go("pay", { cnic })}><Wallet size={16} />{t("dashboard.receivePayment")}</Button>
          <Button v="o" onClick={() => open(<AddTransactionForm cnic={cnic} />)}><Plus size={16} />{t("ledger.addOther")}</Button>
          <Button v="o" onClick={() => open(<CustomerForm db={db} init={c} upd={upd} close={close} toast={toast} />)}><Pencil size={16} />{t("ledger.editCustomer")}</Button>
        </div>
      </Card>

      <div className="mt-4"><LedgerSummary summary={S} /></div>

      <Card className="mt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">{t("ledger.history")}</h3>
          <DocButtons build={buildDoc} filename={`${fileBase}.pdf`} onCsv={() => exportCsv(buildDoc(), `${fileBase}.csv`)} />
        </div>
        <LedgerFilters value={flt} onChange={setFlt} />
        <p className="mb-2 mt-3 text-xs text-slate-400">{t("ledger.showing", { shown: rows.length, total: L.rows.length })} · {t("ledger.filterNote")}</p>
        <LedgerTable rows={rows} openingAt={st.openingAt} startsAtBeginning={st.startsAtBeginning} onView={(r) => open(<TransactionDetail cnic={cnic} txKey={r.key} />, true)} />
        {(flt.preset !== "all" || flt.kind || flt.method || flt.search) && <p className="mt-3 text-xs text-slate-500">{t("ledger.periodTotals")}: {t("ledger.colUdhaar")} {fmtNum(rows.filter((r) => !r.voided).reduce((a, r) => a + r.udhaar, 0))} · {t("ledger.colPayment")} {fmtNum(rows.filter((r) => !r.voided).reduce((a, r) => a + r.payment, 0))}</p>}
      </Card>
    </>
  );
}

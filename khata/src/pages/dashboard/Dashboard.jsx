import { Users, BookOpen, Wallet, Plus, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { DataTable, Td } from "../../components/common/DataTable";
import { Ltr } from "../../components/common/Ltr";
import { DocButtons } from "../../components/documents/DocButtons";
import { PageHeader } from "../../components/layout/PageHeader";
import { useI18n } from "../../i18n";
import { allTx, buildReportDoc, typeLabel } from "../../services/documents/builders";
import { bal } from "../../utils/calculations";
import { cx, fmtNum, rs, today } from "../../utils/formatting";
import { KIND_TONE } from "../ledger/TransactionDetail";

export function Dashboard({ db, setPage, go }) {
  const { t } = useI18n();
  const act = db.customers.filter((c) => !c.arch), day = today();
  const owe = act.reduce((a, c) => a + Math.max(0, bal(db, c.cnic)), 0);
  const tx = allTx(db).filter((r) => !r.voided);
  const newU = tx.filter((r) => r.date === day).reduce((a, r) => a + r.udhaar, 0);
  const rec = tx.filter((r) => r.date === day).reduce((a, r) => a + r.payment, 0);
  const recent = tx.slice(-8).reverse();
  const stats = [[t("dashboard.totalCustomers"), act.length, Users, "bg-sky-50 text-sky-600"], [t("dashboard.receivable"), rs(owe), ArrowUpRight, "bg-rose-50 text-rose-600"], [t("dashboard.todayCredit"), rs(newU), BookOpen, "bg-amber-50 text-amber-600"], [t("dashboard.todayPayments"), rs(rec), ArrowDownLeft, "bg-emerald-50 text-emerald-600"]];
  return (
    <>
      <PageHeader action={<DocButtons build={() => buildReportDoc(db, "summary")} filename={`dashboard-summary-${day}.pdf`} />}>{t("nav.dashboard")}</PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([l, v, Icon, tone]) => (
          <Card key={l} className="flex items-center gap-4"><div className={cx("grid h-12 w-12 shrink-0 place-items-center rounded-xl", tone)}><Icon size={22} /></div><div><div className="text-xs text-slate-500">{l}</div><div className="text-xl font-bold tabular-nums">{v}</div></div></Card>
        ))}
      </div>
      <div className="my-5 flex flex-wrap gap-3">
        <Button onClick={() => setPage("cust")}><Plus size={16} />{t("dashboard.addCustomer")}</Button>
        <Button onClick={() => setPage("khata")}><BookOpen size={16} />{t("dashboard.newEntry")}</Button>
        <Button v="o" onClick={() => setPage("pay")}><Wallet size={16} />{t("dashboard.receivePayment")}</Button>
      </div>
      <Card>
        <h2 className="mb-2 font-semibold">{t("dashboard.recent")}</h2>
        <DataTable head={[t("common.date"), t("common.customer"), t("dashboard.type"), t("common.amount")]} right={[3]}>
          {recent.map((r) => (
            <tr key={r.key}><Td><Ltr>{r.date}</Ltr></Td><Td><button type="button" onClick={() => go("ledger", { cnic: r.cnic })} className="font-medium text-emerald-700 hover:underline"><bdi>{r.customer}</bdi></button></Td>
              <Td><span className={cx("rounded-full px-2.5 py-0.5 text-xs font-semibold", KIND_TONE[r.kind])}>{typeLabel(r.kind)}</span></Td>
              <Td r className={r.kind === "payment" ? "text-emerald-600" : ""}>{r.kind === "payment" || r.kind === "return" ? "−" : ""}{fmtNum(r.kind === "adjustment" ? Math.abs(r.adj) : r.total)}</Td></tr>
          ))}
        </DataTable>
      </Card>
    </>
  );
}

import { BookOpen, CalendarCheck, Hash, RotateCcw, Scale, Wallet } from "lucide-react";
import { Card } from "../../components/common/Card";
import { Ltr } from "../../components/common/Ltr";
import { useI18n } from "../../i18n";
import { cx, rs } from "../../utils/formatting";

// Always the overall figures for this customer (never affected by filters)
export function LedgerSummary({ summary }) {
  const { t } = useI18n();
  const cards = [
    [t("doc.totalUdhaar"), rs(summary.totalUdhaar), BookOpen, "bg-amber-50 text-amber-600"],
    [t("doc.totalPayments"), rs(summary.totalPayments), Wallet, "bg-emerald-50 text-emerald-600"],
    [t("doc.returnsAdjustments"), `${summary.netAdjustments > 0 ? "+" : ""}${rs(summary.netAdjustments)}`, RotateCcw, "bg-sky-50 text-sky-600"],
    [t("doc.currentBalance"), rs(summary.balance), Scale, summary.balance > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"],
    [t("ledger.txCount"), summary.count, Hash, "bg-slate-100 text-slate-600"],
    [t("ledger.lastPayment"), summary.lastPaymentDate ? <Ltr>{summary.lastPaymentDate}</Ltr> : "–", CalendarCheck, "bg-violet-50 text-violet-600"],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(([label, value, Icon, tone]) => (
        <Card key={label} className="flex items-center gap-3 !p-4"><div className={cx("grid h-11 w-11 shrink-0 place-items-center rounded-xl", tone)}><Icon size={20} /></div><div className="min-w-0"><div className="text-xs text-slate-500">{label}</div><div className="truncate text-lg font-bold tabular-nums">{value}</div></div></Card>
      ))}
    </div>
  );
}

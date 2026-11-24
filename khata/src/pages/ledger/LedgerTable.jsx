import { useState } from "react";
import { ChevronDown, ChevronRight, Eye } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Ltr } from "../../components/common/Ltr";
import { useI18n } from "../../i18n";
import { typeLabel } from "../../services/documents/builders";
import { cx, fmtDateTime, fmtNum } from "../../utils/formatting";
import { methodLabel, unitLabel } from "../../utils/labels";
import { KIND_TONE } from "./TransactionDetail";

const money = (n) => (n ? fmtNum(n) : "–");
const adj = (n) => (n ? `${n > 0 ? "+" : "-"}${fmtNum(Math.abs(n))}` : "–");

// Full history in order. Every row shows the REAL running balance (calculated from all transactions, not only the visible ones).
export function LedgerTable({ rows, openingAt, startsAtBeginning, onView }) {
  const { t } = useI18n();
  const [open, setOpen] = useState({});
  const head = [["", ""], [t("ledger.colDateTime"), ""], [t("ledger.colId"), ""], [t("ledger.colType"), ""], [t("ledger.colDescription"), ""], [t("ledger.colUdhaar"), "end"], [t("ledger.colPayment"), "end"], [t("ledger.colAdj"), "end"], [t("ledger.colBalance"), "end"], ["", ""]];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm tabular-nums">
        <thead><tr className="border-b border-slate-100 text-xs font-semibold text-slate-400">{head.map(([h, a], i) => <th key={i} className={cx("whitespace-nowrap px-2 py-2.5 text-start", a === "end" && "text-end")}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-50">
          <tr className="bg-slate-50/70 font-semibold"><td /><td className="px-2 py-2.5" colSpan={7}>{startsAtBeginning ? t("doc.openingBalance") : t("doc.broughtForward")}</td><td className="px-2 py-2.5 text-end">{fmtNum(openingAt)}</td><td /></tr>
          {rows.map((r) => {
            const hasItems = r.items.length > 0;
            return [
              <tr key={r.key} className={cx("cursor-pointer hover:bg-emerald-50/40", r.voided && "text-slate-400 line-through")} onClick={() => onView(r)}>
                <td className="px-2 py-2.5">{hasItems && <button type="button" aria-label={t("ledger.items")} onClick={(e) => { e.stopPropagation(); setOpen((s) => ({ ...s, [r.key]: !s[r.key] })); }} className="rounded p-0.5 text-slate-400 hover:bg-slate-100">{open[r.key] ? <ChevronDown size={16} /> : <ChevronRight size={16} className="rtl:rotate-180" />}</button>}</td>
                <td className="whitespace-nowrap px-2 py-2.5"><Ltr>{fmtDateTime(r.date, r.createdAt)}</Ltr></td>
                <td className="whitespace-nowrap px-2 py-2.5 font-mono text-xs"><Ltr>{r.ref}</Ltr></td>
                <td className="px-2 py-2.5"><span className={cx("whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold", KIND_TONE[r.kind])}>{typeLabel(r.kind)}</span></td>
                <td className="max-w-[260px] px-2 py-2.5"><bdi>{hasItems ? r.items.map((i) => i.name).join(", ") : r.kind === "payment" ? methodLabel(r.method) : r.note || typeLabel(r.kind)}</bdi>{r.note && hasItems ? <span className="block truncate text-xs text-slate-400"><bdi>{r.note}</bdi></span> : null}</td>
                <td className="px-2 py-2.5 text-end">{money(r.udhaar)}</td>
                <td className="px-2 py-2.5 text-end text-emerald-600">{money(r.payment)}</td>
                <td className="px-2 py-2.5 text-end">{adj(r.adj)}</td>
                <td className={cx("px-2 py-2.5 text-end font-semibold", r.balance > 0 ? "text-rose-600" : "text-emerald-600")}>{fmtNum(r.balance)}</td>
                <td className="px-2 py-2.5 text-end"><Button v="g" className="px-2" title={t("common.view")} aria-label={t("common.view")}><Eye size={16} /></Button></td>
              </tr>,
              hasItems && open[r.key] && (
                <tr key={r.key + "i"} className="bg-slate-50/60"><td /><td colSpan={9} className="px-2 pb-3 pt-1">
                  <table className="w-full text-xs"><thead><tr className="text-slate-400">{[t("common.item"), t("common.qty"), t("common.unit"), t("common.rate"), t("common.total")].map((h, i) => <th key={i} className={cx("px-2 py-1 text-start", i === 1 || i > 2 ? "text-end" : "")}>{h}</th>)}</tr></thead>
                    <tbody>{r.items.map((i, k) => <tr key={k}><td className="px-2 py-1"><bdi>{i.name}</bdi></td><td className="px-2 py-1 text-end">{i.qty}</td><td className="px-2 py-1">{unitLabel(i.unit)}</td><td className="px-2 py-1 text-end">{fmtNum(i.price)}</td><td className="px-2 py-1 text-end">{fmtNum(i.qty * i.price)}</td></tr>)}</tbody></table>
                </td></tr>
              ),
            ];
          })}
          {!rows.length && <tr><td colSpan={10} className="px-3 py-8 text-center text-slate-400">{t("ledger.noTx")}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

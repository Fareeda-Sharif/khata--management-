import { useState } from "react";
import { Ban, Pencil, RotateCcw } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Input, Select } from "../../components/common/Field";
import { DocButtons } from "../../components/documents/DocButtons";
import { Ltr } from "../../components/common/Ltr";
import { METHODS } from "../../constants";
import { useApp } from "../../context/AppContext";
import { useI18n } from "../../i18n";
import { buildReceiptDoc, typeLabel } from "../../services/documents/builders";
import { buildLedger } from "../../utils/ledger";
import { cx, fmtDateTime, fmtNum, nowISO, rs } from "../../utils/formatting";
import { methodLabel, unitLabel } from "../../utils/labels";
import { applyChanges } from "../../utils/transactions";

export const KIND_TONE = { purchase: "bg-amber-100 text-amber-800", udhaar: "bg-orange-100 text-orange-800", payment: "bg-emerald-100 text-emerald-700", return: "bg-sky-100 text-sky-700", adjustment: "bg-violet-100 text-violet-700" };

const Row = ({ label, children }) => <div><div className="text-xs text-slate-400">{label}</div><div className="text-sm font-medium text-slate-800">{children || "–"}</div></div>;

// Shows one transaction with live data. Edits keep a history and records are voided, never deleted.
export function TransactionDetail({ cnic, txKey }) {
  const { t } = useI18n();
  const { db, upd, close, toast } = useApp();
  const [mode, setMode] = useState("view"); // view | edit | void
  const L = buildLedger(db, cnic);
  const tx = L.rows.find((r) => r.key === txKey);
  const c = L.customer;
  const [f, setF] = useState(null);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState(null);
  if (!tx) return <p className="text-sm text-slate-500">{t("ledger.notFound")}</p>;
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const linked = L.rows.filter((r) => r.kind === "payment" && r.entryId === tx.id && tx.kind === "purchase");

  const recOf = (d) => (tx.source === "entry" ? d.entries : tx.source === "payment" ? d.payments : d.misc).find((x) => x.id === tx.id);
  const startEdit = () => { setF({ date: tx.date, note: tx.note, amount: tx.total, method: tx.method || "Cash", paid: tx.paid, paidMethod: tx.method || "Cash", direction: tx.direction || "decrease" }); setErr(null); setMode("edit"); };
  const saveEdit = () => {
    if (!f.date) return setErr("ledger.errDate");
    if (tx.source !== "entry" && !(+f.amount > 0)) return setErr("ledger.errAmount");
    if (tx.source === "entry" && (+f.paid < 0 || +f.paid > tx.total)) return setErr("khata.errPaidTooMuch");
    const changes = tx.source === "entry" ? { date: f.date, note: f.note, paid: +f.paid || 0, paidMethod: f.paidMethod }
      : tx.source === "payment" ? { date: f.date, note: f.note, amount: +f.amount, method: f.method }
      : { date: f.date, note: f.note, amount: +f.amount, ...(tx.kind === "adjustment" ? { direction: f.direction } : {}) };
    upd((d) => { const rec = recOf(d); if (rec) applyChanges(rec, changes, "edit"); return d; });
    toast(t("ledger.toastUpdated")); setMode("view");
  };
  const doVoid = () => {
    upd((d) => { const rec = recOf(d); if (rec) applyChanges(rec, { voided: true, voidReason: reason.trim(), voidedAt: nowISO() }, "void", reason.trim()); return d; });
    toast(t("ledger.toastVoided")); setMode("view");
  };
  const restore = () => { upd((d) => { const rec = recOf(d); if (rec) applyChanges(rec, { voided: false, voidReason: "" }, "restore"); return d; }); toast(t("ledger.toastRestored")); };

  const doc = () => buildReceiptDoc(db, tx);
  const fieldName = (k) => (["date", "note", "amount", "method", "paid", "paidMethod", "direction", "voided", "voidReason", "voidedAt"].includes(k) ? t(`ledger.field.${k}`) : k);
  const showVal = (k, v) => (v === null || v === undefined || v === "" ? "–" : k === "voided" ? (v ? t("ledger.voided") : t("ledger.valid")) : k === "method" || k === "paidMethod" ? methodLabel(v) : String(v));

  if (mode === "edit") {
    return (
      <>
        <h2 className="mb-4 pe-6 text-lg font-bold">{t("ledger.editTx")} <Ltr>{tx.ref}</Ltr></h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label={t("common.date")} type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
          {tx.source === "entry" ? (
            <>
              <Input label={t("ledger.paid")} type="number" min="0" value={f.paid} onChange={(e) => set("paid", e.target.value)} />
              <Select label={t("common.method")} value={f.paidMethod} onChange={(e) => set("paidMethod", e.target.value)}>{METHODS.map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}</Select>
            </>
          ) : (
            <>
              <Input label={t("common.amount")} type="number" min="1" value={f.amount} onChange={(e) => set("amount", e.target.value)} />
              {tx.source === "payment" && <Select label={t("common.method")} value={f.method} onChange={(e) => set("method", e.target.value)}>{METHODS.map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}</Select>}
              {tx.kind === "adjustment" && <Select label={t("ledger.direction")} value={f.direction} onChange={(e) => set("direction", e.target.value)}><option value="increase">{t("ledger.increase")}</option><option value="decrease">{t("ledger.decrease")}</option></Select>}
            </>
          )}
          <div className="sm:col-span-2"><Input label={t("common.note")} value={f.note} onChange={(e) => set("note", e.target.value)} /></div>
        </div>
        <p className="mt-2 text-xs text-slate-400">{t("ledger.editNote")}</p>
        {err && <p className="mt-3 text-sm text-rose-600">{t(err)}</p>}
        <div className="mt-5 flex justify-end gap-2"><Button v="g" onClick={() => setMode("view")}>{t("common.cancel")}</Button><Button onClick={saveEdit}>{t("common.save")}</Button></div>
      </>
    );
  }
  if (mode === "void") {
    return (
      <>
        <h2 className="mb-2 pe-6 text-lg font-bold">{t("ledger.voidTitle")} <Ltr>{tx.ref}</Ltr></h2>
        <p className="mb-3 text-sm text-slate-600">{t("ledger.voidExplain")}</p>
        <Input label={t("ledger.voidReason")} value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="mt-5 flex justify-end gap-2"><Button v="g" onClick={() => setMode("view")}>{t("common.cancel")}</Button><Button onClick={doVoid} className="bg-rose-600 hover:bg-rose-700"><Ban size={16} />{t("ledger.void")}</Button></div>
      </>
    );
  }
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pe-6">
        <h2 className="text-lg font-bold" dir="ltr">{tx.ref}</h2>
        <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-semibold", KIND_TONE[tx.kind])}>{typeLabel(tx.kind)}</span>
        {tx.voided && <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">{t("ledger.voided")}</span>}
      </div>
      <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
        <Row label={t("common.customer")}><bdi>{c?.name || cnic}</bdi></Row>
        <Row label={t("common.phone")}><Ltr>{c?.phone}</Ltr></Row>
        <Row label={t("doc.cnic")}><Ltr>{cnic}</Ltr></Row>
        <Row label={t("common.address")}><bdi>{c?.address}</bdi></Row>
        <Row label={t("doc.dateTime")}><Ltr>{fmtDateTime(tx.date, tx.createdAt)}</Ltr></Row>
        <Row label={t("common.method")}>{methodLabel(tx.method)}</Row>
        <Row label={t("ledger.created")}><Ltr>{tx.createdAt ? fmtDateTime(tx.createdAt.slice(0, 10), tx.createdAt) : "–"}</Ltr></Row>
        <Row label={t("ledger.updated")}><Ltr>{tx.updatedAt ? fmtDateTime(tx.updatedAt.slice(0, 10), tx.updatedAt) : "–"}</Ltr></Row>
      </div>
      {tx.kind === "purchase" && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-xs text-slate-400">{[t("common.item"), t("common.qty"), t("common.unit"), t("common.rate"), t("common.total")].map((h, i) => <th key={i} className={cx("px-2 py-1.5 text-start", i === 1 || i > 2 ? "text-end" : "")}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">{tx.items.map((i, k) => <tr key={k}><td className="px-2 py-1.5"><bdi>{i.name}</bdi></td><td className="px-2 py-1.5 text-end tabular-nums">{i.qty}</td><td className="px-2 py-1.5">{unitLabel(i.unit)}</td><td className="px-2 py-1.5 text-end tabular-nums">{fmtNum(i.price)}</td><td className="px-2 py-1.5 text-end tabular-nums">{fmtNum(i.qty * i.price)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {tx.kind === "purchase" ? (
          <>
            <Row label={t("common.total")}>{rs(tx.total)}</Row>
            <Row label={t("ledger.paid")}>{rs(tx.paid + tx.linkedPaid)}</Row>
            <Row label={t("ledger.remaining")}><span className={tx.remaining > 0 ? "text-rose-600" : "text-emerald-600"}>{rs(tx.remaining)}</span></Row>
          </>
        ) : (
          <>
            <Row label={t("common.amount")}>{rs(tx.total)}</Row>
            {tx.entryId && <Row label={t("ledger.againstTx")}><Ltr>{`PUR-${String(tx.entryId).padStart(4, "0")}`}</Ltr></Row>}
          </>
        )}
        <Row label={t("ledger.balanceAfter")}>{rs(tx.balance)}</Row>
      </div>
      {tx.note && <div className="mt-3"><Row label={t("common.note")}><bdi>{tx.note}</bdi></Row></div>}
      {tx.voided && tx.voidReason && <div className="mt-3"><Row label={t("ledger.voidReason")}><bdi>{tx.voidReason}</bdi></Row></div>}
      {linked.length > 0 && (
        <div className="mt-4"><div className="mb-1 text-xs font-semibold text-slate-500">{t("ledger.linkedPayments")}</div>
          <ul className="space-y-1 text-sm">{linked.map((p) => <li key={p.key} className={cx("flex justify-between rounded-lg bg-slate-50 px-3 py-1.5", p.voided && "text-slate-400 line-through")}><span><Ltr>{p.ref}</Ltr> · <Ltr>{p.date}</Ltr> · {methodLabel(p.method)}</span><span className="tabular-nums">{rs(p.payment)}</span></li>)}</ul>
        </div>
      )}
      <div className="mt-4"><div className="mb-1 text-xs font-semibold text-slate-500">{t("ledger.history")}</div>
        {tx.history.length ? (
          <ul className="space-y-1 text-xs text-slate-600">{tx.history.map((h, i) => (
            <li key={i} className="rounded-lg bg-slate-50 px-3 py-1.5"><b><Ltr>{fmtDateTime(h.at.slice(0, 10), h.at)}</Ltr></b> — {t(`ledger.act.${h.action}`)}{h.reason ? ` (${h.reason})` : ""}
              {Object.entries(h.changes || {}).filter(([k]) => !["voidedAt", "voided", "voidReason"].includes(k) || h.action === "edit").map(([k, [a, b]]) => <div key={k}>{fieldName(k)}: <bdi>{showVal(k, a)}</bdi> → <bdi>{showVal(k, b)}</bdi></div>)}</li>
          ))}</ul>
        ) : <p className="text-xs text-slate-400">{t("ledger.historyEmpty")}</p>}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <DocButtons build={doc} filename={`receipt-${tx.ref}.pdf`} />
        <span className="ms-auto flex gap-2">
          <Button v="o" onClick={startEdit}><Pencil size={16} />{t("common.edit")}</Button>
          {tx.voided ? <Button v="o" onClick={restore}><RotateCcw size={16} />{t("ledger.restore")}</Button> : <Button v="o" onClick={() => { setReason(""); setMode("void"); }}><Ban size={16} />{t("ledger.void")}</Button>}
        </span>
      </div>
    </>
  );
}

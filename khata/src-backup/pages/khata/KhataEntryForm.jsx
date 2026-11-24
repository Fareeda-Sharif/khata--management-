import { useRef, useState } from "react";
import { Plus, Printer, Save, Trash2, UserPlus } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Input, Select, field } from "../../components/common/Field";
import { DocButtons } from "../../components/documents/DocButtons";
import { DocumentPreview } from "../../components/documents/DocumentPreview";
import { METHODS, UNITS } from "../../constants";
import { useApp } from "../../context/AppContext";
import { getLang, useI18n } from "../../i18n";
import { buildReceiptDoc } from "../../services/documents/builders";
import { printDoc } from "../../services/documents/exportDoc";
import { toHtml } from "../../services/documents/html";
import { cx, fmtNum, rs, today } from "../../utils/formatting";
import { unitLabel, methodLabel } from "../../utils/labels";
import { findTx } from "../../utils/ledger";
import { isDuplicate, stamp } from "../../utils/transactions";
import { LINE_FIELD_KEYS, lineMissing, lineTouched } from "../../utils/validation";
import { CustomerForm } from "../customers/CustomerForm";

const blank = () => ({ name: "", qty: 1, unit: "kg", price: 0 });
export function KhataEntryForm({ db, upd, open, close, toast, prefillCnic }) {
  const { t } = useI18n();
  const { getDb } = useApp();
  const act = db.customers.filter((c) => !c.arch);
  const [cn, setCn] = useState(prefillCnic && act.some((c) => c.cnic === prefillCnic) ? prefillCnic : act[0]?.cnic || ""), [date, setDate] = useState(today()), [note, setNote] = useState("");
  const [lines, setLines] = useState([blank()]), [err, setErr] = useState(null), [tried, setTried] = useState(false); // err: { key, params }
  const [paid, setPaid] = useState(""), [paidMethod, setPaidMethod] = useState("Cash");
  const busy = useRef(false);
  const total = lines.reduce((a, l) => a + l.qty * l.price, 0);
  const setLine = (i, patch) => setLines((L) => L.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const pick = (i, name) => { const it = db.items.find((x) => x.on && x.name === name); setLine(i, it ? { name, unit: it.unit, price: it.price } : { name }); };
  const isNewItem = (name) => name.trim() && !db.items.some((x) => x.name.toLowerCase() === name.trim().toLowerCase());
  const addCustomer = () => open(<CustomerForm db={db} upd={upd} close={close} toast={toast} onSaved={setCn} />);
  const commit = (e, snapshot, print) => {
    if (busy.current) return; // ignore a second click while saving
    busy.current = true; setTimeout(() => { busy.current = false; }, 1500);
    if (isDuplicate(getDb(), "entry", e)) { close(); toast(t("khata.errDuplicate")); return; }
    const fresh = new Set(e.lines.filter((l) => isNewItem(l.name)).map((l) => l.name.toLowerCase())).size;
    upd((d) => {
      d.entries.push(e); d.nid++;
      e.lines.forEach((l) => {
        if (!d.items.some((x) => x.name.toLowerCase() === l.name.toLowerCase())) d.items.push({ id: d.nid++, name: l.name, unit: l.unit || "piece", price: l.price || 0, on: true });
      });
      return d;
    });
    setLines([blank()]); setNote(""); setPaid(""); setErr(null); setTried(false); close();
    toast(fresh ? t("khata.toastSavedItems", { count: fresh }) : t("khata.toastSaved"));
    if (print) printDoc(buildReceiptDoc(snapshot, findTx(snapshot, e.cnic, `e${e.id}`)));
  };
  const flag = (l, k) => (tried && lineTouched(l) && lineMissing(l).includes(k) ? "border-rose-400 ring-2 ring-rose-100" : "");
  const review = () => {
    if (!cn) return setErr({ key: "khata.errCustomerFirst" });
    const used = lines.map((l, i) => ({ l, i })).filter(({ l }) => lineTouched(l));
    if (!used.length) return setErr({ key: "khata.errAtLeastOne" });
    setTried(true);
    const bad = used.find(({ l }) => lineMissing(l).length);
    if (bad) return setErr({ key: "khata.errLine", params: { n: bad.i + 1, fields: lineMissing(bad.l).map((k) => t(LINE_FIELD_KEYS[k])).join(getLang() === "ur" ? "، " : ", ") } });
    const paidNum = +paid || 0;
    if (paidNum < 0 || paidNum > total) return setErr({ key: "khata.errPaidTooMuch" });
    setTried(false); setErr(null);
    const L = used.map(({ l }) => l);
    const e = stamp({ id: db.nid, kind: "purchase", cnic: cn, date, note, paid: paidNum, paidMethod: paidNum > 0 ? paidMethod : "", lines: L.map((l) => ({ ...l, name: l.name.trim() })) });
    const snapshot = { ...db, entries: [...db.entries, e] };
    const doc = buildReceiptDoc(snapshot, findTx(snapshot, cn, `e${e.id}`));
    open(
      <DocumentPreview html={toHtml(doc)} extra={
        <>
          <Button onClick={() => commit(e, snapshot, false)}><Save size={16} />{t("khata.saveBtn")}</Button>
          <Button onClick={() => commit(e, snapshot, true)}><Printer size={16} />{t("khata.saveAndPrint")}</Button>
          <Button v="g" onClick={close}>{t("khata.back")}</Button>
          <DocButtons build={() => doc} filename={`receipt-${doc.header[0][1]}.pdf`} />
        </>} />, true
    );
  };
  return (
    <Card>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Select label={t("common.customer")} value={cn} onChange={(e) => setCn(e.target.value)}>{act.map((c) => <option key={c.cnic} value={c.cnic}>{c.name} ({c.cnic})</option>)}</Select>
          <button type="button" onClick={addCustomer} className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"><UserPlus size={14} />{t("khata.addCustomer")}</button>
        </div>
        <Input label={t("common.date")} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input label={t("khata.noteOptional")} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <datalist id="itemlist">{db.items.filter((i) => i.on).map((i) => <option key={i.id} value={i.name} />)}</datalist>
      <datalist id="units">{UNITS.map((u) => <option key={u} value={u} label={unitLabel(u)} />)}</datalist>
      <div className="mt-5 space-y-2">
        <div className="hidden grid-cols-[2fr_.8fr_1fr_1fr_1fr_36px] gap-2 px-1 text-xs font-medium text-slate-400 md:grid"><span>{t("common.item")}</span><span>{t("common.qty")}</span><span>{t("common.unit")}</span><span>{t("common.rate")}</span><span className="text-end">{t("common.total")}</span><span /></div>
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-2 items-center gap-2 rounded-xl bg-slate-50 p-2 md:grid-cols-[2fr_.8fr_1fr_1fr_1fr_36px] md:bg-transparent md:p-0">
            <input className={cx(field, "mt-0 col-span-2 md:col-span-1", flag(l, "name"))} list="itemlist" dir={l.name ? "auto" : undefined} placeholder={t("khata.itemPlaceholder")} aria-label={t("common.item")} value={l.name} onChange={(e) => pick(i, e.target.value)} />
            <input className={cx(field, "mt-0", flag(l, "qty"))} dir="ltr" aria-label={t("common.qty")} type="number" min="0" step="any" value={l.qty} onChange={(e) => setLine(i, { qty: +e.target.value })} />
            <input className={cx(field, "mt-0", flag(l, "unit"))} list="units" dir={l.unit ? "auto" : undefined} aria-label={t("common.unit")} value={l.unit} onChange={(e) => setLine(i, { unit: e.target.value })} />
            <input className={cx(field, "mt-0", flag(l, "price"))} dir="ltr" aria-label={t("common.rate")} type="number" min="0" step="any" value={l.price} onChange={(e) => setLine(i, { price: +e.target.value })} />
            <div className="text-end text-sm font-semibold tabular-nums">{rs(l.qty * l.price)}</div>
            <Button v="g" className="px-2" onClick={() => setLines((L) => (L.length > 1 ? L.filter((_, j) => j !== i) : L))} aria-label={t("common.remove")} title={t("common.remove")}><Trash2 size={16} /></Button>
            {isNewItem(l.name) && <p className="col-span-2 text-xs text-emerald-700 md:col-span-6">{t("khata.newItemHint")}</p>}
          </div>
        ))}
      </div>
      <Button v="o" className="mt-3" onClick={() => setLines([...lines, blank()])}><Plus size={16} />{t("khata.addItem")}</Button>
      <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
        <Input label={t("khata.paidNow")} type="number" min="0" placeholder="0" value={paid} onChange={(e) => setPaid(e.target.value)} />
        {+paid > 0 && <Select label={t("common.method")} value={paidMethod} onChange={(e) => setPaidMethod(e.target.value)}>{METHODS.map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}</Select>}
        <div className="sm:col-span-2 sm:ms-auto"><div className="text-xs text-slate-400">{t("khata.totalCredit")}</div><div className="text-3xl font-bold tabular-nums text-amber-600">{rs(total)}</div>{+paid > 0 && <div className="text-xs text-slate-500">{t("ledger.remaining")}: {fmtNum(Math.max(0, total - +paid))}</div>}</div>
      </div>
      <div className="mt-3 flex justify-end"><Button onClick={review} className="px-6 py-3">{t("khata.review")}</Button></div>
      {err && <p className="mt-2 text-sm text-rose-600">{t(err.key, err.params)}</p>}
    </Card>
  );
}

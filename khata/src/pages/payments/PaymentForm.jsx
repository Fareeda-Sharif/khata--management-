import { useRef, useState } from "react";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Input, Select } from "../../components/common/Field";
import { METHODS } from "../../constants";
import { useApp } from "../../context/AppContext";
import { useI18n } from "../../i18n";
import { methodLabel } from "../../utils/labels";
import { bal, customerTx, findTx } from "../../utils/ledger";
import { rs, today } from "../../utils/formatting";
import { isDuplicate, stamp } from "../../utils/transactions";

export function PaymentForm({ db, upd, toast, onSaved, prefillCnic }) {
  const { t, dir } = useI18n();
  const { getDb } = useApp();
  const act = db.customers.filter((c) => !c.arch);
  const [f, setF] = useState({ cnic: prefillCnic && act.some((c) => c.cnic === prefillCnic) ? prefillCnic : act[0]?.cnic || "", amount: "", method: "Cash", date: today(), note: "", entryId: "" });
  const [err, setErr] = useState(null); // { key, params }
  const busy = useRef(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const b = f.cnic ? bal(db, f.cnic) : 0;
  // purchases of this customer that still have an unpaid remainder (a payment can be applied to one of them)
  const open_ = f.cnic ? customerTx(db, f.cnic).filter((x) => x.kind === "purchase" && !x.voided && x.remaining > 0) : [];
  const target = open_.find((x) => String(x.id) === String(f.entryId));
  const save = () => {
    const a = +f.amount;
    if (!f.cnic) return setErr({ key: "payments.errSelectCustomer" });
    if (!(a > 0)) return setErr({ key: "payments.errAmount" });
    if (a > b) return setErr({ key: "payments.errTooMuch", params: { balance: rs(b) } });
    if (target && a > target.remaining) return setErr({ key: "payments.errTooMuchTx", params: { remaining: rs(target.remaining) } });
    if (busy.current) return;
    busy.current = true; setTimeout(() => { busy.current = false; }, 1500);
    const rec = stamp({ id: db.nid, cnic: f.cnic, date: f.date, amount: a, method: f.method, note: f.note, ...(target ? { entryId: target.id } : {}) });
    if (isDuplicate(getDb(), "payment", rec)) return setErr({ key: "payments.errDuplicate" });
    upd((d) => { d.payments.push(rec); d.nid++; return d; });
    setF({ ...f, amount: "", note: "", entryId: "" }); setErr(null); toast(t("payments.toastSaved"));
    const snapshot = { ...db, payments: [...db.payments, rec] };
    onSaved(findTx(snapshot, rec.cnic, `p${rec.id}`), snapshot);
  };
  return (
    <Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Select label={t("common.customer")} value={f.cnic} onChange={(e) => setF((s) => ({ ...s, cnic: e.target.value, entryId: "" }))}>{act.map((c) => <option key={c.cnic} value={c.cnic}>{t("payments.customerOption", { name: c.name, amount: rs(bal(db, c.cnic)) })}</option>)}</Select>
        <Input label={t("common.amount")} type="number" min="1" placeholder="0" value={f.amount} onChange={(e) => set("amount", e.target.value)} />
        <Select label={t("common.method")} value={f.method} onChange={(e) => set("method", e.target.value)}>{METHODS.map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}</Select>
        <Input label={t("common.date")} type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
        <Select label={t("payments.againstTx")} value={f.entryId} onChange={(e) => set("entryId", e.target.value)}>
          <option value="">{t("payments.generalPayment")}</option>
          {open_.map((x) => <option key={x.id} value={x.id}>{`${x.ref} · ${x.date} · ${t("ledger.remaining")} ${rs(x.remaining)}`}</option>)}
        </Select>
        <Input label={t("common.note")} value={f.note} onChange={(e) => set("note", e.target.value)} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
        <div className="text-sm text-slate-500">{t("payments.currentBalance")}: <b className="text-rose-600">{rs(b)}</b>{+f.amount > 0 && <> {dir === "rtl" ? "←" : "→"} {t("payments.afterPayment")}: <b className="text-emerald-600">{rs(Math.max(0, b - +f.amount))}</b></>}</div>
        <div className="flex gap-2"><Button v="o" onClick={() => set("amount", Math.max(0, target ? Math.min(b, target.remaining) : b))}>{t("payments.fullAmount")}</Button><Button onClick={save}>{t("payments.save")}</Button></div>
      </div>
      {err && <p className="mt-2 text-sm text-rose-600">{t(err.key, err.params)}</p>}
    </Card>
  );
}

import { useState } from "react";
import { Button } from "../../components/common/Button";
import { Input, Select } from "../../components/common/Field";
import { useApp } from "../../context/AppContext";
import { useI18n } from "../../i18n";
import { today } from "../../utils/formatting";
import { isDuplicate, stamp } from "../../utils/transactions";

// Udhaar (amount only), Return or Adjustment for one customer
export function AddTransactionForm({ cnic }) {
  const { t } = useI18n();
  const { upd, close, toast, getDb } = useApp();
  const [f, setF] = useState({ type: "udhaar", date: today(), amount: "", direction: "decrease", note: "" });
  const [err, setErr] = useState(null);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const save = () => {
    const amount = +f.amount;
    if (!(amount > 0)) return setErr("ledger.errAmount");
    const db = getDb();
    const rec = { type: f.type, cnic, date: f.date, amount, note: f.note.trim(), ...(f.type === "adjustment" ? { direction: f.direction } : {}) };
    if (isDuplicate(db, "misc", rec)) return setErr("ledger.errDuplicate");
    upd((d) => { d.misc.push({ id: d.nid++, ...stamp(rec) }); return d; });
    close(); toast(t("ledger.toastSaved"));
  };
  return (
    <>
      <h2 className="mb-4 pe-6 text-lg font-bold">{t("ledger.addOtherTitle")}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label={t("ledger.txType")} value={f.type} onChange={(e) => set("type", e.target.value)}>
          <option value="udhaar">{t("ledger.typeUdhaarAmount")}</option><option value="return">{t("types.return")}</option><option value="adjustment">{t("types.adjustment")}</option>
        </Select>
        <Input label={t("common.date")} type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
        <Input label={t("common.amount")} type="number" min="1" value={f.amount} onChange={(e) => set("amount", e.target.value)} />
        {f.type === "adjustment" && (
          <Select label={t("ledger.direction")} value={f.direction} onChange={(e) => set("direction", e.target.value)}>
            <option value="increase">{t("ledger.increase")}</option><option value="decrease">{t("ledger.decrease")}</option>
          </Select>
        )}
        <div className="sm:col-span-2"><Input label={t("common.note")} value={f.note} onChange={(e) => set("note", e.target.value)} /></div>
      </div>
      <p className="mt-2 text-xs text-slate-400">{f.type === "udhaar" ? t("ledger.hintUdhaar") : f.type === "return" ? t("ledger.hintReturn") : t("ledger.hintAdjustment")}</p>
      {err && <p className="mt-3 text-sm text-rose-600">{t(err)}</p>}
      <div className="mt-5 flex justify-end gap-2"><Button v="g" onClick={close}>{t("common.cancel")}</Button><Button onClick={save}>{t("common.save")}</Button></div>
    </>
  );
}

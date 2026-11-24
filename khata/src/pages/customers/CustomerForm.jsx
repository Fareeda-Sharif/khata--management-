import { useState } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Field";
import { useI18n } from "../../i18n";
import { cname, cust } from "../../utils/calculations";
import { fmtCnic } from "../../utils/formatting";
import { fileToThumb } from "../../utils/image";
import { applyChanges, stamp } from "../../utils/transactions";
import { isValidCnic } from "../../utils/validation";

export function CustomerForm({ db, init, upd, close, toast, onSaved }) {
  const { t } = useI18n();
  const [f, setF] = useState(init || { cnic: "", name: "", phone: "", address: "", opening: 0, photo: "" });
  const [err, setErr] = useState(null); // { key, params }
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const pick = async (e) => { const file = e.target.files[0]; if (file) { try { set("photo", await fileToThumb(file)); } catch { setErr({ key: "customers.errPhoto" }); } } };
  const save = () => {
    if (!isValidCnic(f.cnic)) return setErr({ key: "customers.errCnicInvalid" });
    if (!init && cust(db, f.cnic)) return setErr({ key: "customers.errCnicExists", params: { name: cname(db, f.cnic) } });
    if (!f.name.trim()) return setErr({ key: "customers.errNameRequired" });
    const o = { name: f.name.trim(), phone: f.phone, address: f.address, opening: +f.opening || 0 };
    upd((d) => {
      if (init) { const rec = d.customers.find((c) => c.cnic === init.cnic); applyChanges(rec, o, "edit"); rec.photo = f.photo || ""; }
      else d.customers.push({ cnic: f.cnic, ...o, photo: f.photo || "", arch: false, ...stamp({}) });
      return d;
    });
    close(); toast(t("customers.saved"));
    if (onSaved) onSaved(f.cnic);
  };
  return (
    <>
      <h2 className="mb-4 pe-6 text-lg font-bold">{init ? t("customers.editTitle") : t("customers.newTitle")}</h2>
      <div className="mb-3 flex items-center gap-3">
        {f.photo ? <img src={f.photo} alt="" className="h-16 w-16 rounded-xl object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-xl bg-slate-100 text-slate-400"><Camera size={22} /></div>}
        <label className="cursor-pointer rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">{t("customers.photo")}<input type="file" accept="image/*" className="hidden" onChange={pick} /></label>
        {f.photo && <button type="button" onClick={() => set("photo", "")} className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600"><X size={14} />{t("common.remove")}</button>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label={t("customers.cnicLabel")} dir="ltr" placeholder="12345-1234567-1" value={f.cnic} disabled={!!init} onChange={(e) => set("cnic", fmtCnic(e.target.value))} />
        <Input label={t("common.name")} value={f.name} onChange={(e) => set("name", e.target.value)} />
        <Input label={t("common.phone")} dir="ltr" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
        <Input label={t("customers.opening")} type="number" value={f.opening} onChange={(e) => set("opening", e.target.value)} />
        <div className="sm:col-span-2"><Input label={t("common.address")} value={f.address} onChange={(e) => set("address", e.target.value)} /></div>
      </div>
      {init && <p className="mt-2 text-xs text-slate-400">{t("customers.cnicLocked")} {t("customers.editKept")}</p>}
      {err && <p className="mt-3 text-sm text-rose-600">{t(err.key, err.params)}</p>}
      <div className="mt-5 flex justify-end gap-2"><Button v="g" onClick={close}>{t("common.cancel")}</Button><Button onClick={save}>{t("common.save")}</Button></div>
    </>
  );
}

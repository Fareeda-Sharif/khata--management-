import { useState } from "react";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Input } from "../../components/common/Field";
import { useI18n } from "../../i18n";

// Shop name and contact details printed on every ledger, receipt and report
export function ShopSettings({ db, upd, toast }) {
  const { t } = useI18n();
  const [f, setF] = useState({ ...db.settings });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const save = () => { upd((d) => { d.settings = { ...d.settings, shopName: f.shopName.trim(), phone: f.phone.trim(), address: f.address.trim(), note: f.note.trim() }; return d; }); toast(t("shop.saved")); };
  return (
    <Card className="mt-5">
      <h2 className="font-semibold">{t("shop.title")}</h2>
      <p className="mb-3 mt-1 text-sm text-slate-500">{t("shop.note")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label={t("shop.name")} value={f.shopName} onChange={(e) => set("shopName", e.target.value)} />
        <Input label={t("common.phone")} dir="ltr" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
        <Input label={t("common.address")} value={f.address} onChange={(e) => set("address", e.target.value)} />
        <Input label={t("shop.footer")} value={f.note} onChange={(e) => set("note", e.target.value)} />
      </div>
      <div className="mt-4 flex justify-end"><Button onClick={save}>{t("common.save")}</Button></div>
    </Card>
  );
}

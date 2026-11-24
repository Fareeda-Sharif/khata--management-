import { useState } from "react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Field";
import { UNITS } from "../../constants";
import { useI18n } from "../../i18n";
import { unitLabel } from "../../utils/labels";

export function ItemForm({ init, upd, close }) {
  const { t } = useI18n();
  const [f, setF] = useState(init || { name: "", unit: "kg", price: 0 });
  const [err, setErr] = useState(null);
  const save = () => {
    if (!f.name.trim()) return setErr("items.errNameRequired");
    upd((d) => { const o = { name: f.name.trim(), unit: f.unit.trim() || "piece", price: +f.price || 0 }; if (init) Object.assign(d.items.find((i) => i.id === init.id), o); else d.items.push({ id: d.nid++, on: true, ...o }); return d; });
    close();
  };
  return (
    <>
      <h2 className="mb-4 pe-6 text-lg font-bold">{init ? t("items.editTitle") : t("items.newTitle")}</h2>
      <datalist id="units">{UNITS.map((u) => <option key={u} value={u} label={unitLabel(u)} />)}</datalist>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input label={t("items.nameLabel")} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Input label={t("items.unitLabel")} list="units" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} />
        <Input label={t("items.priceLabel")} type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
      </div>
      {err && <p className="mt-3 text-sm text-rose-600">{t(err)}</p>}
      <div className="mt-5 flex justify-end gap-2"><Button v="g" onClick={close}>{t("common.cancel")}</Button><Button onClick={save}>{t("common.save")}</Button></div>
    </>
  );
}

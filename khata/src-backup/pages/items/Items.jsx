import { Plus, Pencil } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { DataTable, Td } from "../../components/common/DataTable";
import { PageHeader } from "../../components/layout/PageHeader";
import { useI18n } from "../../i18n";
import { cx, rs } from "../../utils/formatting";
import { unitLabel } from "../../utils/labels";
import { ItemForm } from "./ItemForm";

export function Items({ db, upd, open, close }) {
  const { t } = useI18n();
  const form = (init) => open(<ItemForm init={init} upd={upd} close={close} />);
  return (
    <>
      <PageHeader action={<Button onClick={() => form()}><Plus size={16} />{t("items.add")}</Button>}>{t("items.title")}</PageHeader>
      <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">{t("items.note")}</p>
      <Card>
        <DataTable head={[t("common.item"), t("common.unit"), t("items.colPrice"), t("common.status"), ""]} right={[2, 4]}>
          {db.items.map((i) => (
            <tr key={i.id} className={i.on ? "" : "opacity-50"}>
              <Td className="font-medium"><bdi>{i.name}</bdi></Td><Td>{unitLabel(i.unit)}</Td><Td r>{rs(i.price)}</Td>
              <Td><span className={cx("rounded-full px-2.5 py-0.5 text-xs font-semibold", i.on ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500")}>{i.on ? t("common.active") : t("common.inactive")}</span></Td>
              <Td r><Button v="g" title={t("common.edit")} aria-label={t("common.edit")} onClick={() => form(i)}><Pencil size={16} /></Button><Button v="g" onClick={() => upd((d) => { const x = d.items.find((y) => y.id === i.id); x.on = !x.on; return d; })}>{i.on ? t("items.markInactive") : t("items.markActive")}</Button></Td>
            </tr>
          ))}
        </DataTable>
      </Card>
    </>
  );
}

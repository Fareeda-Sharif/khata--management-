import { Eye } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { DataTable, Td } from "../../components/common/DataTable";
import { Ltr } from "../../components/common/Ltr";
import { useI18n } from "../../i18n";
import { cname } from "../../utils/calculations";
import { rs } from "../../utils/formatting";
import { methodLabel } from "../../utils/labels";
import { txRef } from "../../utils/ledger";

export function PaymentList({ db, onView }) {
  const { t } = useI18n();
  const recent = [...db.payments].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 12);
  return (
    <Card className="mt-5">
      <h2 className="mb-2 font-semibold">{t("payments.recent")}</h2>
      <DataTable head={[t("common.date"), t("ledger.colId"), t("common.customer"), t("common.method"), t("common.amount"), ""]} right={[4, 5]}>
        {recent.map((p) => (<tr key={p.id} className={p.voided ? "text-slate-400 line-through" : ""}><Td><Ltr>{p.date}</Ltr></Td><Td className="font-mono text-xs"><Ltr>{txRef("payment", p.id)}</Ltr></Td><Td><bdi>{cname(db, p.cnic)}</bdi></Td><Td>{methodLabel(p.method)}</Td><Td r className="font-semibold text-emerald-600">{rs(p.amount)}</Td><Td r><Button v="g" onClick={() => onView(p)}><Eye size={16} />{t("payments.receipt")}</Button></Td></tr>))}
      </DataTable>
    </Card>
  );
}

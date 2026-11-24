import { Eye } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { DataTable, Td } from "../../components/common/DataTable";
import { Ltr } from "../../components/common/Ltr";
import { useI18n } from "../../i18n";
import { cname, etot } from "../../utils/calculations";
import { rs } from "../../utils/formatting";
import { txRef } from "../../utils/ledger";

export function KhataEntryList({ db, onView }) {
  const { t } = useI18n();
  const recent = [...db.entries].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 12);
  return (
    <Card className="mt-5">
      <h2 className="mb-2 font-semibold">{t("khata.recent")}</h2>
      <DataTable head={[t("common.date"), t("ledger.colId"), t("common.customer"), t("khata.colItems"), t("common.total"), ""]} right={[4, 5]}>
        {recent.map((e) => (<tr key={e.id} className={e.voided ? "text-slate-400 line-through" : ""}><Td><Ltr>{e.date}</Ltr></Td><Td className="font-mono text-xs"><Ltr>{txRef("purchase", e.id)}</Ltr></Td><Td><bdi>{cname(db, e.cnic)}</bdi></Td><Td>{e.lines.length}</Td><Td r>{rs(etot(e))}</Td><Td r><Button v="g" onClick={() => onView(e)}><Eye size={16} />{t("common.view")}</Button></Td></tr>))}
      </DataTable>
    </Card>
  );
}

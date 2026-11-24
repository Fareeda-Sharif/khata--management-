import { DocModal } from "../../components/documents/DocModal";
import { PageHeader } from "../../components/layout/PageHeader";
import { useI18n } from "../../i18n";
import { buildReceiptDoc } from "../../services/documents/builders";
import { findTx } from "../../utils/ledger";
import { PaymentForm } from "./PaymentForm";
import { PaymentList } from "./PaymentList";

export function Payments({ db, upd, open, toast, params }) {
  const { t } = useI18n();
  const showReceipt = (tx, snapshot) => open(<DocModal doc={buildReceiptDoc(snapshot, tx)} filename={`receipt-${tx.ref}.pdf`} />, true);
  return (
    <>
      <PageHeader>{t("payments.title")}</PageHeader>
      <PaymentForm db={db} upd={upd} toast={toast} onSaved={showReceipt} prefillCnic={params?.cnic} />
      <PaymentList db={db} onView={(p) => showReceipt(findTx(db, p.cnic, `p${p.id}`), db)} />
    </>
  );
}

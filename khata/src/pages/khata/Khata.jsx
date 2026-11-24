import { DocModal } from "../../components/documents/DocModal";
import { PageHeader } from "../../components/layout/PageHeader";
import { useI18n } from "../../i18n";
import { buildReceiptDoc } from "../../services/documents/builders";
import { findTx } from "../../utils/ledger";
import { KhataEntryForm } from "./KhataEntryForm";
import { KhataEntryList } from "./KhataEntryList";

export function Khata({ db, upd, open, close, toast, params }) {
  const { t } = useI18n();
  const showEntry = (e) => {
    const tx = findTx(db, e.cnic, `e${e.id}`);
    open(<DocModal doc={buildReceiptDoc(db, tx)} filename={`receipt-${tx.ref}.pdf`} />, true);
  };
  return (
    <>
      <PageHeader>{t("khata.title")}</PageHeader>
      <KhataEntryForm db={db} upd={upd} open={open} close={close} toast={toast} prefillCnic={params?.cnic} />
      <KhataEntryList db={db} onView={showEntry} />
    </>
  );
}

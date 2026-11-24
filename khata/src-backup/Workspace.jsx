import { useEffect, useRef, useState } from "react";
import { ExportText } from "./components/common/ExportText";
import { Modal } from "./components/common/Modal";
import { Toast } from "./components/common/Toast";
import { MainLayout } from "./components/layout/MainLayout";
import { AppContext } from "./context/AppContext";
import { useKhata } from "./hooks/useKhata";
import { useModal } from "./hooks/useModal";
import { useToast } from "./hooks/useToast";
import { apiErrorText, useI18n } from "./i18n";
import { Customers } from "./pages/customers/Customers";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { Items } from "./pages/items/Items";
import { CustomerLedger } from "./pages/ledger/CustomerLedger";
import { Khata } from "./pages/khata/Khata";
import { Payments } from "./pages/payments/Payments";
import { Reports } from "./pages/reports/Reports";
import { setShopFallback } from "./services/documents/builders";

const PAGES = { dash: Dashboard, cust: Customers, ledger: CustomerLedger, items: Items, khata: Khata, pay: Payments, rep: Reports };

export function Workspace({ session, onLogout }) {
  const { t } = useI18n();
  const { db, setDb, upd, loadError, saveError } = useKhata(onLogout);
  const [page, setPage] = useState("dash");
  const [params, setParams] = useState({}); // e.g. { cnic } for the customer ledger or a preselected customer
  const go = (p, pr = {}) => { setPage(p); setParams(pr); };
  const dbRef = useRef(null);
  dbRef.current = db;
  setShopFallback(session.shopName);
  const { message, toast } = useToast();
  const { modal, open, close } = useModal();
  const Page = PAGES[page];

  useEffect(() => {
    const h = (e) => open(<ExportText name={e.detail.name} text={e.detail.text} />, true);
    window.addEventListener("khata:export", h);
    return () => window.removeEventListener("khata:export", h);
  }, []);

  if (loadError) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 p-6 text-center">
        <div>
          <p className="text-lg font-semibold text-rose-600">{t("sys.loadFailed")}</p>
          <p className="mt-1 text-sm text-slate-500">{apiErrorText(loadError)}</p>
          <div className="mt-4 flex justify-center gap-2">
            <button onClick={() => window.location.reload()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{t("common.retry")}</button>
            <button onClick={onLogout} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">{t("common.logout")}</button>
          </div>
        </div>
      </div>
    );
  }
  if (!db) return <div className="grid min-h-screen place-items-center bg-slate-100 text-slate-500">{t("common.loading")}</div>;

  const saveBanner = saveError && (saveError.code === "conflict" ? apiErrorText(saveError) : t("sys.saveFailed", { reason: apiErrorText(saveError) }));

  const ctx = { db, upd, toast, open, close, go, getDb: () => dbRef.current };
  return (
    <AppContext.Provider value={ctx}>
      <MainLayout page={page === "ledger" ? "cust" : page} setPage={(p) => go(p)} shopName={session.shopName} onLogout={onLogout}>
        <Page db={db} setDb={setDb} upd={upd} setPage={go} go={go} params={params} toast={toast} open={open} close={close} />
      </MainLayout>
      {saveBanner && <div className="fixed inset-x-0 top-0 z-50 bg-rose-600 px-4 py-2 text-center text-sm font-medium text-white">{saveBanner}</div>}
      {modal && <Modal wide={modal.wide} onClose={close}>{modal.node}</Modal>}
      <Toast message={message} />
    </AppContext.Provider>
  );
}

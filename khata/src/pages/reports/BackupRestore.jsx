import { Download, Upload } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { useI18n } from "../../i18n";
import { download } from "../../utils/csvUtils";
import { today } from "../../utils/formatting";

export function BackupRestore({ db, setDb, toast }) {
  const { t } = useI18n();
  const restore = (file) => {
    const r = new FileReader();
    r.onload = () => { try { const d = JSON.parse(r.result); if (!d.customers || !d.entries || !d.payments || !d.items) throw 0; if (window.confirm(t("backup.confirm"))) { setDb(d); toast(t("backup.restored")); } } catch { toast(t("backup.invalid")); } };
    r.readAsText(file, "utf-8");
  };
  return (
    <Card className="mt-5">
      <h2 className="font-semibold">{t("backup.title")}</h2>
      <p className="mb-3 mt-1 text-sm text-slate-500">{t("backup.note")}</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => download(`khata-backup-${today()}.json`, JSON.stringify(db), "application/json")}><Download size={16} />{t("backup.make")}</Button>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Upload size={16} />{t("backup.restore")}<input type="file" accept=".json" className="hidden" onChange={(e) => e.target.files[0] && restore(e.target.files[0])} /></label>
      </div>
    </Card>
  );
}

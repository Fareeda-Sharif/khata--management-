import { X } from "lucide-react";
import { useI18n } from "../../i18n";
import { cx } from "../../utils/formatting";

export function Modal({ onClose, children, wide }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={cx("relative mt-8 w-full rounded-2xl bg-white p-6 shadow-2xl", wide ? "max-w-3xl" : "max-w-xl")} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label={t("common.close")} className="absolute end-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        {children}
      </div>
    </div>
  );
}

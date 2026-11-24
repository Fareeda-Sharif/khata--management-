import { BarChart3, BookOpen, LayoutDashboard, LogOut, Package, Users, Wallet } from "lucide-react";
import { useI18n } from "../../i18n";
import { cx } from "../../utils/formatting";
import { LanguageSwitcher } from "../common/LanguageSwitcher";

export const NAV = [["dash", "nav.dashboard", LayoutDashboard], ["cust", "nav.customers", Users], ["items", "nav.items", Package], ["khata", "nav.khata", BookOpen], ["pay", "nav.payments", Wallet], ["rep", "nav.reports", BarChart3]];

export function Sidebar({ page, setPage, shopName, onLogout }) {
  const { t } = useI18n();
  return (
    <aside className="flex shrink-0 flex-col bg-gradient-to-b from-emerald-900 to-emerald-950 p-3 text-emerald-50 md:sticky md:top-0 md:h-screen md:w-64 md:p-5">
      <div className="flex items-center gap-3 px-2 py-2 md:mb-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 text-emerald-950"><BookOpen size={22} /></div>
        <div><div className="text-lg font-bold leading-tight">{t("app.name")}</div><div className="text-xs text-emerald-300">{t("app.tagline")}</div></div>
      </div>
      <nav className="flex gap-1 overflow-x-auto md:flex-col">
        {NAV.map(([k, label, Icon]) => (
          <button key={k} onClick={() => setPage(k)} className={cx("flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-start text-sm font-medium transition", page === k ? "bg-white/15 text-white shadow-inner" : "text-emerald-200 hover:bg-white/10")}>
            <Icon size={18} className={page === k ? "text-amber-300" : ""} />{t(label)}
          </button>
        ))}
      </nav>
      <div className="mt-3 space-y-3 border-t border-white/10 px-2 pt-3 md:mt-auto">
        <div>
          <div className="mb-1.5 text-xs text-emerald-300">{t("lang.label")}</div>
          <LanguageSwitcher tone="dark" />
        </div>
        {(shopName || onLogout) && (
          <div className="flex items-center justify-between gap-2">
            <bdi className="truncate text-sm text-emerald-200" title={shopName}>{shopName}</bdi>
            {onLogout && <button onClick={onLogout} className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-white/10"><LogOut size={14} />{t("common.logout")}</button>}
          </div>
        )}
      </div>
    </aside>
  );
}

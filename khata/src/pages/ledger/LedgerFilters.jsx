import { Search } from "lucide-react";
import { Input, Select, field } from "../../components/common/Field";
import { METHODS } from "../../constants";
import { useI18n } from "../../i18n";
import { cx } from "../../utils/formatting";
import { methodLabel } from "../../utils/labels";

const PRESETS = ["all", "today", "yesterday", "week", "month", "lastMonth", "custom"];
const KIND_OPTIONS = ["purchase", "udhaar", "payment", "return", "adjustment"];

// Filters change only the list, never the balances
export function LedgerFilters({ value, onChange }) {
  const { t } = useI18n();
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("ledger.period")}>
        {PRESETS.map((p) => (
          <button key={p} type="button" aria-pressed={value.preset === p} onClick={() => set({ preset: p })}
            className={cx("rounded-full px-3.5 py-1.5 text-xs font-semibold transition", value.preset === p ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
            {t(`ledger.preset.${p}`)}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {value.preset === "custom" && (
          <>
            <Input label={t("reports.from")} type="date" value={value.from} onChange={(e) => set({ from: e.target.value })} />
            <Input label={t("reports.to")} type="date" value={value.to} onChange={(e) => set({ to: e.target.value })} />
          </>
        )}
        <Select label={t("ledger.filterType")} value={value.kind} onChange={(e) => set({ kind: e.target.value })}>
          <option value="">{t("ledger.allTypes")}</option>
          {KIND_OPTIONS.map((k) => <option key={k} value={k}>{t(`types.${k}`)}</option>)}
        </Select>
        <Select label={t("ledger.filterMethod")} value={value.method} onChange={(e) => set({ method: e.target.value })}>
          <option value="">{t("ledger.allMethods")}</option>
          {METHODS.map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}
        </Select>
        <label className="block text-xs font-medium text-slate-500">{t("common.search")}
          <span className="relative mt-1 block"><Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={value.search} onChange={(e) => set({ search: e.target.value })} dir={value.search ? "auto" : undefined} placeholder={t("ledger.searchPlaceholder")} className={cx(field, "mt-0 ps-9")} /></span>
        </label>
      </div>
    </div>
  );
}

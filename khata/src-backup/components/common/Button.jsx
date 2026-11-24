import { cx } from "../../utils/formatting";

export const Button = ({ v = "p", className, ...p }) => (
  <button {...p} className={cx("inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
    v === "p" && "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
    v === "o" && "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    v === "g" && "text-slate-500 hover:bg-slate-100", className)} />
);

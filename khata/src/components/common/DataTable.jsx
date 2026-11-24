import { cx, rs } from "../../utils/formatting";

export const DataTable = ({ head, children, right = [] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead><tr className="border-b border-slate-100 text-start text-xs font-semibold text-slate-400">{head.map((h, i) => <th key={i} className={cx("whitespace-nowrap px-3 py-2.5 text-start", right.includes(i) && "text-end")}>{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-50 tabular-nums">{children}</tbody>
    </table>
  </div>
);
export const Td = ({ r, className, ...p }) => <td {...p} className={cx("whitespace-nowrap px-3 py-3 text-start text-slate-700", r && "text-end", className)} />;
export const Due = ({ v }) => <span className={cx("font-semibold", v > 0 ? "text-rose-600" : "text-emerald-600")}>{rs(v)}</span>;
export const EmptyState = ({ cols, text }) => <tr><td colSpan={cols} className="px-3 py-8 text-center text-slate-400">{text}</td></tr>;

import { cx } from "../../utils/formatting";

export const Card = ({ className, ...p }) => <div {...p} className={cx("rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm", className)} />;

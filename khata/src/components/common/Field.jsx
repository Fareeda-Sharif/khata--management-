export const field = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-500";

// Numbers and dates are always left-to-right; typed text (name, address, note) picks its own direction (Urdu or English)
export const inputDir = (type, value, dir) => dir || (["number", "date", "tel", "password", "email"].includes(type) ? "ltr" : value ? "auto" : undefined);

export const Input = ({ label, dir, ...p }) => <label className="block text-xs font-medium text-slate-500">{label}<input {...p} dir={inputDir(p.type, p.value, dir)} className={field} /></label>;
export const Select = ({ label, children, ...p }) => <label className="block text-xs font-medium text-slate-500">{label}<select {...p} className={field}>{children}</select></label>;

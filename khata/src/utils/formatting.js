import { t } from "../i18n";

export const ago = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
export const today = () => ago(0);
export const rs = (n) => t("common.currencyPattern", { n: Number(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 2 }) });
export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const fmtCnic = (v) => { const d = v.replace(/\D/g, "").slice(0, 13); return d.length > 12 ? `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}` : d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d; };
export const nowISO = () => new Date().toISOString();
export const fmtTime = (iso) => { if (!iso) return ""; const d = new Date(iso); return Number.isNaN(d.getTime()) ? "" : `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
export const fmtDateTime = (date, iso) => `${date}${fmtTime(iso) ? " " + fmtTime(iso) : ""}`;
export const fmtNum = (n) => Number(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 2 });
export const cx = (...a) => a.filter(Boolean).join(" ");

import { LOCAL_MODE } from "../services/mode";

export const download = (name, text, type = "text/csv") => {
  // In local mode (published page) files cannot be downloaded: a copy-text window opens instead
  if (LOCAL_MODE) { window.dispatchEvent(new CustomEvent("khata:export", { detail: { name, text } })); return; }
  const isCsv = type.startsWith("text/csv");
  const a = document.createElement("a");
  // CSV files get a BOM so Excel shows Urdu correctly
  a.href = URL.createObjectURL(new Blob([isCsv ? "\uFEFF" + text : text], { type: `${type};charset=utf-8` }));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
};

export const toCsv = (rows) => rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");

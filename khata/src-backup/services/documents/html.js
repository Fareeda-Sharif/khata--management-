import { esc } from "../../utils/formatting";

// Draws the document model as HTML for the preview and for the browser print dialog (A4, RTL aware).
const cell = (c) => { const o = c && typeof c === "object" ? c : { text: c }; return o.dir === "ltr" ? `<bdi dir="ltr">${esc(o.text)}</bdi>` : `<bdi>${esc(o.text)}</bdi>`; };

export const DOC_CSS = `.kd{font-size:12px;color:#1a2229;line-height:1.5}.kd h1{font-size:20px;margin:0}.kd .top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;border-bottom:3px solid #0b6b4d;padding-bottom:8px;margin-bottom:10px}
.kd .shop{font-size:18px;font-weight:700;color:#0b6b4d}.kd .mut{color:#66727d}.kd .meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;margin:8px 0}.kd .meta small{display:block;color:#66727d;font-size:10px}.kd .meta b{font-size:12px}
.kd .sum{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0}.kd .sum div{background:#eff7f3;padding:6px 8px;border-radius:4px}.kd .sum small{display:block;color:#66727d;font-size:10px}.kd .sum b{font-size:13px}.kd .sum .strong{background:#0b6b4d;color:#fff}.kd .sum .strong small{color:#d5efe5}
.kd h2{font-size:13px;color:#0b6b4d;margin:12px 0 4px}.kd table{width:100%;border-collapse:collapse;margin:6px 0}.kd thead{display:table-header-group}.kd th{background:#0b6b4d;color:#fff;font-size:11px}.kd th,.kd td{padding:4px 6px;border-bottom:1px solid #dfe5ea;text-align:start;vertical-align:top}
.kd .e{text-align:end}.kd tr{page-break-inside:avoid}.kd tfoot td{font-weight:700;background:#eff7f3;border-top:2px solid #0b6b4d}.kd .void td{color:#9a9a9a;text-decoration:line-through}
.kd .tot{margin:8px 0 8px auto;width:260px}.kd .tot div{display:flex;justify-content:space-between;padding:3px 8px}.kd .tot .strong{background:#eff7f3;font-weight:700}.kd .legend{font-size:10px;color:#66727d;margin-top:8px}.kd .red{color:#b82a2a;font-weight:700}
@page{size:A4;margin:12mm}`;

export function toHtml(doc) {
  const align = (c) => (c.align === "end" ? ' class="e"' : "");
  const tables = (doc.tables || []).map((tb) => `${tb.heading ? `<h2>${esc(tb.heading)}</h2>` : ""}<table><thead><tr>${tb.columns.map((c) => `<th${align(c)}>${esc(c.label)}</th>`).join("")}</tr></thead><tbody>${tb.rows.length ? tb.rows.map((r, i) => `<tr${tb.rowMeta?.[i]?.voided ? ' class="void"' : ""}>${r.map((c, k) => `<td${align(tb.columns[k])}>${cell(c)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${tb.columns.length}" class="mut">${esc(tb.empty || "–")}</td></tr>`}</tbody>${tb.foot ? `<tfoot><tr>${tb.foot.map((c, k) => `<td${align(tb.columns[k])}>${cell(c)}</td>`).join("")}</tr></tfoot>` : ""}</table>`).join("");
  return `<style>${DOC_CSS}</style><div class="kd" dir="${doc.dir}" lang="${doc.lang}">
<div class="top"><div><div class="shop">${esc(doc.shop.name)}</div><div class="mut">${[doc.shop.phone, doc.shop.address].filter(Boolean).map((x) => `<bdi>${esc(x)}</bdi>`).join(" · ")}</div></div><div style="text-align:end"><h1>${esc(doc.title)}</h1>${doc.subtitle ? `<div class="${doc.subtitleTone === "red" ? "red" : "mut"}">${esc(doc.subtitle)}</div>` : ""}</div></div>
${doc.header?.length ? `<div class="meta">${doc.header.map(([l, v]) => `<div><small>${esc(l)}</small><b><bdi>${esc(v || "–")}</bdi></b></div>`).join("")}</div>` : ""}
${doc.summary?.length ? `<div class="sum">${doc.summary.map((s) => `<div class="${s.strong ? "strong" : ""}"><small>${esc(s.label)}</small><b>${esc(s.value)}</b></div>`).join("")}</div>` : ""}
${tables}
${doc.totals?.length ? `<div class="tot">${doc.totals.map((x) => `<div class="${x.strong ? "strong" : ""}"><span>${esc(x.label)}</span><span><bdi>${esc(x.value)}</bdi></span></div>`).join("")}</div>` : ""}
${doc.notes ? `<div class="mut">${esc(doc.notesLabel || "")}</div><div>${esc(doc.notes)}</div>` : ""}
<div class="legend">${esc(doc.legend || "")} · ${esc(doc.generatedLabel)}: ${esc(doc.generated)}${doc.footerNote ? ` · ${esc(doc.footerNote)}` : ""}</div></div>`;
}

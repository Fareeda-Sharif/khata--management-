import { getDir, getLang, LANGS } from "../i18n";

const FONT_URL = "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap";
const URDU_FONTS = "'Noto Naskh Arabic','Segoe UI',Tahoma,'Urdu Typesetting',sans-serif";

export const printHTML = (html) => {
  const lang = getLang(), dir = getDir(), rtl = dir === "rtl";
  const f = document.createElement("iframe"); f.style.display = "none"; document.body.appendChild(f);
  const d = f.contentWindow.document;
  d.write(`<!doctype html><html lang="${LANGS[lang].html}" dir="${dir}"><head><meta charset="utf-8">${rtl ? `<link rel="stylesheet" href="${FONT_URL}">` : ""}<style>
body{font-family:${rtl ? URDU_FONTS : "system-ui,sans-serif"};padding:24px;color:#111;direction:${dir};line-height:${rtl ? 1.8 : 1.5}}
table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #ccc;padding:6px;text-align:start}.r{text-align:end}
*{letter-spacing:normal}</style></head><body>${html}</body></html>`);
  d.close();
  // Wait for the Urdu font to load, then print
  const ready = d.fonts ? Promise.race([d.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
  ready.then(() => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 2000); });
};

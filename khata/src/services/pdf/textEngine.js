// Small bidirectional-text helper for the PDF engine.
// Splits a string into visual-order segments, each drawn with the Urdu (Naskh) or Latin font.
// Urdu runs are shaped by the font engine; digits, CNIC, dates and English stay left-to-right.
const AR = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
const SPACEISH = new Set([" ", "\u200C", "\u200D", "\u00A0"]);
const MIRROR = { "(": ")", ")": "(", "[": "]", "]": "[", "<": ">", ">": "<", "{": "}", "}": "{" };
const isDigit = (c) => c >= "0" && c <= "9";
const classOf = (c) => (AR.test(c) ? "R" : isDigit(c) || /[A-Za-z\u00C0-\u024F]/.test(c) ? "L" : "N");

export const hasArabic = (s) => AR.test(String(s));

export function bidiSegments(text, baseRtl) {
  const chars = Array.from(String(text));
  const cls = chars.map(classOf);
  chars.forEach((c, i) => {
    if (cls[i] !== "N") return;
    const p = chars[i - 1], n = chars[i + 1];
    if ((c === "-" || c === "+") && n && isDigit(n)) cls[i] = "L";
    else if (",.:/-".includes(c) && p && n && isDigit(p) && isDigit(n)) cls[i] = "L";
    else if (c === "%" && p && isDigit(p)) cls[i] = "L";
  });
  const base = baseRtl ? "R" : "L";
  for (let i = 0; i < cls.length; ) {
    if (cls[i] !== "N") { i++; continue; }
    let j = i;
    while (j < cls.length && cls[j] === "N") j++;
    const before = i > 0 ? cls[i - 1] : base, after = j < cls.length ? cls[j] : base;
    const d = before === after ? before : base;
    for (let k = i; k < j; k++) cls[k] = d;
    i = j;
  }
  const runs = [];
  chars.forEach((c, i) => {
    const last = runs[runs.length - 1];
    if (last && last.dir === cls[i]) last.chars.push(c); else runs.push({ dir: cls[i], chars: [c] });
  });
  const ordered = baseRtl ? runs.reverse() : runs;
  const out = [];
  for (const run of ordered) {
    if (run.dir === "L") { out.push({ font: "lat", text: run.chars.join("") }); continue; }
    const segs = [];
    run.chars.forEach((c) => {
      const f = AR.test(c) || SPACEISH.has(c) ? "ar" : "lat";
      const last = segs[segs.length - 1];
      if (last && last.font === f) last.chars.push(c); else segs.push({ font: f, chars: [c] });
    });
    segs.reverse().forEach((s) => out.push(s.font === "lat" ? { font: "lat", text: [...s.chars].reverse().map((c) => MIRROR[c] || c).join("") } : { font: "ar", text: s.chars.join("") }));
  }
  return out;
}

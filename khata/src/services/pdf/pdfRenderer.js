import { PDFDocument, PDFHexString, beginText, endText, setFontAndSize, setTextMatrix, showText, setFillingColor, pushGraphicsState, popGraphicsState, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { loadFontBytes } from "./fonts";
import { bidiSegments, hasArabic } from "./textEngine";

const PAGE = [595.28, 841.89]; // A4 portrait, points
const M = 36;
const COL = {
  accent: rgb(0.04, 0.42, 0.3), text: rgb(0.1, 0.13, 0.16), mut: rgb(0.4, 0.45, 0.5), line: rgb(0.83, 0.86, 0.89),
  band: rgb(0.94, 0.97, 0.95), zebra: rgb(0.975, 0.98, 0.985), white: rgb(1, 1, 1), voided: rgb(0.62, 0.62, 0.62), red: rgb(0.72, 0.16, 0.16),
};

export async function renderPdf(doc) {
  const rtl = doc.dir === "rtl";
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(doc.title); pdf.setAuthor(doc.shop.name); pdf.setCreator("Khata Manager"); pdf.setProducer("Khata Manager"); pdf.setLanguage(rtl ? "ur" : "en");

  const bytes = loadFontBytes();
  const fonts = { lat: await pdf.embedFont(bytes.lat, { subset: false }), latB: await pdf.embedFont(bytes.latB, { subset: false }) };
  if (rtl || hasArabic(JSON.stringify(doc))) { fonts.ar = await pdf.embedFont(bytes.ar, { subset: false }); fonts.arB = await pdf.embedFont(bytes.arB, { subset: false }); }

  // ---------- text primitives (glyph-level so Urdu marks attach correctly) ----------
  const cacheW = new Map();
  const fontOf = (seg, bold) => fonts[(seg.font === "ar" && fonts.ar ? "ar" : "lat") + (bold ? "B" : "")];
  const layoutOf = (seg, bold) => { const f = fontOf(seg, bold); const fk = f.embedder.font; return { f, fk, run: fk.layout(seg.text) }; };
  const segWidth = (seg, size, bold) => {
    const k = `${seg.font}|${bold}|${size}|${seg.text}`;
    if (cacheW.has(k)) return cacheW.get(k);
    const { fk, run } = layoutOf(seg, bold);
    const w = run.positions.reduce((a, p) => a + p.xAdvance, 0) * size / fk.unitsPerEm;
    cacheW.set(k, w); return w;
  };
  const segsOf = (text, ltr) => bidiSegments(text, rtl && !ltr);
  const textWidth = (text, size, bold, ltr) => segsOf(text, ltr).reduce((a, s) => a + segWidth(s, size, bold), 0);
  const drawSegs = (page, segs, x, y, size, bold, color) => {
    let pen = x;
    for (const seg of segs) {
      const { f, fk, run } = layoutOf(seg, bold); const sc = size / fk.unitsPerEm;
      page.setFont(f);
      const ops = [pushGraphicsState(), setFillingColor(color), beginText(), setFontAndSize(page.fontKey, size)];
      run.glyphs.forEach((g, i) => {
        const p = run.positions[i];
        ops.push(setTextMatrix(1, 0, 0, 1, pen + p.xOffset * sc, y + p.yOffset * sc), showText(PDFHexString.of(g.id.toString(16).padStart(4, "0"))));
        pen += p.xAdvance * sc;
      });
      ops.push(endText(), popGraphicsState());
      page.pushOperators(...ops);
    }
    return pen - x;
  };
  const wrap = (text, maxW, size, bold, ltr) => {
    const lines = [];
    for (const para of String(text ?? "").split("\n")) {
      let line = "";
      for (const w of para.split(" ")) {
        const cand = line ? `${line} ${w}` : w;
        if (!line || textWidth(cand, size, bold, ltr) <= maxW) line = cand; else { lines.push(line); line = w; }
      }
      lines.push(line);
    }
    return lines.flatMap((ln) => { // a single very long word is broken by characters
      if (textWidth(ln, size, bold, ltr) <= maxW) return [ln];
      const parts = []; let cur = "";
      for (const ch of Array.from(ln)) { if (cur && textWidth(cur + ch, size, bold, ltr) > maxW) { parts.push(cur); cur = ch; } else cur += ch; }
      return [...parts, cur];
    });
  };

  // ---------- page state ----------
  const pages = [];
  let page, y;
  const lineH = (size) => size * (rtl ? 1.75 : 1.45);
  const drawText = (txt, x0, x1, base, size, { bold = false, color = COL.text, align = "start", ltr = false } = {}) => {
    const segs = segsOf(txt, ltr);
    const w = segs.reduce((a, s) => a + segWidth(s, size, bold), 0);
    const phys = align === "center" ? "center" : (align === "start") === !rtl ? "left" : "right";
    const x = phys === "left" ? x0 : phys === "right" ? x1 - w : (x0 + x1 - w) / 2;
    drawSegs(page, segs, x, base, size, bold, color);
    return { x, w };
  };
  const rule = (yy, color = COL.line, th = 0.7, x0 = M, x1 = PAGE[0] - M) => page.drawLine({ start: { x: x0, y: yy }, end: { x: x1, y: yy }, thickness: th, color });
  const W = PAGE[0] - 2 * M;
  const bottom = M + 26;

  const runningHeader = () => {
    drawText(doc.shop.name, M, M + W, y - 8, 9, { bold: true, color: COL.accent });
    drawText(doc.title, M, M + W, y - 8, 9, { color: COL.mut, align: "end" });
    rule(y - 14); y -= 26;
  };
  const newPage = (first) => { page = pdf.addPage(PAGE); pages.push(page); y = PAGE[1] - M; if (!first) runningHeader(); };
  const ensure = (h) => { if (y - h < bottom) { newPage(false); return true; } return false; };
  newPage(true);

  // ---------- letterhead ----------
  // "start" side holds the shop (right in Urdu), "end" side holds the document title (left in Urdu)
  const sw = W * 0.55, ew = W * 0.42;
  const sBox = rtl ? [M + W - sw, M + W] : [M, M + sw], eBox = rtl ? [M, M + ew] : [M + W - ew, M + W];
  const shopLines = [doc.shop.phone, doc.shop.address].filter(Boolean).flatMap((s) => wrap(s, sw, 9, false, false));
  drawText(doc.shop.name, sBox[0], sBox[1], y - 16, 17, { bold: true, color: COL.accent });
  let ly = y - 16;
  shopLines.forEach((s) => { ly -= lineH(9); drawText(s, sBox[0], sBox[1], ly, 9, { color: COL.mut }); });
  const tl = wrap(doc.title, ew, 15, true).slice(0, 2);
  tl.forEach((s, i) => drawText(s, eBox[0], eBox[1], y - 16 - i * lineH(15), 15, { bold: true, align: "end" }));
  if (doc.subtitle) drawText(doc.subtitle, eBox[0], eBox[1], y - 16 - tl.length * lineH(15), 9, { color: doc.subtitleTone === "red" ? COL.red : COL.mut, align: "end" });
  y = Math.min(ly, y - 16 - tl.length * lineH(15) - (doc.subtitle ? 12 : 0)) - 10;
  page.drawRectangle({ x: M, y: y, width: W, height: 2.5, color: COL.accent }); y -= 16;

  // ---------- header key/value grid ----------
  if (doc.header?.length) {
    const gap = 18, cw = (W - gap) / 2;
    for (let i = 0; i < doc.header.length; i += 2) {
      const pair = doc.header.slice(i, i + 2).map(([label, value]) => ({ label, lines: wrap(value || "–", cw, 9.5, true, false) }));
      const h = Math.max(...pair.map((p) => lineH(8) + p.lines.length * lineH(9.5))) + 4;
      ensure(h);
      pair.forEach((p, k) => {
        const x0 = rtl ? M + W - cw - k * (cw + gap) : M + k * (cw + gap);
        drawText(p.label, x0, x0 + cw, y - 8, 8, { color: COL.mut });
        p.lines.forEach((ln, j) => drawText(ln, x0, x0 + cw, y - 8 - lineH(8) - j * lineH(9.5) + 1, 9.5, { bold: true }));
      });
      y -= h;
    }
    y -= 4;
  }

  // ---------- summary boxes ----------
  if (doc.summary?.length) {
    const per = 3, gap = 8, bw = (W - gap * (per - 1)) / per, bh = 40;
    for (let i = 0; i < doc.summary.length; i += per) {
      ensure(bh + 8);
      doc.summary.slice(i, i + per).forEach((s, k) => {
        const x0 = rtl ? M + W - bw - k * (bw + gap) : M + k * (bw + gap);
        page.drawRectangle({ x: x0, y: y - bh, width: bw, height: bh, color: s.strong ? COL.accent : COL.band });
        drawText(s.label, x0 + 8, x0 + bw - 8, y - 14, 8, { color: s.strong ? COL.white : COL.mut });
        drawText(s.value, x0 + 8, x0 + bw - 8, y - 32, 12.5, { bold: true, color: s.strong ? COL.white : COL.text });
      });
      y -= bh + 8;
    }
    y -= 4;
  }

  // ---------- tables ----------
  const SZ = 8.5, PAD = 4;
  const drawTable = (table) => {
    if (table.heading) { ensure(40); drawText(table.heading, M, M + W, y - 10, 11, { bold: true, color: COL.accent }); y -= 20; }
    const total = table.columns.reduce((a, c) => a + (c.width || 1), 0);
    let acc = 0;
    const cols = table.columns.map((c) => { const w = W * (c.width || 1) / total; const off = acc; acc += w; return { ...c, w, x: rtl ? M + W - off - w : M + off }; });
    const cellOf = (c) => (c && typeof c === "object" ? c : { text: c });
    const rowLines = (cells, bold) => cells.map((raw, i) => { const c = cellOf(raw); return wrap(c.text ?? "", cols[i].w - 2 * PAD, SZ, bold || c.bold, c.dir === "ltr"); });
    const heightOf = (lines) => Math.max(...lines.map((l) => l.length)) * lineH(SZ) + 2 * PAD;
    const drawRow = (cells, lines, h, { bold = false, fill, voided = false, color } = {}) => {
      if (fill) page.drawRectangle({ x: M, y: y - h, width: W, height: h, color: fill });
      cells.forEach((raw, i) => {
        const c = cellOf(raw), col = cols[i];
        lines[i].forEach((ln, j) => {
          const base = y - PAD - SZ - j * lineH(SZ) - (lineH(SZ) - SZ) / 2 + 1;
          const colr = voided ? COL.voided : c.tone === "red" ? COL.red : color || COL.text;
          const pos = drawText(ln, col.x + PAD, col.x + col.w - PAD, base, SZ, { bold: bold || c.bold, color: colr, align: col.align || "start", ltr: c.dir === "ltr" });
          if (voided) page.drawLine({ start: { x: pos.x, y: base + SZ * 0.3 }, end: { x: pos.x + pos.w, y: base + SZ * 0.3 }, thickness: 0.6, color: COL.voided });
        });
      });
    };
    const head = table.columns.map((c) => ({ text: c.label, bold: true }));
    const headLines = rowLines(head, true), headH = heightOf(headLines);
    const drawHead = () => drawRow(head, headLines, headH, { bold: true, fill: COL.accent, color: COL.white });
    ensure(headH + 40);
    drawHead(); y -= headH;
    if (!table.rows.length) { const h = lineH(SZ) + 2 * PAD + 6; ensure(h); drawText(table.empty || "–", M, M + W, y - 14, 9, { color: COL.mut, align: "center" }); y -= h; }
    table.rows.forEach((cells, r) => {
      const lines = rowLines(cells, false), h = heightOf(lines);
      if (ensure(h + 2)) { drawHead(); y -= headH; } // header repeats on every new page
      const voided = table.rowMeta?.[r]?.voided;
      drawRow(cells, lines, h, { fill: r % 2 ? COL.zebra : undefined, voided });
      rule(y - h, COL.line, 0.4); y -= h;
    });
    if (table.foot) {
      const lines = rowLines(table.foot, true), h = heightOf(lines);
      if (ensure(h + 2)) { drawHead(); y -= headH; }
      drawRow(table.foot, lines, h, { bold: true, fill: COL.band }); rule(y - h, COL.accent, 1); y -= h;
    }
    y -= 12;
  };
  (doc.tables || []).forEach(drawTable);

  // ---------- totals ----------
  if (doc.totals?.length) {
    const bw = 230, x0 = rtl ? M : M + W - bw;
    ensure(doc.totals.length * 20 + 12);
    doc.totals.forEach((tt) => {
      const sz = tt.strong ? 11 : 9.5;
      if (tt.strong) { page.drawRectangle({ x: x0, y: y - 20, width: bw, height: 22, color: COL.band }); }
      drawText(tt.label, x0 + 8, x0 + bw - 8, y - 14, sz, { bold: !!tt.strong, color: tt.strong ? COL.text : COL.mut });
      drawText(tt.value, x0 + 8, x0 + bw - 8, y - 14, sz, { bold: true, align: "end" });
      y -= 21;
    });
    y -= 8;
  }
  if (doc.notes) {
    const lines = wrap(doc.notes, W, 9, false);
    ensure(lineH(9) * lines.length + 22);
    drawText(doc.notesLabel || "", M, M + W, y - 8, 8, { color: COL.mut }); y -= 14;
    lines.forEach((ln) => { drawText(ln, M, M + W, y - 8, 9); y -= lineH(9); });
    y -= 6;
  }
  if (doc.legend) { const lines = wrap(doc.legend, W, 8, false); ensure(lineH(8) * lines.length + 6); lines.forEach((ln) => { drawText(ln, M, M + W, y - 8, 8, { color: COL.mut }); y -= lineH(8); }); }

  // ---------- footer + page numbers (second pass: total pages known) ----------
  const sHalf = rtl ? [M + W / 2, M + W] : [M, M + W / 2], eHalf = rtl ? [M, M + W / 2] : [M + W / 2, M + W];
  pages.forEach((p, i) => {
    page = p;
    rule(M + 16, COL.line, 0.6);
    drawText([doc.generatedLabel, doc.generated].filter(Boolean).join(": "), sHalf[0], sHalf[1], M + 4, 7.5, { color: COL.mut });
    drawText(doc.pageLabel(i + 1, pages.length), eHalf[0], eHalf[1], M + 4, 8, { color: COL.mut, align: "end", bold: true });
    if (doc.footerNote) drawText(doc.footerNote, M + W / 4, M + 3 * W / 4, M - 8, 7.5, { color: COL.mut, align: "center" });
  });
  return pdf.save();
}

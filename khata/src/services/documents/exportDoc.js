import { download, toCsv } from "../../utils/csvUtils";
import { printHTML } from "../../utils/printUtils";
import { docToCsv } from "./builders";
import { toHtml } from "./html";

export const printDoc = (doc) => printHTML(toHtml(doc));
export const exportCsv = (doc, name) => download(name, toCsv(docToCsv(doc)));

// Generates a real PDF file (not renamed HTML) and downloads it. The PDF engine is loaded only when needed.
export async function downloadPdf(doc, filename) {
  const { renderPdf } = await import("../pdf/pdfRenderer");
  const bytes = await renderPdf(doc);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return bytes;
}

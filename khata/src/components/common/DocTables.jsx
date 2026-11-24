import { cx } from "../../utils/formatting";
import { DataTable, EmptyState, Td } from "./DataTable";

const text = (c) => (c && typeof c === "object" ? c.text : c);

// Shows the tables of a document model on screen (same data that goes into print and PDF)
export function DocTables({ doc }) {
  return (doc.tables || []).map((tb, n) => (
    <div key={n} className="mb-4">
      {tb.heading && <h3 className="mb-1 mt-3 font-semibold text-emerald-700">{tb.heading}</h3>}
      <DataTable head={tb.columns.map((c) => c.label)} right={tb.columns.map((c, i) => (c.align === "end" ? i : -1)).filter((i) => i >= 0)}>
        {tb.rows.map((r, i) => <tr key={i} className={cx(tb.rowMeta?.[i]?.voided && "text-slate-400 line-through")}>{r.map((c, k) => <Td key={k} r={tb.columns[k].align === "end"}>{c && typeof c === "object" && c.dir === "ltr" ? <bdi dir="ltr">{text(c)}</bdi> : <bdi>{text(c)}</bdi>}</Td>)}</tr>)}
        {!tb.rows.length && <EmptyState cols={tb.columns.length} text={tb.empty || "–"} />}
        {tb.foot && <tr className="bg-slate-50 font-bold">{tb.foot.map((c, k) => <Td key={k} r={tb.columns[k].align === "end"}>{text(c)}</Td>)}</tr>}
      </DataTable>
    </div>
  ));
}

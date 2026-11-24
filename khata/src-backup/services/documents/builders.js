import { getDir, getLang, t } from "../../i18n";
import { bal, buildLedger, filterRows, statementFor } from "../../utils/ledger";
import { fmtDateTime, fmtNum, nowISO, rs, today } from "../../utils/formatting";
import { methodLabel, unitLabel } from "../../utils/labels";

// Every printable thing (ledger statement, receipt, reports) is built as ONE document model.
// The same model is drawn as HTML (print) and as a real PDF. Only labels are translated; saved data is never changed.
let fallbackShop = "";
export const setShopFallback = (name) => { fallbackShop = name || ""; };

export const typeLabel = (kind) => t(`types.${kind}`);
const amt = (n) => (n ? fmtNum(n) : "–");
const adjAmt = (n) => (n ? `${n > 0 ? "+" : "-"}${fmtNum(Math.abs(n))}` : "–");
const ltr = (text) => ({ text: String(text ?? ""), dir: "ltr" });
const dateOf = (iso) => (iso ? iso.slice(0, 10) : "–");

export const shopOf = (db) => ({ name: db.settings?.shopName || fallbackShop || t("app.name"), phone: db.settings?.phone || "", address: db.settings?.address || "", note: db.settings?.note || "" });

const base = (db, title, extra = {}) => {
  const shop = shopOf(db);
  return { shop, title, lang: getLang(), dir: getDir(), generated: fmtDateTime(today(), nowISO()), generatedLabel: t("doc.generated"), pageLabel: (n, total) => t("doc.page", { n, total }), footerNote: shop.note, legend: t("doc.currencyNote"), tables: [], header: [], summary: [], totals: [], ...extra };
};

const describe = (r) => {
  if (r.kind === "purchase") return r.items.map((i) => `${i.name} (${i.qty} ${unitLabel(i.unit)})`).join(", ") + (r.note ? ` — ${r.note}` : "");
  const parts = [];
  if (r.kind === "payment" && r.method) parts.push(methodLabel(r.method));
  if (r.note) parts.push(r.note);
  return parts.join(" — ") || typeLabel(r.kind);
};

export const ledgerColumns = () => [
  { label: t("ledger.colDateTime"), width: 1.25 }, { label: t("ledger.colId"), width: 1.05 }, { label: t("ledger.colType"), width: 1 },
  { label: t("ledger.colDescription"), width: 2.4 }, { label: t("ledger.colUdhaar"), width: 1, align: "end" }, { label: t("ledger.colPayment"), width: 1, align: "end" },
  { label: t("ledger.colAdj"), width: 1, align: "end" }, { label: t("ledger.colBalance"), width: 1.1, align: "end" },
];

export function buildLedgerDoc(db, cnic, filters = {}) {
  const L = buildLedger(db, cnic);
  const c = L.customer || { name: cnic, phone: "", address: "" };
  const st = statementFor(L, { from: filters.from, to: filters.to });
  const extraFilter = !!(filters.kind || filters.method || filters.search);
  const rows = filterRows(st.rows, { kind: filters.kind, method: filters.method, search: filters.search });
  const live = rows.filter((r) => !r.voided);
  const sum = (f) => live.reduce((a, r) => a + f(r), 0);
  const totals = extraFilter ? { udhaar: sum((r) => r.udhaar), payments: sum((r) => r.payment), adjustments: sum((r) => r.adj) } : st.totals;
  const period = filters.from || filters.to ? t("reports.period", { from: filters.from || "…", to: filters.to || "…" }) : t("doc.allDates");
  const first = [ltr(period.length < 0 ? "" : ""), "", "", { text: st.startsAtBeginning ? t("doc.openingBalance") : t("doc.broughtForward"), bold: true }, "", "", "", { text: fmtNum(st.openingAt), bold: true }];
  const body = rows.map((r) => [ltr(fmtDateTime(r.date, r.createdAt)), ltr(r.ref), typeLabel(r.kind) + (r.voided ? ` (${t("ledger.voided")})` : ""), describe(r), amt(r.udhaar), amt(r.payment), adjAmt(r.adj), fmtNum(r.balance)]);
  first[0] = "";
  const doc = base(db, t("doc.statement"), {
    kind: "ledger",
    header: [[t("common.name"), c.name], [t("common.phone"), c.phone], [t("doc.cnic"), c.cnic || cnic], [t("common.address"), c.address], [t("doc.period"), period], [t("doc.registered"), dateOf(c.createdAt) === "–" ? "–" : dateOf(c.createdAt)]],
    summary: [
      { label: t("doc.openingBalance"), value: rs(st.openingAt) }, { label: t("doc.totalUdhaar"), value: rs(totals.udhaar) }, { label: t("doc.totalPayments"), value: rs(totals.payments) },
      { label: t("doc.returnsAdjustments"), value: rs(totals.adjustments) }, { label: t("doc.finalBalance"), value: rs(st.closingAt), strong: true },
      ...(st.closingAt !== L.summary.balance ? [{ label: t("doc.currentBalance"), value: rs(L.summary.balance) }] : []),
    ],
    tables: [{ columns: ledgerColumns(), rows: [first, ...body], rowMeta: [{}, ...rows.map((r) => ({ voided: r.voided }))], foot: ["", "", "", t("doc.totals"), fmtNum(totals.udhaar), fmtNum(totals.payments), adjAmt(totals.adjustments), fmtNum(st.closingAt)], empty: t("doc.noRows") }],
    legend: [t("doc.currencyNote"), extraFilter ? t("doc.filteredNote") : ""].filter(Boolean).join(" "),
  });
  doc.ledgerCsv = ledgerCsvRows(rows);
  return doc;
}

export const ledgerCsvRows = (rows) => [
  [t("ledger.colId"), t("common.date"), t("ledger.time"), t("ledger.colType"), t("common.item"), t("common.total"), t("ledger.paid"), t("ledger.remaining"), t("ledger.colUdhaar"), t("ledger.colPayment"), t("ledger.colAdj"), t("ledger.colBalance"), t("common.method"), t("common.note"), t("ledger.created"), t("ledger.updated"), t("common.status")],
  ...rows.map((r) => [r.ref, r.date, r.createdAt ? fmtDateTime("", r.createdAt).trim() : "", typeLabel(r.kind), r.items.map((i) => `${i.name} x${i.qty} ${unitLabel(i.unit)} @${i.price}`).join("; "), r.total, r.kind === "purchase" ? r.paid + (r.linkedPaid || 0) : r.paid, r.kind === "purchase" ? r.remaining : "", r.udhaar, r.payment, r.adj, r.balance, methodLabel(r.method), r.note, r.createdAt || "", r.updatedAt || "", r.voided ? t("ledger.voided") : t("ledger.valid")]),
];

export function buildReceiptDoc(db, tx) {
  const c = db.customers.find((x) => x.cnic === tx.cnic) || { name: tx.cnic, phone: "", address: "" };
  const isSale = tx.kind === "purchase";
  const doc = base(db, tx.kind === "payment" ? t("doc.paymentReceipt") : t("doc.receipt"), {
    kind: "receipt", subtitle: tx.voided ? t("ledger.voidedNotice") : "", subtitleTone: "red",
    header: [[t("doc.receiptNo"), tx.ref], [t("doc.dateTime"), fmtDateTime(tx.date, tx.createdAt)], [t("common.customer"), c.name], [t("common.phone"), c.phone], [t("doc.cnic"), tx.cnic], [t("common.address"), c.address], [t("doc.type"), typeLabel(tx.kind)], [t("common.method"), methodLabel(tx.method) || "–"]],
    notes: tx.note, notesLabel: t("common.note"),
  });
  if (isSale) {
    doc.tables = [{ columns: [{ label: t("common.item"), width: 3 }, { label: t("common.qty"), width: 1, align: "end" }, { label: t("common.unit"), width: 1 }, { label: t("common.rate"), width: 1.2, align: "end" }, { label: t("common.total"), width: 1.3, align: "end" }],
      rows: tx.items.map((i) => [i.name, ltr(i.qty), unitLabel(i.unit), fmtNum(i.price), fmtNum(i.qty * i.price)]) }];
    doc.totals = [{ label: t("common.total"), value: rs(tx.total) }, { label: t("ledger.paid"), value: rs(tx.paid + (tx.linkedPaid || 0)) }, { label: t("ledger.remaining"), value: rs(tx.remaining), strong: true }, { label: t("ledger.balanceAfter"), value: rs(tx.balance) }];
  } else {
    const link = tx.entryId ? [[t("ledger.againstTx"), `PUR-${String(tx.entryId).padStart(4, "0")}`]] : [];
    doc.header.push(...link);
    doc.totals = [{ label: tx.kind === "payment" ? t("doc.receivedAmount") : t("common.amount"), value: rs(tx.total), strong: true }, { label: t("ledger.balanceAfter"), value: rs(tx.balance) }];
  }
  return doc;
}

const period = (o) => (o.from || o.to ? t("reports.period", { from: o.from || "…", to: o.to || "…" }) : "");
const inRange = (d, o) => (!o.from || d >= o.from) && (!o.to || d <= o.to);

export function allTx(db, o = {}) {
  return db.customers.flatMap((c) => buildLedger(db, c.cnic).rows.map((r) => ({ ...r, customer: c.name }))).filter((r) => inRange(r.date, o)).sort((a, b) => a.date.localeCompare(b.date) || String(a.createdAt || "").localeCompare(String(b.createdAt || "")) || a.id - b.id);
}

export const REPORT_KEYS = ["outstanding", "customers", "transactions", "payments", "items", "dateWise", "summary"];
export const reportTitle = (k) => t({ outstanding: "reports.repOutstanding", customers: "reports.repCustomers", transactions: "reports.repTransactions", payments: "reports.repPayments", items: "reports.repItems", dateWise: "reports.repDw", summary: "reports.repSummary" }[k]);

export function buildReportDoc(db, key, o = {}) {
  const doc = base(db, reportTitle(key), { kind: "report", subtitle: ["transactions", "payments", "dateWise"].includes(key) ? period(o) : "" });
  const ledgers = db.customers.map((c) => ({ c, L: buildLedger(db, c.cnic) }));
  if (key === "outstanding") {
    const rows = ledgers.filter(({ c, L }) => !c.arch && L.summary.balance !== 0).sort((a, b) => b.L.summary.balance - a.L.summary.balance);
    doc.tables = [{ columns: [{ label: t("reports.colCnic"), width: 1.6 }, { label: t("common.name"), width: 2 }, { label: t("common.phone"), width: 1.4 }, { label: t("ledger.lastTx"), width: 1.2 }, { label: t("customers.colBalance"), width: 1.3, align: "end" }],
      rows: rows.map(({ c, L }) => [ltr(c.cnic), c.name, ltr(c.phone), ltr(L.summary.lastTxDate || "–"), fmtNum(L.summary.balance)]), foot: ["", t("reports.totalOutstanding"), "", "", fmtNum(rows.reduce((a, r) => a + Math.max(0, r.L.summary.balance), 0))], empty: t("reports.empty") }];
  } else if (key === "customers") {
    doc.tables = [{ columns: [{ label: t("reports.colCnic"), width: 1.5 }, { label: t("common.name"), width: 1.6 }, { label: t("common.phone"), width: 1.2 }, { label: t("common.address"), width: 1.8 }, { label: t("customers.opening"), width: 1, align: "end" }, { label: t("doc.totalUdhaar"), width: 1, align: "end" }, { label: t("doc.totalPayments"), width: 1, align: "end" }, { label: t("customers.colBalance"), width: 1, align: "end" }, { label: t("common.status"), width: 0.9 }],
      rows: ledgers.map(({ c, L }) => [ltr(c.cnic), c.name, ltr(c.phone), c.address, fmtNum(L.summary.opening), fmtNum(L.summary.totalUdhaar), fmtNum(L.summary.totalPayments), fmtNum(L.summary.balance), c.arch ? t("common.archived") : t("common.active")]), empty: t("customers.empty") }];
  } else if (key === "transactions") {
    const rows = allTx(db, o);
    const lv = rows.filter((r) => !r.voided), s = (f) => lv.reduce((a, r) => a + f(r), 0);
    doc.tables = [{ columns: [{ label: t("ledger.colDateTime"), width: 1.3 }, { label: t("ledger.colId"), width: 1.1 }, { label: t("common.customer"), width: 1.5 }, { label: t("ledger.colType"), width: 1 }, { label: t("ledger.colDescription"), width: 2 }, { label: t("ledger.colUdhaar"), width: 1, align: "end" }, { label: t("ledger.colPayment"), width: 1, align: "end" }, { label: t("ledger.colAdj"), width: 1, align: "end" }],
      rows: rows.map((r) => [ltr(fmtDateTime(r.date, r.createdAt)), ltr(r.ref), r.customer, typeLabel(r.kind) + (r.voided ? ` (${t("ledger.voided")})` : ""), describe(r), amt(r.udhaar), amt(r.payment), adjAmt(r.adj)]), rowMeta: rows.map((r) => ({ voided: r.voided })),
      foot: ["", "", "", "", t("doc.totals"), fmtNum(s((r) => r.udhaar)), fmtNum(s((r) => r.payment)), adjAmt(s((r) => r.adj))], empty: t("reports.empty") }];
  } else if (key === "payments") {
    const rows = allTx(db, o).filter((r) => r.payment > 0);
    doc.tables = [{ columns: [{ label: t("ledger.colDateTime"), width: 1.3 }, { label: t("ledger.colId"), width: 1.1 }, { label: t("common.customer"), width: 1.8 }, { label: t("common.method"), width: 1.2 }, { label: t("common.note"), width: 2 }, { label: t("common.amount"), width: 1.1, align: "end" }],
      rows: rows.map((r) => [ltr(fmtDateTime(r.date, r.createdAt)), ltr(r.ref), r.customer, methodLabel(r.method) || "–", r.note, fmtNum(r.payment)]), rowMeta: rows.map((r) => ({ voided: r.voided })),
      foot: ["", "", "", "", t("common.total"), fmtNum(rows.filter((r) => !r.voided).reduce((a, r) => a + r.payment, 0))], empty: t("reports.empty") }];
  } else if (key === "items") {
    const used = {};
    db.entries.filter((e) => !e.voided).forEach((e) => e.lines.forEach((l) => { const k = l.name.toLowerCase(); used[k] = (used[k] || 0) + 1; }));
    doc.tables = [{ columns: [{ label: t("common.item"), width: 3 }, { label: t("common.unit"), width: 1.2 }, { label: t("items.colPrice"), width: 1.4, align: "end" }, { label: t("items.timesSold"), width: 1.2, align: "end" }, { label: t("common.status"), width: 1.2 }],
      rows: db.items.map((i) => [i.name, unitLabel(i.unit), fmtNum(i.price), ltr(used[i.name.toLowerCase()] || 0), i.on ? t("common.active") : t("common.inactive")]), empty: t("items.empty") }];
  } else if (key === "dateWise") {
    const m = {};
    allTx(db, o).filter((r) => !r.voided).forEach((r) => { const x = (m[r.date] ||= { u: 0, p: 0 }); x.u += r.udhaar; x.p += r.payment; });
    const days = Object.keys(m).sort();
    doc.tables = [{ columns: [{ label: t("common.date"), width: 1.4 }, { label: t("reports.colCredit"), width: 1, align: "end" }, { label: t("reports.colRecovery"), width: 1, align: "end" }, { label: t("reports.colDiff"), width: 1, align: "end" }],
      rows: days.map((d) => [ltr(d), fmtNum(m[d].u), fmtNum(m[d].p), adjAmt(m[d].u - m[d].p)]), empty: t("reports.empty") }];
  } else { // summary
    const active = ledgers.filter(({ c }) => !c.arch);
    const day = today(), tx = allTx(db);
    const todays = tx.filter((r) => r.date === day && !r.voided);
    doc.header = [[t("dashboard.totalCustomers"), String(active.length)], [t("dashboard.receivable"), rs(active.reduce((a, { L }) => a + Math.max(0, L.summary.balance), 0))], [t("dashboard.todayCredit"), rs(todays.reduce((a, r) => a + r.udhaar, 0))], [t("dashboard.todayPayments"), rs(todays.reduce((a, r) => a + r.payment, 0))], [t("dashboard.transactions"), String(tx.filter((r) => !r.voided).length)], [t("doc.asOf"), day]];
    const top = [...active].sort((a, b) => b.L.summary.balance - a.L.summary.balance).slice(0, 10).filter((x) => x.L.summary.balance > 0);
    doc.tables = [
      { heading: t("dashboard.topOutstanding"), columns: [{ label: t("common.name"), width: 2 }, { label: t("common.phone"), width: 1.4 }, { label: t("customers.colBalance"), width: 1.2, align: "end" }], rows: top.map(({ c, L }) => [c.name, ltr(c.phone), fmtNum(L.summary.balance)]), empty: t("reports.empty") },
      { heading: t("dashboard.recent"), columns: [{ label: t("ledger.colDateTime"), width: 1.4 }, { label: t("ledger.colId"), width: 1.1 }, { label: t("common.customer"), width: 1.6 }, { label: t("ledger.colType"), width: 1 }, { label: t("common.amount"), width: 1, align: "end" }], rows: tx.slice(-10).reverse().map((r) => [ltr(fmtDateTime(r.date, r.createdAt)), ltr(r.ref), r.customer, typeLabel(r.kind), fmtNum(r.total)]), empty: t("reports.empty") },
    ];
  }
  return doc;
}

export const docToCsv = (doc) => doc.ledgerCsv || doc.tables.flatMap((tb) => [tb.columns.map((c) => c.label), ...tb.rows.map((r) => r.map((c) => (c && typeof c === "object" ? c.text : c))), ...(tb.foot ? [tb.foot.map((c) => (c && typeof c === "object" ? c.text : c))] : [])]);
export { bal };

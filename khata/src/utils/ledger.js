// ONE calculation system for the whole app (Dashboard, Customers, Payments, Reports, Ledger, PDFs).
// Balance = opening + udhaar (credit given) - payments + adjustments (returns are negative adjustments).
// Voided transactions stay in the history but never count. Filters never touch these numbers.
const num = (v) => Number(v) || 0;

export const etot = (e) => e.lines.reduce((a, l) => a + l.qty * l.price, 0);
export const KINDS = ["purchase", "udhaar", "payment", "return", "adjustment"];
const PREFIX = { purchase: "PUR", udhaar: "UDH", payment: "PAY", return: "RET", adjustment: "ADJ" };
export const txRef = (kind, id) => `${PREFIX[kind]}-${String(id).padStart(4, "0")}`;

const base = (kind, id, o) => ({ kind, id, ref: txRef(kind, id), cnic: o.cnic, date: o.date, createdAt: o.createdAt, updatedAt: o.updatedAt, note: o.note || "", voided: !!o.voided, voidReason: o.voidReason || "", history: o.history || [], raw: o });

const fromEntry = (e) => { const total = etot(e), paid = Math.min(num(e.paid), total); return { ...base("purchase", e.id, e), key: `e${e.id}`, source: "entry", items: e.lines, total, paid, udhaar: total, payment: paid, adj: 0, method: paid > 0 ? e.paidMethod || "" : "" }; };
const fromPayment = (p) => ({ ...base("payment", p.id, p), key: `p${p.id}`, source: "payment", items: [], total: num(p.amount), paid: num(p.amount), udhaar: 0, payment: num(p.amount), adj: 0, method: p.method || "", entryId: p.entryId || null });
const fromMisc = (m) => {
  const amt = num(m.amount);
  const udhaar = m.type === "udhaar" ? amt : 0;
  const adj = m.type === "return" ? -amt : m.type === "adjustment" ? (m.direction === "increase" ? amt : -amt) : 0;
  return { ...base(m.type, m.id, m), key: `m${m.id}`, source: "misc", items: [], total: amt, paid: 0, udhaar, payment: 0, adj, method: "", direction: m.direction };
};

const cmp = (a, b) => a.date.localeCompare(b.date) || String(a.createdAt || "").localeCompare(String(b.createdAt || "")) || a.id - b.id;

export function customerTx(db, cnic) {
  const list = [
    ...db.entries.filter((e) => e.cnic === cnic).map(fromEntry),
    ...db.payments.filter((p) => p.cnic === cnic).map(fromPayment),
    ...(db.misc || []).filter((m) => m.cnic === cnic).map(fromMisc),
  ].sort(cmp);
  const linked = {};
  list.forEach((x) => { if (x.kind === "payment" && x.entryId && !x.voided) linked[x.entryId] = (linked[x.entryId] || 0) + x.payment; });
  list.forEach((x) => { if (x.kind === "purchase") { x.linkedPaid = linked[x.id] || 0; x.remaining = Math.max(0, x.total - x.paid - x.linkedPaid); } });
  return list;
}

export function buildLedger(db, cnic) {
  const customer = db.customers.find((c) => c.cnic === cnic);
  const opening = num(customer?.opening);
  let balance = opening;
  const rows = customerTx(db, cnic).map((x) => {
    if (!x.voided) balance += x.udhaar - x.payment + x.adj;
    return { ...x, balance };
  });
  const live = rows.filter((r) => !r.voided);
  const sum = (f) => live.reduce((a, r) => a + f(r), 0);
  const maxDate = (arr) => arr.reduce((m, r) => (r.date > m ? r.date : m), "") || null;
  return {
    customer, rows,
    summary: {
      opening, balance, count: live.length,
      totalUdhaar: sum((r) => r.udhaar), totalPurchases: sum((r) => (r.kind === "purchase" ? r.total : 0)),
      totalPayments: sum((r) => r.payment), netAdjustments: sum((r) => r.adj),
      lastTxDate: maxDate(live), lastPaymentDate: maxDate(live.filter((r) => r.payment > 0)),
    },
  };
}

export const bal = (db, cnic) => buildLedger(db, cnic).summary.balance;
export const findTx = (db, cnic, key) => buildLedger(db, cnic).rows.find((r) => r.key === key);

// ---- filters (display only; running balances always come from the full ledger) ----
const iso = (d) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
export function presetRange(name, now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const addDays = (x, n) => new Date(x.getFullYear(), x.getMonth(), x.getDate() + n);
  if (name === "today") return { from: iso(d), to: iso(d) };
  if (name === "yesterday") { const y = addDays(d, -1); return { from: iso(y), to: iso(y) }; }
  if (name === "week") { const mon = addDays(d, -((d.getDay() + 6) % 7)); return { from: iso(mon), to: iso(addDays(mon, 6)) }; }
  if (name === "month") return { from: iso(new Date(d.getFullYear(), d.getMonth(), 1)), to: iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)) };
  if (name === "lastMonth") return { from: iso(new Date(d.getFullYear(), d.getMonth() - 1, 1)), to: iso(new Date(d.getFullYear(), d.getMonth(), 0)) };
  return { from: "", to: "" };
}

export function filterRows(rows, { from = "", to = "", kind = "", method = "", search = "" } = {}) {
  const q = search.trim().toLowerCase();
  return rows.filter((r) => {
    if (from && r.date < from) return false;
    if (to && r.date > to) return false;
    if (kind && r.kind !== kind) return false;
    if (method && r.method !== method) return false;
    if (q) {
      const hay = [r.ref, r.note, r.method, ...r.items.map((i) => i.name), String(r.total)].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// Statement for a date range: opening = real balance just before `from`, closing = real balance at the end of `to`
export function statementFor(ledger, { from = "", to = "" } = {}) {
  const { rows, summary } = ledger;
  let openingAt = summary.opening;
  for (const r of rows) { if (from && r.date < from) openingAt = r.balance; }
  let closingAt = openingAt;
  const inRange = rows.filter((r) => (!from || r.date >= from) && (!to || r.date <= to));
  if (inRange.length) closingAt = inRange[inRange.length - 1].balance;
  const live = inRange.filter((r) => !r.voided);
  const sum = (f) => live.reduce((a, r) => a + f(r), 0);
  return { openingAt, closingAt, rows: inRange, totals: { udhaar: sum((r) => r.udhaar), payments: sum((r) => r.payment), adjustments: sum((r) => r.adj) }, startsAtBeginning: !from || !rows.some((r) => r.date < from) };
}

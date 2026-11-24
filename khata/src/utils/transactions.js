import { nowISO } from "./formatting";

// Every saved record carries created/updated timestamps. Edits never overwrite silently:
// the old values are kept in rec.history.
export const stamp = (rec) => { const now = nowISO(); return { ...rec, createdAt: now, updatedAt: now }; };

export function applyChanges(rec, changes, action = "edit", reason = "") {
  const diff = {};
  Object.entries(changes).forEach(([k, v]) => { if (JSON.stringify(rec[k]) !== JSON.stringify(v)) diff[k] = [rec[k] ?? null, v]; });
  if (!Object.keys(diff).length && action === "edit") return false;
  Object.keys(changes).forEach((k) => { rec[k] = changes[k]; });
  const now = nowISO();
  rec.updatedAt = now;
  rec.history = [...(rec.history || []), { at: now, action, changes: diff, reason }];
  return true;
}

// Same customer + same details saved again within 15 seconds = probably a double click
const RECENT_MS = 15000;
const recent = (x) => x.createdAt && Date.now() - new Date(x.createdAt).getTime() < RECENT_MS;
export function isDuplicate(db, source, cand) {
  if (source === "entry") return db.entries.some((e) => recent(e) && e.cnic === cand.cnic && e.date === cand.date && JSON.stringify(e.lines) === JSON.stringify(cand.lines));
  if (source === "payment") return db.payments.some((p) => recent(p) && p.cnic === cand.cnic && p.date === cand.date && p.amount === cand.amount && p.method === cand.method);
  return (db.misc || []).some((m) => recent(m) && m.cnic === cand.cnic && m.type === cand.type && m.date === cand.date && m.amount === cand.amount && m.direction === cand.direction);
}

// Records saved by older versions get the new fields without losing anything
export function normalizeDb(d) {
  const db = d || {};
  db.nid = db.nid || 1;
  ["customers", "items", "entries", "payments", "misc"].forEach((k) => { if (!Array.isArray(db[k])) db[k] = []; });
  db.settings = { shopName: "", phone: "", address: "", note: "", ...(db.settings || {}) };
  return db;
}

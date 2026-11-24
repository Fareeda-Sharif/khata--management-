import { seed } from "../data/initialData";
import { normalizeDb } from "../utils/transactions";
import { api } from "./apiClient";
import { LOCAL_MODE } from "./mode";

const emptyData = () => normalizeDb({ nid: 1, customers: [], items: [], entries: [], payments: [] });
const isValid = (d) => d && Array.isArray(d.customers) && Array.isArray(d.items) && Array.isArray(d.entries) && Array.isArray(d.payments);
const LOCAL_KEY = "khata-local-db";

async function loadLocal() {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (raw) { const d = JSON.parse(raw); if (isValid(d)) return { db: normalizeDb(d), version: 0 }; }
  } catch { /* storage unavailable: start with demo data */ }
  return { db: normalizeDb(seed()), version: 0 };
}
async function saveLocal(db) {
  try { window.localStorage.setItem(LOCAL_KEY, JSON.stringify(db)); } catch { /* ignore */ }
  return { version: 0 };
}

export async function loadData() {
  if (LOCAL_MODE) return loadLocal();
  const r = await api("/api/data");
  return { db: isValid(r.db) ? normalizeDb(r.db) : emptyData(), version: r.version || 0 };
}

// The server returns the new version number; saving old data gives a 409 conflict
export async function saveData(db, version) {
  if (LOCAL_MODE) return saveLocal(db);
  return api("/api/data", { method: "PUT", body: { db, version } });
}

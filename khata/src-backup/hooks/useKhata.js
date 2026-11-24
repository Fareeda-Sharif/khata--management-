import { useEffect, useRef, useState } from "react";
import { loadData, saveData } from "../services/storageService";

export function useKhata(onUnauthorized) {
  const [db, setDb] = useState(null);
  const [loadError, setLoadError] = useState(null); // ApiError (shown in the current language by Workspace)
  const [saveError, setSaveError] = useState(null);
  const dbRef = useRef(null);
  const versionRef = useRef(0);
  const justLoaded = useRef(false);
  const saving = useRef(false);
  const again = useRef(false);

  const fail = (e, show) => {
    if (e.status === 401) return onUnauthorized();
    show(e);
  };

  useEffect(() => {
    loadData()
      .then(({ db: d, version }) => { versionRef.current = version; justLoaded.current = true; setDb(d); })
      .catch((e) => fail(e, setLoadError));
  }, []);

  // Only one save runs at a time; if data changes meanwhile, one more save follows
  const flush = async () => {
    if (saving.current) { again.current = true; return; }
    saving.current = true;
    try {
      do {
        again.current = false;
        const r = await saveData(dbRef.current, versionRef.current);
        versionRef.current = r.version;
      } while (again.current);
      setSaveError(null);
    } catch (e) {
      fail(e, setSaveError);
    } finally {
      saving.current = false;
    }
  };

  useEffect(() => {
    if (!db) return;
    dbRef.current = db;
    if (justLoaded.current) { justLoaded.current = false; return; }
    const t = setTimeout(flush, 500);
    return () => clearTimeout(t);
  }, [db]);

  const upd = (fn) => setDb((d) => fn(structuredClone(d)));
  return { db, setDb, upd, loadError, saveError };
}

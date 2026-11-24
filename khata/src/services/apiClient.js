const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const KEY = "khata-session";

// code: server or client error code (e.g. "conflict"); the message is shown in the current language
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const getSession = () => {
  try { return JSON.parse(window.localStorage.getItem(KEY)); } catch { return null; }
};
export const setSession = (s) => window.localStorage.setItem(KEY, JSON.stringify(s));
export const clearSession = () => window.localStorage.removeItem(KEY);

export async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const s = getSession();
  if (auth && s) headers.Authorization = "Bearer " + s.token;
  let res;
  try {
    res = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError("Could not connect to the server", 0, "network");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || "Server error " + res.status, res.status, data.code || "server");
  return data;
}

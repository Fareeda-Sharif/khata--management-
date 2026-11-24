import { api, clearSession, setSession } from "./apiClient";

export async function login(username, password) {
  const s = await api("/api/auth/login", { method: "POST", body: { username, password }, auth: false });
  setSession(s);
  return s;
}

export async function register(shopName, username, password) {
  const s = await api("/api/auth/register", { method: "POST", body: { shopName, username, password }, auth: false });
  setSession(s);
  return s;
}

export const logout = clearSession;

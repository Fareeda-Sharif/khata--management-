import { useState } from "react";
import { Login } from "./pages/auth/Login";
import { clearSession, getSession } from "./services/apiClient";
import { LOCAL_MODE } from "./services/mode";
import { Workspace } from "./Workspace";

export default function App() {
  const [session, setSession] = useState(getSession);
  const logout = () => { clearSession(); setSession(null); };

  if (LOCAL_MODE) return <Workspace session={{ shopName: "", username: "local" }} />;
  if (!session) return <Login onDone={setSession} />;
  return <Workspace key={session.username} session={session} onLogout={logout} />;
}

import { useState } from "react";
// import { Login } from "./pages/auth/Login";
import { clearSession, getSession } from "./services/apiClient";
import { LOCAL_MODE } from "./services/mode";
import { Workspace } from "./Workspace";

const GUEST_SESSION = { shopName: "", username: "local" };

export default function App() {
  console.log("LOCAL_MODE =", LOCAL_MODE);

  const [session, setSession] = useState(getSession);
  const logout = () => { clearSession(); setSession(null); };

  if (LOCAL_MODE) return <Workspace session={GUEST_SESSION} />;
  // if (!session) return <Login onDone={setSession} />;
  return <Workspace key={(session || GUEST_SESSION).username} session={session || GUEST_SESSION} onLogout={logout} />;
}
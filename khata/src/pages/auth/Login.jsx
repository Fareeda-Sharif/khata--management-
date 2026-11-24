import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Input } from "../../components/common/Field";
import { LanguageSwitcher } from "../../components/common/LanguageSwitcher";
import { apiErrorText, useI18n } from "../../i18n";
import { login, register } from "../../services/authService";

export function Login({ onDone }) {
  const { t } = useI18n();
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ shopName: "", username: "", password: "" });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const isLogin = mode === "login";

  const submit = async (e) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const s = isLogin ? await login(f.username, f.password) : await register(f.shopName, f.username, f.password);
      onDone(s);
    } catch (x) {
      setErr(x);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-emerald-900 to-emerald-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-3 flex justify-end"><LanguageSwitcher tone="dark" /></div>
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-400 text-emerald-950"><BookOpen size={24} /></div>
            <div><div className="text-lg font-bold leading-tight">{t("app.name")}</div><div className="text-xs text-slate-500">{isLogin ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}</div></div>
          </div>
          <form onSubmit={submit} className="space-y-3">
            {!isLogin && <Input label={t("auth.shopName")} value={f.shopName} onChange={(e) => set("shopName", e.target.value)} />}
            <Input label={t("auth.username")} dir="ltr" autoComplete="username" value={f.username} onChange={(e) => set("username", e.target.value)} />
            <Input label={t("auth.password")} type="password" autoComplete={isLogin ? "current-password" : "new-password"} value={f.password} onChange={(e) => set("password", e.target.value)} />
            {err && <p className="text-sm text-rose-600">{apiErrorText(err)}</p>}
            <Button type="submit" disabled={busy} className="w-full py-2.5">{busy ? t("auth.busy") : isLogin ? t("auth.login") : t("auth.register")}</Button>
          </form>
          <button type="button" onClick={() => { setMode(isLogin ? "register" : "login"); setErr(null); }} className="mt-4 w-full text-center text-sm font-medium text-emerald-700 hover:underline">
            {isLogin ? t("auth.toRegister") : t("auth.toLogin")}
          </button>
        </Card>
      </div>
    </div>
  );
}

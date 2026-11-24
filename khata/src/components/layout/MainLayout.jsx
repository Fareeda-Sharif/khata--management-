import { Sidebar } from "./Sidebar";

export function MainLayout({ page, setPage, shopName, onLogout, children }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-800 md:flex-row">
      <Sidebar page={page} setPage={setPage} shopName={shopName} onLogout={onLogout} />
      <main className="min-w-0 flex-1 p-4 md:p-8"><div className="mx-auto max-w-6xl">{children}</div></main>
    </div>
  );
}

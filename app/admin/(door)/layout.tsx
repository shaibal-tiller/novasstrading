/** Minimal shell for the shared sign-in door (/admin/login) and the module chooser (/admin). */
export default function AdminDoorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 min-h-screen bg-canvas">
      <header className="border-b border-ink/10 px-6 py-4">
        <span className="field-label">Nova SS Trading — Admin</span>
      </header>
      <main className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-16">{children}</main>
    </div>
  );
}

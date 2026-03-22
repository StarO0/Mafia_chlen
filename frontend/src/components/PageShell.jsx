export default function PageShell({ title, subtitle, children }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-zinc-950 p-4 text-gray-100">
      <section className="mx-auto flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-red-900/60 bg-mafia-card p-4 shadow-xl shadow-red-950/30">
        <header className="border-b border-red-900/40 pb-3">
          <h1 className="text-2xl font-bold text-red-500">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-gray-400">{subtitle}</p> : null}
        </header>
        {children}
      </section>
    </main>
  )
}

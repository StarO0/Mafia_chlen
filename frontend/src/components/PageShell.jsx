import { motion } from 'framer-motion'

export default function PageShell({ title, subtitle, children, phaseTint = 'neutral' }) {
  const tintClass =
    phaseTint === 'day'
      ? 'from-amber-950/40 via-zinc-950 to-zinc-950'
      : phaseTint === 'night'
        ? 'from-indigo-950/50 via-black to-zinc-950'
        : 'from-black via-zinc-950 to-zinc-950'

  return (
    <main className={`min-h-screen bg-gradient-to-b ${tintClass} p-4 pb-8 text-gray-100 transition-colors duration-500`}>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="mx-auto flex w-full max-w-lg flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl"
      >
        <header className="border-b border-white/10 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-red-400">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm leading-relaxed text-gray-400">{subtitle}</p> : null}
        </header>
        {children}
      </motion.section>
    </main>
  )
}

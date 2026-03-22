import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageShell from '../components/PageShell.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import { useSetup } from '../context/SetupContext.jsx'
import { fetchGameHistory } from '../services/api.js'

export default function MainMenuPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { resetSetup } = useSetup()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchGameHistory()
      .then((data) => {
        if (!cancelled) setHistory(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleStartNewGame = useCallback(() => {
    resetSetup()
    navigate('/setup/players', { replace: false })
  }, [navigate, resetSetup])

  return (
    <PageShell title="Mafia Game Master" subtitle="Ассистент ведущего игры">
      <PrimaryButton type="button" onClick={handleStartNewGame}>
        Старт новой игры
      </PrimaryButton>

      <section className="rounded-3xl border border-white/10 bg-black/30 p-4 shadow-inner backdrop-blur-md">
        <h2 className="text-lg font-semibold text-red-300">История игр</h2>
        {loading ? <p className="mt-3 text-sm text-gray-400">Загрузка...</p> : null}
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        {!loading && !error && history.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">История пока пустая</p>
        ) : null}
        <ul className="mt-3 space-y-2">
          {history.map((game, index) => (
            <motion.li
              key={game.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-md backdrop-blur-sm"
            >
              <p className="text-sm font-medium">
                Игра #{game.id} · {game.status}
              </p>
              <p className="text-xs text-gray-400">
                Игроков: {game.totalPlayers} · Фаза: {game.phase}
              </p>
            </motion.li>
          ))}
        </ul>
      </section>
    </PageShell>
  )
}

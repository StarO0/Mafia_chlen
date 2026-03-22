import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    resetSetup()
    fetchGameHistory()
      .then(setHistory)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [resetSetup])

  return (
    <PageShell title="Mafia Game Master" subtitle="Ассистент ведущего игры">
      <PrimaryButton onClick={() => navigate('/setup/players')}>Старт новой игры</PrimaryButton>

      <section className="rounded-xl border border-red-900/40 bg-zinc-950/60 p-4">
        <h2 className="text-lg font-semibold text-red-400">История игр</h2>
        {loading ? <p className="mt-3 text-sm text-gray-400">Загрузка...</p> : null}
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        {!loading && !error && history.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">История пока пустая</p>
        ) : null}
        <ul className="mt-3 space-y-2">
          {history.map((game) => (
            <li key={game.id} className="rounded-lg border border-red-900/30 bg-black/50 p-3">
              <p className="text-sm font-medium">
                Игра #{game.id} · {game.status}
              </p>
              <p className="text-xs text-gray-400">
                Игроков: {game.totalPlayers} · Фаза: {game.phase}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  )
}

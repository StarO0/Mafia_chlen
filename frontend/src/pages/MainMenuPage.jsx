import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import { useSetup } from '../context/SetupContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'
import { fetchGameHistory } from '../services/api.js'

export default function MainMenuPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { resetSetup } = useSetup()
  const { t } = useI18n()

  useEffect(() => {
    let cancelled = false
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
    <PageShell title={t.menu.title} subtitle={t.menu.subtitle}>
      <PrimaryButton type="button" onClick={handleStartNewGame}>
        {t.menu.startNew}
      </PrimaryButton>

      <section className="rounded-3xl border border-white/10 bg-black/30 p-4 shadow-inner backdrop-blur-md">
        <h2 className="text-lg font-semibold text-red-300">{t.menu.history}</h2>
        {loading ? <p className="mt-3 text-sm text-gray-400">{t.common.loading}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        {!loading && !error && history.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">{t.menu.historyEmpty}</p>
        ) : null}
        <ul className="mt-3 space-y-2">
          {history.map((game) => (
            <li
              key={game.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-md backdrop-blur-sm"
            >
              <p className="text-sm font-medium">
                {t.menu.game} #{game.id} · {game.status}
              </p>
              <p className="text-xs text-gray-400">
                {t.menu.players}: {game.totalPlayers} · {t.menu.phase}: {game.phase}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  )
}

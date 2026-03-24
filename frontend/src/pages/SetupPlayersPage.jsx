import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import { useSetup } from '../context/SetupContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'
import { createGame } from '../services/api.js'
import { computeRolesConfig } from '../utils/roles.js'

function buildDefaultNames(count, playerLabel) {
  return Array.from({ length: count }, (_, index) => `${playerLabel} ${index + 1}`)
}

const inputClass =
  'w-full rounded-2xl border border-white/15 bg-black/40 p-4 text-base text-white shadow-inner outline-none ring-red-500/40 backdrop-blur-sm transition focus:ring-2'

export default function SetupPlayersPage() {
  const navigate = useNavigate()
  const { setGameId, players, setPlayers, setRolesConfig } = useSetup()
  const { t } = useI18n()
  const [playerCount, setPlayerCount] = useState(players.length)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const names = useMemo(() => {
    if (players.length === playerCount) return players
    if (players.length > playerCount) return players.slice(0, playerCount)
    return [...players, ...buildDefaultNames(playerCount, t.setupPlayers.defaultPlayer).slice(players.length)]
  }, [playerCount, players, t.setupPlayers.defaultPlayer])

  const handleCountChange = (value) => {
    const next = Number(value)
    if (Number.isNaN(next)) return
    const clamped = Math.max(4, Math.min(20, next))
    setPlayerCount(clamped)
    setPlayers(buildDefaultNames(clamped, t.setupPlayers.defaultPlayer))
    setRolesConfig((prev) => computeRolesConfig(clamped, prev.optionals))
  }

  const updateName = (index, value) => {
    const copy = [...names]
    copy[index] = value
    setPlayers(copy)
  }

  const handleNext = async () => {
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        playerCount,
        playerNames: names.map((n, idx) => n.trim() || `${t.setupPlayers.defaultPlayer} ${idx + 1}`),
      }
      const game = await createGame(payload)
      setGameId(game.id)
      setPlayers(payload.playerNames)
      setRolesConfig((prev) => computeRolesConfig(payload.playerCount, prev.optionals))
      navigate('/setup/roles')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell title={t.setupPlayers.title} subtitle={t.setupPlayers.subtitle}>
      <label className="text-sm font-medium text-gray-300">{t.setupPlayers.playerCount}</label>
      <input className={inputClass} type="number" min={4} max={20} value={playerCount} onChange={(e) => handleCountChange(e.target.value)} />

      <div className="space-y-3">
        {names.map((name, index) => (
          <div key={index}>
            <input className={inputClass} value={name} onChange={(e) => updateName(index, e.target.value)} />
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <PrimaryButton type="button" disabled={submitting} onClick={handleNext}>
        {submitting ? t.setupPlayers.saving : t.setupPlayers.next}
      </PrimaryButton>
    </PageShell>
  )
}

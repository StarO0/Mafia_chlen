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
  const [playerCountInput, setPlayerCountInput] = useState(String(players.length))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const names = useMemo(() => {
    if (players.length === playerCount) return players
    if (players.length > playerCount) return players.slice(0, playerCount)
    return [...players, ...buildDefaultNames(playerCount, t.setupPlayers.defaultPlayer).slice(players.length)]
  }, [playerCount, players, t.setupPlayers.defaultPlayer])

  const handleCountChange = (value) => {
    setPlayerCountInput(value)
  }

  const applyPlayerCount = (raw) => {
    const parsed = Number(raw)
    if (Number.isNaN(parsed)) {
      setPlayerCountInput(String(playerCount))
      return
    }
    const clamped = Math.max(4, Math.min(20, parsed))
    setPlayerCount(clamped)
    setPlayerCountInput(String(clamped))
    setPlayers(buildDefaultNames(clamped, t.setupPlayers.defaultPlayer))
    setRolesConfig((prev) => computeRolesConfig(clamped, prev.optionals))
  }

  const changeByStep = (delta) => {
    applyPlayerCount(String(playerCount + delta))
  }

  const updateName = (index, value) => {
    const copy = [...names]
    copy[index] = value
    setPlayers(copy)
  }

  const handleNext = async () => {
    applyPlayerCount(playerCountInput)
    const effectiveCount = Math.max(4, Math.min(20, Number(playerCountInput) || playerCount))
    const effectiveNames =
      names.length === effectiveCount
        ? names
        : [...names.slice(0, effectiveCount), ...buildDefaultNames(effectiveCount, t.setupPlayers.defaultPlayer).slice(names.length)]

    setSubmitting(true)
    setError('')
    try {
      const payload = {
        playerCount: effectiveCount,
        playerNames: effectiveNames.map((n, idx) => n.trim() || `${t.setupPlayers.defaultPlayer} ${idx + 1}`),
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
      <div className="grid grid-cols-[auto,1fr,auto] gap-2">
        <button
          type="button"
          className="rounded-2xl border border-white/15 bg-zinc-800 px-4 text-lg font-semibold"
          onClick={() => changeByStep(-1)}
          aria-label={t.setupPlayers.decrease}
        >
          -
        </button>
        <input
          className={inputClass}
          type="number"
          min={4}
          max={20}
          value={playerCountInput}
          onChange={(e) => handleCountChange(e.target.value)}
          onBlur={(e) => applyPlayerCount(e.target.value)}
        />
        <button
          type="button"
          className="rounded-2xl border border-white/15 bg-zinc-800 px-4 text-lg font-semibold"
          onClick={() => changeByStep(1)}
          aria-label={t.setupPlayers.increase}
        >
          +
        </button>
      </div>

      <PrimaryButton type="button" disabled={submitting} onClick={handleNext}>
        {submitting ? t.setupPlayers.saving : t.setupPlayers.next}
      </PrimaryButton>

      <div className="space-y-3">
        {names.map((name, index) => (
          <div key={index}>
            <input className={inputClass} value={name} onChange={(e) => updateName(index, e.target.value)} />
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </PageShell>
  )
}

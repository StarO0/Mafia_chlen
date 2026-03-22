import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import { useSetup } from '../context/SetupContext.jsx'
import { createGame } from '../services/api.js'

function buildDefaultNames(count) {
  return Array.from({ length: count }, (_, index) => `Игрок ${index + 1}`)
}

export default function SetupPlayersPage() {
  const navigate = useNavigate()
  const { setGameId, players, setPlayers } = useSetup()
  const [playerCount, setPlayerCount] = useState(players.length)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const names = useMemo(() => {
    if (players.length === playerCount) return players
    if (players.length > playerCount) return players.slice(0, playerCount)
    return [...players, ...buildDefaultNames(playerCount).slice(players.length)]
  }, [playerCount, players])

  const handleCountChange = (value) => {
    const next = Number(value)
    if (Number.isNaN(next)) return
    const clamped = Math.max(4, Math.min(20, next))
    setPlayerCount(clamped)
    setPlayers(buildDefaultNames(clamped))
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
        playerNames: names.map((n, idx) => n.trim() || `Игрок ${idx + 1}`),
      }
      const game = await createGame(payload)
      setGameId(game.id)
      setPlayers(payload.playerNames)
      navigate('/setup/roles')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell title="Настройка игры" subtitle="Шаг 1: количество и имена игроков">
      <label className="text-sm text-gray-300">Количество игроков</label>
      <input
        className="rounded-xl border border-red-900/50 bg-black p-4 text-lg outline-none ring-red-600 focus:ring-2"
        type="number"
        min={4}
        max={20}
        value={playerCount}
        onChange={(e) => handleCountChange(e.target.value)}
      />

      <div className="space-y-2">
        {names.map((name, index) => (
          <input
            key={index}
            className="w-full rounded-xl border border-red-900/50 bg-black p-4 text-base outline-none ring-red-600 focus:ring-2"
            value={name}
            onChange={(e) => updateName(index, e.target.value)}
          />
        ))}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <PrimaryButton disabled={submitting} onClick={handleNext}>
        {submitting ? 'Сохраняем...' : 'Далее'}
      </PrimaryButton>
    </PageShell>
  )
}

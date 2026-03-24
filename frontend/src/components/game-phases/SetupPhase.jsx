import PrimaryButton from '../PrimaryButton.jsx'

function playerRowKey(player) {
  if (player?.id != null) return `player-${player.id}`
  return `seat-${player?.seatIndex ?? 'x'}`
}

export default function SetupPhase({ t, players, onStart, loading }) {
  return (
    <section className="space-y-3 rounded-3xl border border-white/10 bg-black/30 p-4">
      <p className="text-sm text-gray-300">{t.game.setupHint}</p>
      <ul className="space-y-2">
        {players?.map((player) => (
          <li key={playerRowKey(player)} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
            #{player?.seatIndex ?? '—'} {player?.name ?? '—'}{' '}
            <span className="text-gray-400">({player?.role || '—'})</span>
          </li>
        ))}
      </ul>
      <PrimaryButton onClick={onStart} disabled={loading}>
        {loading ? t.common.loading : t.game.startGame}
      </PrimaryButton>
    </section>
  )
}

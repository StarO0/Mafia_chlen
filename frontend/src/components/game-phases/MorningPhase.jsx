import PrimaryButton from '../PrimaryButton.jsx'

function playerRowKey(player) {
  if (player?.id != null) return `player-${player.id}`
  return `seat-${player?.seatIndex ?? 'x'}`
}

export default function MorningPhase({
  t,
  logs,
  totalDayVotesCast,
  alivePlayers,
  dayVoteLimitReached,
  onEliminate,
  onNominate,
  onCastVote,
  onResetVotes,
  deadPlayers,
  onRestore,
  onFinishVoting,
}) {
  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-black/30 p-4">
      <div>
        <h3 className="text-lg font-semibold text-red-300">{t.game.nightResult}</h3>
        <div className="mt-2 rounded-2xl border border-white/10 bg-black/35 p-3 text-xs text-gray-300">
          {(logs ?? []).slice(-3).map((log) => (
            <p key={log?.id}>
              #{log?.sequenceNo ?? '—'} · {log?.message ?? '—'}
            </p>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/35 p-3 text-xs text-gray-300">
        {t.game.votesCast}: <strong className="text-white">{totalDayVotesCast}</strong> / {alivePlayers?.length ?? 0}
        {dayVoteLimitReached ? <span className="ml-2 text-amber-300">{t.game.votesLimitReached}</span> : null}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-200">{t.game.voteOut}</h4>
        {alivePlayers?.map((player) => (
          <div key={playerRowKey(player)} className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-sm">
              #{player?.seatIndex ?? '—'} {player?.name ?? '—'}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button
                type="button"
                className="rounded-xl bg-red-800 p-2 text-xs"
                onClick={() => onEliminate(player?.seatIndex)}
              >
                {t.game.remove}
              </button>
              <button
                type="button"
                className="rounded-xl bg-zinc-700 p-2 text-xs"
                onClick={() => onNominate(player?.seatIndex)}
              >
                {t.game.nominate}
              </button>
              <button
                type="button"
                className="rounded-xl bg-zinc-700 p-2 text-xs disabled:opacity-40"
                disabled={!player?.nominatedToday || dayVoteLimitReached}
                onClick={() => onCastVote(player?.seatIndex)}
              >
                {t.game.addVote}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="w-full rounded-2xl border border-white/15 bg-zinc-800 p-4 text-sm font-semibold"
        onClick={onResetVotes}
      >
        {t.game.resetVoting}
      </button>

      {(deadPlayers?.length ?? 0) > 0 ? (
        <div className="space-y-2 rounded-2xl border border-white/10 bg-black/35 p-3">
          <p className="text-sm font-semibold text-gray-300">{t.game.deadPlayers}</p>
          {deadPlayers?.map((player) => (
            <div key={playerRowKey(player)} className="flex items-center justify-between gap-2 rounded-xl bg-white/5 p-2 text-xs">
              <span>
                #{player?.seatIndex ?? '—'} {player?.name ?? '—'}
              </span>
              <button
                type="button"
                className="rounded-lg bg-zinc-700 px-3 py-1"
                onClick={() => onRestore(player?.seatIndex)}
              >
                {t.game.revive}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <PrimaryButton onClick={onFinishVoting}>{t.game.finishVoting}</PrimaryButton>
    </section>
  )
}

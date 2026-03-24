import PrimaryButton from '../PrimaryButton.jsx'

export default function DayPhase({
  t,
  currentSpeaker,
  timerSeconds,
  timerRunning,
  onToggleTimer,
  onResetTimer,
  onNextSpeaker,
  onNextPhase,
}) {
  return (
    <section className="space-y-4 rounded-3xl border border-amber-500/20 bg-black/30 p-4">
      <p className="text-sm text-gray-300">{t.game.dayHint}</p>
      {currentSpeaker ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center">
          <p className="text-sm text-gray-400">{t.game.speakingNow}</p>
          <p className="mt-1 text-2xl font-bold text-red-400">
            #{currentSpeaker?.seatIndex ?? '—'} {currentSpeaker?.name ?? '—'}
          </p>
          <p className="mt-4 text-5xl font-extrabold tabular-nums text-amber-200">{timerSeconds}</p>
          <p className="text-xs text-gray-400">{t.game.sec}</p>
        </div>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-gray-300">{t.game.noPlayersAlive}</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="rounded-2xl border border-white/15 bg-zinc-800 p-4 text-sm font-semibold"
          onClick={onToggleTimer}
        >
          {timerRunning ? t.common.pause : t.common.start}
        </button>
        <button
          type="button"
          className="rounded-2xl border border-white/15 bg-zinc-800 p-4 text-sm font-semibold"
          onClick={onResetTimer}
        >
          {t.common.reset}
        </button>
      </div>

      <PrimaryButton onClick={onNextSpeaker}>{t.game.nextPlayer}</PrimaryButton>
      <PrimaryButton className="bg-zinc-800 hover:bg-zinc-700" onClick={onNextPhase}>
        {t.game.finishDiscussion}
      </PrimaryButton>
    </section>
  )
}

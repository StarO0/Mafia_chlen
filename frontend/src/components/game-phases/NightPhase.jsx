import PrimaryButton from '../PrimaryButton.jsx'

export default function NightPhase({ t, mafiaTeamAlive, alivePlayers, mafiaVoteByVoter, setMafiaVoteByVoter, onSubmit }) {
  return (
    <section className="space-y-4 rounded-3xl border border-indigo-500/30 bg-indigo-950/30 p-4">
      <p className="text-sm text-indigo-200">{t.game.nightHint}</p>
      {mafiaTeamAlive?.map((mafia) => (
        <label key={mafia?.id ?? mafia?.seatIndex} className="block rounded-2xl border border-white/10 bg-black/40 p-3">
          <span className="mb-2 block text-xs text-gray-400">
            {t.game.mafiaVote} #{mafia?.seatIndex ?? '—'} {mafia?.name ?? '—'}
          </span>
          <select
            className="w-full rounded-xl border border-white/15 bg-black/60 p-3 text-sm text-white"
            value={mafiaVoteByVoter?.[mafia?.seatIndex] ?? ''}
            onChange={(e) =>
              setMafiaVoteByVoter((prev) => ({
                ...prev,
                [mafia?.seatIndex]: e.target.value,
              }))
            }
          >
            <option value="">{t.game.chooseVictim}</option>
            {alivePlayers?.map((player) => (
              <option key={player?.seatIndex} value={player?.seatIndex}>
                #{player?.seatIndex ?? '—'} {player?.name ?? '—'}
              </option>
            ))}
          </select>
        </label>
      ))}

      <PrimaryButton onClick={onSubmit}>{t.game.continueToMorning}</PrimaryButton>
    </section>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import { useI18n } from '../context/I18nContext.jsx'
import { castVote, eliminatePlayer, getGame, nextSpeaker, nominatePlayer, resetVotes, resolveNight, restorePlayer } from '../services/api.js'

const SPEECH_SECONDS = 60
const STEPS = ['setup', 'day', 'night', 'morning']

function playerRowKey(player) {
  if (player?.id != null) return `player-${player.id}`
  return `seat-${player.seatIndex ?? 'x'}`
}

export default function GameDashboardPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()

  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [step, setStep] = useState('setup')
  const [speakerIndex, setSpeakerIndex] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(SPEECH_SECONDS)
  const [timerRunning, setTimerRunning] = useState(false)
  const [mafiaVoteByVoter, setMafiaVoteByVoter] = useState({})

  const alivePlayers = useMemo(() => (game?.players ?? []).filter((player) => player.alive), [game])
  const deadPlayers = useMemo(() => (game?.players ?? []).filter((player) => !player.alive), [game])
  const mafiaTeamAlive = useMemo(
    () => alivePlayers.filter((player) => player.role === 'MAFIA' || player.role === 'DON'),
    [alivePlayers],
  )

  const currentSpeaker = alivePlayers[speakerIndex] ?? null
  const totalDayVotesCast = useMemo(
    () => alivePlayers.reduce((sum, player) => sum + (Number(player.votesReceivedToday) || 0), 0),
    [alivePlayers],
  )
  const dayVoteLimitReached = alivePlayers.length > 0 && totalDayVotesCast >= alivePlayers.length

  const loadGame = async () => {
    setLoading(true)
    try {
      const data = await getGame(gameId)
      setGame(data)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  useEffect(() => {
    if (game?.status === 'FINISHED') navigate(`/game/${game.id}/result`)
  }, [game, navigate])

  useEffect(() => {
    if (!timerRunning) return undefined
    const timer = setInterval(() => {
      setTimerSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [timerRunning])

  const runAction = async (action) => {
    try {
      const updated = await action()
      setGame(updated)
      setError('')
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const handleNextSpeaker = async () => {
    const ok = await runAction(() => nextSpeaker(gameId))
    if (!ok) return
    setTimerRunning(false)
    setTimerSeconds(SPEECH_SECONDS)
    setSpeakerIndex((prev) => (alivePlayers.length > 0 ? (prev + 1) % alivePlayers.length : 0))
  }

  const handleSubmitNight = async () => {
    const mafiaVotes = mafiaTeamAlive
      .map((m) => {
        const target = mafiaVoteByVoter[m.seatIndex]
        return target ? { voterSeat: m.seatIndex, targetSeat: Number(target) } : null
      })
      .filter(Boolean)
    if (mafiaVotes.length === 0) {
      setError(t.game.errors.needMafiaVictim)
      return
    }
    const ok = await runAction(() =>
      resolveNight(gameId, {
        mafiaVotes,
        donPreferredVictimSeat: null,
        doctorSaveSeat: null,
        sheriffCheckSeat: null,
        donCheckSeat: null,
        bomzhCheckSeat: null,
        putanaTargetSeat: null,
        maniacTargetSeat: null,
        mafiaVictimOverrideSeat: null,
      }),
    )
    if (ok) {
      setStep('morning')
      setMafiaVoteByVoter({})
    }
  }

  const nextStep = () => {
    const index = STEPS.indexOf(step)
    setStep(STEPS[Math.min(index + 1, STEPS.length - 1)])
  }

  if (loading) {
    return (
      <PageShell title={t.game.game} subtitle={t.common.loading}>
        <p className="text-sm text-gray-300">{t.common.loading}</p>
      </PageShell>
    )
  }

  if (!game) {
    return (
      <PageShell title={t.game.game}>
        <p className="text-sm text-red-300">{error || t.game.notFound}</p>
      </PageShell>
    )
  }

  const phaseTint = step === 'night' ? 'night' : step === 'day' ? 'day' : 'neutral'

  return (
    <PageShell title={`${t.game.game} #${game.id}`} subtitle={t.game[step === 'day' ? 'dayDiscussion' : step]} phaseTint={phaseTint}>
      <div className="grid grid-cols-4 gap-2">
        {STEPS.map((item) => (
          <div
            key={item}
            className={`h-1.5 rounded-full ${STEPS.indexOf(item) <= STEPS.indexOf(step) ? 'bg-red-500' : 'bg-white/20'}`}
          />
        ))}
      </div>

      {step === 'setup' ? (
        <section className="space-y-3 rounded-3xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-gray-300">{t.game.setupHint}</p>
          <ul className="space-y-2">
            {game.players.map((player) => (
              <li key={playerRowKey(player)} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                #{player.seatIndex} {player.name} <span className="text-gray-400">({player.role || '—'})</span>
              </li>
            ))}
          </ul>
          <PrimaryButton onClick={nextStep}>{t.game.startGame}</PrimaryButton>
        </section>
      ) : null}

      {step === 'day' ? (
        <section className="space-y-4 rounded-3xl border border-amber-500/20 bg-black/30 p-4">
          <p className="text-sm text-gray-300">{t.game.dayHint}</p>
          {currentSpeaker ? (
            <div key={currentSpeaker.seatIndex} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center">
              <p className="text-sm text-gray-400">{t.game.speakingNow}</p>
              <p className="mt-1 text-2xl font-bold text-red-400">
                #{currentSpeaker.seatIndex} {currentSpeaker.name}
              </p>
              <p className="mt-4 text-5xl font-extrabold tabular-nums text-amber-200">{timerSeconds}</p>
              <p className="text-xs text-gray-400">{t.game.sec}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-2xl border border-white/15 bg-zinc-800 p-4 text-sm font-semibold"
              onClick={() => setTimerRunning((v) => !v)}
            >
              {timerRunning ? t.common.pause : t.common.start}
            </button>
            <button
              type="button"
              className="rounded-2xl border border-white/15 bg-zinc-800 p-4 text-sm font-semibold"
              onClick={() => {
                setTimerRunning(false)
                setTimerSeconds(SPEECH_SECONDS)
              }}
            >
              {t.common.reset}
            </button>
          </div>

          <PrimaryButton onClick={handleNextSpeaker}>{t.game.nextSpeaker}</PrimaryButton>
          <PrimaryButton className="bg-zinc-800 hover:bg-zinc-700" onClick={() => setStep('night')}>
            {t.common.next}
          </PrimaryButton>
        </section>
      ) : null}

      {step === 'night' ? (
        <section className="space-y-4 rounded-3xl border border-indigo-500/30 bg-indigo-950/30 p-4">
          <p className="text-sm text-indigo-200">{t.game.nightHint}</p>
          {mafiaTeamAlive.map((mafia) => (
            <label key={mafia.id ?? mafia.seatIndex} className="block rounded-2xl border border-white/10 bg-black/40 p-3">
              <span className="mb-2 block text-xs text-gray-400">
                {t.game.mafiaVote} #{mafia.seatIndex} {mafia.name}
              </span>
              <select
                className="w-full rounded-xl border border-white/15 bg-black/60 p-3 text-sm text-white"
                value={mafiaVoteByVoter[mafia.seatIndex] ?? ''}
                onChange={(e) =>
                  setMafiaVoteByVoter((prev) => ({
                    ...prev,
                    [mafia.seatIndex]: e.target.value,
                  }))
                }
              >
                <option value="">{t.game.chooseVictim}</option>
                {alivePlayers.map((player) => (
                  <option key={player.seatIndex} value={player.seatIndex}>
                    #{player.seatIndex} {player.name}
                  </option>
                ))}
              </select>
            </label>
          ))}

          <PrimaryButton onClick={handleSubmitNight}>{t.game.continueToMorning}</PrimaryButton>
        </section>
      ) : null}

      {step === 'morning' ? (
        <section className="space-y-4 rounded-3xl border border-white/10 bg-black/30 p-4">
          <div>
            <h3 className="text-lg font-semibold text-red-300">{t.game.nightResult}</h3>
            <div className="mt-2 rounded-2xl border border-white/10 bg-black/35 p-3 text-xs text-gray-300">
              {[...game.logs].slice(-3).map((log) => (
                <p key={log.id}>
                  #{log.sequenceNo} · {log.message}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/35 p-3 text-xs text-gray-300">
            {t.game.votesCast}: <strong className="text-white">{totalDayVotesCast}</strong> / {alivePlayers.length}
            {dayVoteLimitReached ? <span className="ml-2 text-amber-300">{t.game.votesLimitReached}</span> : null}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-200">{t.game.voteOut}</h4>
            {alivePlayers.map((player) => (
              <div key={playerRowKey(player)} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm">
                  #{player.seatIndex} {player.name}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    className="rounded-xl bg-red-800 p-2 text-xs"
                    onClick={() => runAction(() => eliminatePlayer(gameId, player.seatIndex))}
                  >
                    {t.game.remove}
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-zinc-700 p-2 text-xs"
                    onClick={() => runAction(() => nominatePlayer(gameId, player.seatIndex))}
                  >
                    {t.game.nominate}
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-zinc-700 p-2 text-xs disabled:opacity-40"
                    disabled={!player.nominatedToday || dayVoteLimitReached}
                    onClick={() => runAction(() => castVote(gameId, player.seatIndex))}
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
            onClick={() => runAction(() => resetVotes(gameId))}
          >
            {t.game.resetVoting}
          </button>

          {deadPlayers.length > 0 ? (
            <div className="space-y-2 rounded-2xl border border-white/10 bg-black/35 p-3">
              <p className="text-sm font-semibold text-gray-300">{t.game.deadPlayers}</p>
              {deadPlayers.map((player) => (
                <div key={playerRowKey(player)} className="flex items-center justify-between gap-2 rounded-xl bg-white/5 p-2 text-xs">
                  <span>
                    #{player.seatIndex} {player.name}
                  </span>
                  <button
                    type="button"
                    className="rounded-lg bg-zinc-700 px-3 py-1"
                    onClick={() => runAction(() => restorePlayer(gameId, player.seatIndex))}
                  >
                    {t.game.revive}
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <PrimaryButton
            onClick={() => {
              setStep('day')
              setTimerRunning(false)
              setTimerSeconds(SPEECH_SECONDS)
            }}
          >
            {t.game.finishVoting}
          </PrimaryButton>
        </section>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-black/30 p-4">
        <h3 className="text-lg font-semibold text-red-300">{t.game.logs}</h3>
        <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
          {[...game.logs].reverse().map((log) => (
            <p key={log.id} className="rounded-xl border border-white/10 bg-black/40 p-2 text-xs text-gray-300">
              #{log.sequenceNo} · {log.message}
            </p>
          ))}
        </div>
      </section>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </PageShell>
  )
}

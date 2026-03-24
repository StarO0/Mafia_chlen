import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'
import SetupPhase from '../components/game-phases/SetupPhase.jsx'
import DayPhase from '../components/game-phases/DayPhase.jsx'
import NightPhase from '../components/game-phases/NightPhase.jsx'
import MorningPhase from '../components/game-phases/MorningPhase.jsx'
import { useI18n } from '../context/I18nContext.jsx'
import { castVote, eliminatePlayer, getGame, nextSpeaker, nominatePlayer, resetVotes, resolveNight, restorePlayer } from '../services/api.js'

const SPEECH_SECONDS = 60
const STEPS = ['setup', 'day', 'night', 'morning']

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
  const [phaseLoading, setPhaseLoading] = useState(false)
  const [isLogOpen, setIsLogOpen] = useState(false)

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
      if (updated?.status === 'FINISHED') {
        navigate(`/game/${updated.id}/result`)
      }
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
    setPhaseLoading(true)
    setError('')
    try {
      const latest = await getGame(gameId)
      setGame(latest)
      if (latest?.status === 'FINISHED') {
        setError(t.game.errors.gameFinished)
        navigate(`/game/${latest.id}/result`)
        return
      }
      if (latest?.phase !== 'NIGHT') {
        setStep('day')
        setError(t.game.errors.nightPhaseOnly)
        return
      }

      const latestAlive = (latest?.players ?? []).filter((player) => player.alive)
      const latestMafia = latestAlive.filter((player) => player.role === 'MAFIA' || player.role === 'DON')
      const mafiaVotes = latestMafia
        .map((m) => {
          const target = mafiaVoteByVoter[m.seatIndex]
          return target ? { voterSeat: m.seatIndex, targetSeat: Number(target) } : null
        })
        .filter(Boolean)
      if (mafiaVotes.length === 0) {
        setError(t.game.errors.needMafiaVictim)
        return
      }

      const updated = await resolveNight(gameId, {
        mafiaVotes,
        donPreferredVictimSeat: null,
        doctorSaveSeat: null,
        sheriffCheckSeat: null,
        donCheckSeat: null,
        bomzhCheckSeat: null,
        putanaTargetSeat: null,
        maniacTargetSeat: null,
        mafiaVictimOverrideSeat: null,
      })
      setGame(updated)
      setMafiaVoteByVoter({})
      setStep('day')
      setTimerRunning(false)
      setTimerSeconds(SPEECH_SECONDS)
      if (updated?.status === 'FINISHED') {
        navigate(`/game/${updated.id}/result`)
      }
    } catch (err) {
      const message = err?.message || ''
      if (message.includes('Мастер ночи доступен только в фазе NIGHT')) {
        const latest = await getGame(gameId).catch(() => null)
        if (latest) {
          setGame(latest)
          if (latest.status === 'FINISHED') {
            navigate(`/game/${latest.id}/result`)
            return
          }
          setStep(latest.phase === 'NIGHT' ? 'night' : 'day')
        }
        setError(t.game.errors.nightPhaseOnly)
      } else {
        setError(message)
      }
    } finally {
      setPhaseLoading(false)
    }
  }

  const handleStartRoundFlow = async () => {
    setPhaseLoading(true)
    setError('')
    try {
      const freshGame = await getGame(gameId)
      if (!freshGame?.id) throw new Error('Game data is unavailable')
      setGame(freshGame)
      setStep('day')
    } catch (err) {
      setError(err?.message || 'Failed to start game flow')
    } finally {
      setPhaseLoading(false)
    }
  }

  const phaseSubtitleMap = {
    setup: t.game.setup,
    day: t.game.dayDiscussion,
    night: t.game.night,
    morning: t.game.morning,
  }

  const renderPhase = () => {
    switch (step) {
      case 'setup':
        return <SetupPhase t={t} players={game?.players ?? []} onStart={handleStartRoundFlow} loading={phaseLoading} />
      case 'day':
        return (
          <DayPhase
            t={t}
            currentSpeaker={currentSpeaker}
            timerSeconds={timerSeconds}
            timerRunning={timerRunning}
            onToggleTimer={() => setTimerRunning((v) => !v)}
            onResetTimer={() => {
              setTimerRunning(false)
              setTimerSeconds(SPEECH_SECONDS)
            }}
            onNextSpeaker={handleNextSpeaker}
            onNextPhase={() => setStep('morning')}
          />
        )
      case 'night':
        return (
          <NightPhase
            t={t}
            mafiaTeamAlive={mafiaTeamAlive}
            alivePlayers={alivePlayers}
            mafiaVoteByVoter={mafiaVoteByVoter}
            setMafiaVoteByVoter={setMafiaVoteByVoter}
            onSubmit={handleSubmitNight}
          />
        )
      case 'morning':
        return (
          <MorningPhase
            t={t}
            logs={game?.logs ?? []}
            totalDayVotesCast={totalDayVotesCast}
            alivePlayers={alivePlayers}
            dayVoteLimitReached={dayVoteLimitReached}
            onEliminate={(seatIndex) => seatIndex && runAction(() => eliminatePlayer(gameId, seatIndex))}
            onNominate={(seatIndex) => seatIndex && runAction(() => nominatePlayer(gameId, seatIndex))}
            onCastVote={(seatIndex) => seatIndex && runAction(() => castVote(gameId, seatIndex))}
            onResetVotes={() => runAction(() => resetVotes(gameId))}
            deadPlayers={deadPlayers}
            onRestore={(seatIndex) => seatIndex && runAction(() => restorePlayer(gameId, seatIndex))}
            onFinishVoting={() => {
              setStep('night')
              setTimerRunning(false)
              setTimerSeconds(SPEECH_SECONDS)
            }}
          />
        )
      default:
        return (
          <section className="rounded-3xl border border-red-500/30 bg-red-950/20 p-4">
            <p className="text-sm text-red-200">UI state error: unknown step "{step}"</p>
          </section>
        )
    }
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
    <PageShell title={`${t.game.game} #${game.id}`} subtitle={phaseSubtitleMap[step] ?? t.game.setup} phaseTint={phaseTint}>
      <div className="grid grid-cols-4 gap-2">
        {STEPS.map((item) => (
          <div
            key={item}
            className={`h-1.5 rounded-full ${STEPS.indexOf(item) <= STEPS.indexOf(step) ? 'bg-red-500' : 'bg-white/20'}`}
          />
        ))}
      </div>

      {phaseLoading ? (
        <section className="rounded-3xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-gray-300">{t.common.loading}</p>
        </section>
      ) : (
        renderPhase()
      )}

      <section className="rounded-3xl border border-white/10 bg-black/30 p-4">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left"
          onClick={() => setIsLogOpen((v) => !v)}
        >
          <span className="text-lg font-semibold text-red-300">{t.game.logs}</span>
          <span className="text-xs text-gray-300">{isLogOpen ? t.game.hideLogs : t.game.showLogs}</span>
        </button>
        {isLogOpen ? (
          <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
            {[...(game?.logs ?? [])].reverse().map((log) => (
              <p key={log.id} className="rounded-xl border border-white/10 bg-black/40 p-2 text-xs text-gray-300">
                #{log.sequenceNo} · {log.message}
              </p>
            ))}
          </div>
        ) : null}
      </section>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </PageShell>
  )
}

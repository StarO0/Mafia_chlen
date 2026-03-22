import { useEffect, useMemo, useReducer, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import PageShell from '../components/PageShell.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import {
  castVote,
  eliminatePlayer,
  getGame,
  nextSpeaker,
  nominatePlayer,
  resetVotes,
  resolveNight,
  restorePlayer,
  togglePhase,
  undoAction,
} from '../services/api.js'

const initialUi = {
  game: null,
  loading: true,
  error: '',
  timerSeconds: 60,
  timerRunning: false,
  warningMessage: '',
  warningAction: null,
  nightForm: {
    doctorSaveSeat: '',
    sheriffCheckSeat: '',
    donCheckSeat: '',
    bomzhCheckSeat: '',
    putanaTargetSeat: '',
    maniacTargetSeat: '',
    donPreferredVictimSeat: '',
  },
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_GAME':
      return { ...state, game: action.payload, loading: false, error: '' }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'TICK':
      return { ...state, timerSeconds: Math.max(0, state.timerSeconds - 1) }
    case 'RESET_TIMER':
      return { ...state, timerSeconds: 60, timerRunning: false }
    case 'TOGGLE_TIMER':
      return { ...state, timerRunning: !state.timerRunning }
    case 'SHOW_WARNING':
      return { ...state, warningMessage: action.payload.message, warningAction: action.payload.action }
    case 'CLEAR_WARNING':
      return { ...state, warningMessage: '', warningAction: null }
    case 'SET_NIGHT_FIELD':
      return {
        ...state,
        nightForm: { ...state.nightForm, [action.payload.field]: action.payload.value },
      }
    default:
      return state
  }
}

function parseSeat(value) {
  const number = Number(value)
  return Number.isNaN(number) || number <= 0 ? null : number
}

/** Стабильный key для списков игроков (избегаем коллизий и «пропажи» карточек в React). */
function playerRowKey(player) {
  if (player?.id != null) return `player-${player.id}`
  return `seat-${player.seatIndex ?? 'x'}`
}

const btnBase =
  'rounded-2xl px-3 py-2 text-sm font-medium shadow-md transition active:scale-95 disabled:pointer-events-none disabled:opacity-40'

export default function GameDashboardPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(reducer, initialUi)
  /** seat (voter) -> target seat string */
  const [mafiaVoteByVoter, setMafiaVoteByVoter] = useState({})
  const [mafiaTieModal, setMafiaTieModal] = useState(false)
  const [tieOverrideSeat, setTieOverrideSeat] = useState('')

  const isDay = state.game?.phase === 'DAY'
  const isNight = state.game?.phase === 'NIGHT'

  const alivePlayers = useMemo(
    () => (state.game?.players ?? []).filter((player) => player.alive),
    [state.game],
  )
  const deadPlayers = useMemo(
    () => (state.game?.players ?? []).filter((player) => !player.alive),
    [state.game],
  )

  const mafiaTeamAlive = useMemo(
    () => alivePlayers.filter((p) => p.role === 'MAFIA' || p.role === 'DON'),
    [alivePlayers],
  )
  const donAlive = useMemo(() => alivePlayers.find((p) => p.role === 'DON'), [alivePlayers])

  const aliveCount = alivePlayers.length
  const totalDayVotesCast = useMemo(
    () => alivePlayers.reduce((sum, p) => sum + (Number(p.votesReceivedToday) || 0), 0),
    [alivePlayers],
  )
  const dayVoteLimitReached = aliveCount > 0 && totalDayVotesCast >= aliveCount

  const loadGame = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const game = await getGame(gameId)
      dispatch({ type: 'SET_GAME', payload: game })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message })
    }
  }

  useEffect(() => {
    loadGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  useEffect(() => {
    if (!state.timerRunning) return
    const timer = setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => clearInterval(timer)
  }, [state.timerRunning])

  useEffect(() => {
    if (state.game?.status === 'FINISHED') {
      navigate(`/game/${state.game.id}/result`)
    }
  }, [navigate, state.game])

  /** Голос Дона в селекте → поле жертвы Дона (приоритет при ничьей). */
  useEffect(() => {
    if (!donAlive) return
    const v = mafiaVoteByVoter[donAlive.seatIndex]
    if (v !== undefined && v !== '') {
      dispatch({
        type: 'SET_NIGHT_FIELD',
        payload: { field: 'donPreferredVictimSeat', value: String(v) },
      })
    }
  }, [donAlive, mafiaVoteByVoter])

  const runAction = async (apiAction, warningAction = null) => {
    try {
      const game = await apiAction()
      dispatch({ type: 'SET_GAME', payload: game })
      dispatch({ type: 'CLEAR_WARNING' })
      if (game.status === 'FINISHED') navigate(`/game/${game.id}/result`)
      return true
    } catch (err) {
      const msg = err.message || ''
      if (msg.startsWith('WARNING:') && warningAction) {
        dispatch({
          type: 'SHOW_WARNING',
          payload: { message: msg.replace('WARNING:', '').trim(), action: warningAction },
        })
        return false
      }
      if (msg.startsWith('MAFIA_TIE')) {
        setMafiaTieModal(true)
        return false
      }
      dispatch({ type: 'SET_ERROR', payload: msg })
      return false
    }
  }

  const buildNightPayload = (mafiaVictimOverrideSeat = null) => {
    const mafiaVotes = mafiaTeamAlive
      .map((p) => {
        const t = mafiaVoteByVoter[p.seatIndex]
        if (t === undefined || t === '' || t === null) return null
        return { voterSeat: p.seatIndex, targetSeat: Number(t) }
      })
      .filter(Boolean)
    return {
      mafiaVotes,
      donPreferredVictimSeat: parseSeat(state.nightForm.donPreferredVictimSeat),
      doctorSaveSeat: parseSeat(state.nightForm.doctorSaveSeat),
      sheriffCheckSeat: parseSeat(state.nightForm.sheriffCheckSeat),
      donCheckSeat: parseSeat(state.nightForm.donCheckSeat),
      bomzhCheckSeat: parseSeat(state.nightForm.bomzhCheckSeat),
      putanaTargetSeat: parseSeat(state.nightForm.putanaTargetSeat),
      maniacTargetSeat: parseSeat(state.nightForm.maniacTargetSeat),
      mafiaVictimOverrideSeat: mafiaVictimOverrideSeat == null ? null : mafiaVictimOverrideSeat,
    }
  }

  const submitNight = async (mafiaVictimOverrideSeat = null) => {
    const payload = buildNightPayload(mafiaVictimOverrideSeat)
    const ok = await runAction(() => resolveNight(gameId, payload))
    if (ok) {
      setMafiaTieModal(false)
      setTieOverrideSeat('')
    }
  }

  const setNightSeat = (field, seat) => {
    dispatch({ type: 'SET_NIGHT_FIELD', payload: { field, value: String(seat) } })
  }

  if (state.loading) {
    return (
      <PageShell title="Игра" subtitle="Загрузка..." phaseTint="neutral">
        <p className="text-sm text-gray-300">Подождите...</p>
      </PageShell>
    )
  }
  if (!state.game) {
    return (
      <PageShell title="Игра" phaseTint="neutral">
        <p className="text-sm text-red-300">{state.error || 'Игра не найдена'}</p>
      </PageShell>
    )
  }

  const phaseTint = isDay ? 'day' : 'night'
  const phaseLabel = isDay ? 'День' : 'Ночь'

  return (
    <PageShell
      title={`Игра #${state.game.id}`}
      subtitle={
        <span className="inline-flex items-center gap-2">
          <span>Фаза: {phaseLabel}</span>
          <span className="text-lg">{isDay ? '☀️' : '🌙'}</span>
        </span>
      }
      phaseTint={phaseTint}
    >
      <div className="grid grid-cols-2 gap-3">
        <PrimaryButton type="button" className="p-3" onClick={() => runAction(() => togglePhase(gameId))}>
          Сменить фазу
        </PrimaryButton>
        <PrimaryButton
          type="button"
          className="bg-zinc-800/90 p-3 ring-white/10 hover:bg-zinc-700"
          onClick={() => runAction(() => undoAction(gameId))}
        >
          Отменить (Undo)
        </PrimaryButton>
      </div>

      <AnimatePresence>
        {isDay ? (
          <motion.section
            key="day-block"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-md"
          >
            <h3 className="text-lg font-semibold text-amber-200">Очередь выступлений</h3>
            <p className="mt-2 text-sm text-gray-300">Сейчас говорит: место {state.game.speakerSeatIndex ?? '—'}</p>
            <p className="mt-2 text-3xl font-bold text-red-400 tabular-nums">{state.timerSeconds}s</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                className={`${btnBase} bg-red-900/80 text-white`}
                onClick={() => dispatch({ type: 'TOGGLE_TIMER' })}
              >
                {state.timerRunning ? 'Пауза' : 'Старт'}
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                className={`${btnBase} bg-zinc-800 text-white`}
                onClick={() => dispatch({ type: 'RESET_TIMER' })}
              >
                Сброс
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                className={`${btnBase} bg-red-700 text-white`}
                onClick={() => {
                  dispatch({ type: 'RESET_TIMER' })
                  runAction(() => nextSpeaker(gameId))
                }}
              >
                Следующий
              </motion.button>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <section className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-md">
        <h3 className="text-lg font-semibold text-red-300">Живые игроки</h3>
        {isDay ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-gray-300">
            <span>
              Голосов отдано: <strong className="text-white">{totalDayVotesCast}</strong> / {aliveCount} (живых)
            </span>
            {dayVoteLimitReached ? (
              <span className="rounded-lg bg-amber-950/80 px-2 py-1 font-medium text-amber-200">
                Лимит голосов достигнут
              </span>
            ) : null}
          </div>
        ) : null}
        <ul className="mt-3 space-y-3">
          {alivePlayers.map((player) => (
            <li
              key={playerRowKey(player)}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-md backdrop-blur-sm"
            >
              <p className="text-sm font-semibold">
                #{player.seatIndex} {player.name}{' '}
                <span className="font-normal text-gray-400">({player.role || '—'})</span>
                {isDay && player.silenced ? (
                  <span className="ml-2 rounded-full bg-red-950/80 px-2 py-0.5 text-xs font-medium text-red-300">
                    Молчит
                  </span>
                ) : null}
              </p>

              {isDay ? (
                <motion.div className="mt-3 flex flex-wrap gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    className={`${btnBase} bg-red-700 text-white`}
                    onClick={() =>
                      runAction(
                        () => eliminatePlayer(gameId, player.seatIndex),
                        () => eliminatePlayer(gameId, player.seatIndex, true),
                      )
                    }
                  >
                    Убрать
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    className={`${btnBase} bg-red-900/80 text-white`}
                    onClick={() => runAction(() => nominatePlayer(gameId, player.seatIndex))}
                  >
                    Выставить
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    className={`${btnBase} border border-white/15 bg-zinc-800/80 text-white`}
                    onClick={() => runAction(() => castVote(gameId, player.seatIndex))}
                    disabled={!player.nominatedToday || dayVoteLimitReached}
                  >
                    + Голос
                  </motion.button>
                </motion.div>
              ) : null}

              {isNight ? (
                <motion.div className="mt-3 flex flex-wrap gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {donAlive ? (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      className={`${btnBase} bg-red-900/80 text-white`}
                      onClick={() => {
                        const ds = donAlive.seatIndex
                        setMafiaVoteByVoter((prev) => ({
                          ...prev,
                          [ds]: String(player.seatIndex),
                        }))
                        dispatch({
                          type: 'SET_NIGHT_FIELD',
                          payload: { field: 'donPreferredVictimSeat', value: String(player.seatIndex) },
                        })
                      }}
                    >
                      Жертва Дона
                    </motion.button>
                  ) : null}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    className={`${btnBase} bg-emerald-900/80 text-white`}
                    onClick={() => setNightSeat('doctorSaveSeat', player.seatIndex)}
                  >
                    Лечение
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    className={`${btnBase} bg-indigo-900/80 text-white`}
                    onClick={() => setNightSeat('sheriffCheckSeat', player.seatIndex)}
                  >
                    Проверка шерифа
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    className={`${btnBase} bg-violet-900/80 text-white`}
                    onClick={() => setNightSeat('donCheckSeat', player.seatIndex)}
                  >
                    Проверка дона
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    className={`${btnBase} bg-amber-900/80 text-white`}
                    onClick={() => setNightSeat('bomzhCheckSeat', player.seatIndex)}
                  >
                    Проверка бомжа
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    className={`${btnBase} bg-pink-900/50 text-white`}
                    onClick={() => setNightSeat('putanaTargetSeat', player.seatIndex)}
                  >
                    Путана
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    className={`${btnBase} bg-zinc-700 text-white`}
                    onClick={() => setNightSeat('maniacTargetSeat', player.seatIndex)}
                  >
                    Жертва маньяка
                  </motion.button>
                </motion.div>
              ) : null}

              {isDay ? (
                <p className="mt-2 text-xs text-gray-400">
                  Выставлен: {player.nominatedToday ? 'да' : 'нет'} · Голосов: {player.votesReceivedToday}
                </p>
              ) : null}
            </li>
          ))}
        </ul>

        {isNight ? (
          <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-black/40 p-3">
            <p className="text-xs font-medium text-gray-400">Голоса мафии (каждый мафиози выбирает жертву)</p>
            {mafiaTeamAlive.map((m) => (
              <label key={m.id} className="block text-xs text-gray-500">
                <span className="mb-1 block">
                  {m.role === 'DON' ? 'Дон' : 'Мафия'} #{m.seatIndex} {m.name}
                </span>
                <select
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-sm text-white"
                  value={mafiaVoteByVoter[m.seatIndex] ?? ''}
                  onChange={(e) =>
                    setMafiaVoteByVoter((prev) => ({
                      ...prev,
                      [m.seatIndex]: e.target.value,
                    }))
                  }
                >
                  <option value="">— кого убить —</option>
                  {alivePlayers.map((t) => (
                    <option key={t.seatIndex} value={t.seatIndex}>
                      Место {t.seatIndex}: {t.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            {donAlive ? (
              <p className="text-xs text-gray-500">
                Сначала считается большинство голосов мафии; при ничьей лидеров выбор Дона решает (кнопка «Жертва Дона» или поле ниже).
              </p>
            ) : (
              <p className="text-xs text-amber-200/90">
                Дона нет: при ничьей мафии вы увидите запрос на ручное подтверждение жертвы.
              </p>
            )}
          </div>
        ) : null}

        {isDay ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            className="mt-4 w-full rounded-2xl border border-white/15 bg-zinc-800/80 p-4 font-medium backdrop-blur-sm"
            onClick={() => runAction(() => resetVotes(gameId))}
          >
            Сбросить голосование
          </motion.button>
        ) : null}
      </section>

      {deadPlayers.length > 0 ? (
        <section className="rounded-3xl border border-white/5 bg-black/40 p-4 opacity-90 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-gray-500">Вне игры</h3>
          <ul className="mt-2 space-y-3">
            {deadPlayers.map((player) => (
              <li
                key={playerRowKey(player)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/5 bg-black/30 p-3 text-sm text-gray-400"
              >
                <span>
                  #{player.seatIndex} {player.name} ({player.role || '—'})
                </span>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  className={`${btnBase} bg-zinc-700 text-white`}
                  onClick={() => runAction(() => restorePlayer(gameId, player.seatIndex))}
                >
                  Вернуть
                </motion.button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <AnimatePresence>
        {isNight ? (
          <motion.section
            key="night-wizard"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl border border-indigo-500/20 bg-indigo-950/20 p-4 backdrop-blur-md"
          >
            <h3 className="text-lg font-semibold text-indigo-200">Мастер ночи</h3>
            <p className="mt-1 text-xs text-gray-400">
              Выберите игроков кнопками на карточках или введите числа. Проверки бомжа/шерифа/дона пишутся в журнал.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ['donPreferredVictimSeat', 'Жертва мафии (место) — дон'],
                ['doctorSaveSeat', 'Спасение доктора'],
                ['sheriffCheckSeat', 'Проверка шерифа'],
                ['donCheckSeat', 'Проверка дона'],
                ['bomzhCheckSeat', 'Проверка бомжа'],
                ['putanaTargetSeat', 'Путана'],
                ['maniacTargetSeat', 'Жертва маньяка'],
              ].map(([field, ph]) => (
                <input
                  key={field}
                  className="rounded-2xl border border-white/15 bg-black/40 p-3 text-sm text-white backdrop-blur-sm outline-none ring-indigo-500/30 focus:ring-2"
                  placeholder={ph}
                  value={state.nightForm[field]}
                  onChange={(e) =>
                    dispatch({ type: 'SET_NIGHT_FIELD', payload: { field, value: e.target.value } })
                  }
                />
              ))}
            </div>
            <PrimaryButton type="button" className="mt-4" onClick={() => submitNight(null)}>
              Применить ночь (утро)
            </PrimaryButton>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <section className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-md">
        <h3 className="text-lg font-semibold text-red-300">Журнал игры</h3>
        <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
          {[...state.game.logs].reverse().map((log) => (
            <motion.p
              key={log.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-white/5 bg-black/40 p-2 text-xs text-gray-300"
            >
              #{log.sequenceNo} · {log.message}
            </motion.p>
          ))}
        </div>
      </section>

      {state.error ? <p className="text-sm text-red-300">{state.error}</p> : null}

      <AnimatePresence>
        {state.warningMessage ? (
          <motion.div
            key="warn"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-3xl border border-amber-500/40 bg-amber-950/40 p-4 backdrop-blur-md"
          >
            <p className="text-sm text-amber-100">{state.warningMessage}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                className={`${btnBase} bg-zinc-800 text-white`}
                onClick={() => dispatch({ type: 'CLEAR_WARNING' })}
              >
                Отмена
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                className={`${btnBase} bg-amber-700 text-white`}
                onClick={() => runAction(state.warningAction)}
              >
                Подтвердить
              </motion.button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {mafiaTieModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              className="w-full max-w-md rounded-3xl border border-amber-500/40 bg-zinc-950 p-5 shadow-2xl"
            >
              <p className="text-sm font-medium text-amber-100">Ничья между мафиози</p>
              <p className="mt-2 text-xs text-gray-400">
                Укажите итоговую жертву мафии и подтвердите.
              </p>
              <input
                className="mt-4 w-full rounded-2xl border border-white/15 bg-black/50 p-3 text-white"
                placeholder="Место жертвы"
                value={tieOverrideSeat}
                onChange={(e) => setTieOverrideSeat(e.target.value)}
              />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`${btnBase} bg-zinc-800 text-white`}
                  onClick={() => setMafiaTieModal(false)}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className={`${btnBase} bg-amber-700 text-white`}
                  onClick={() => {
                    const seat = parseSeat(tieOverrideSeat)
                    if (!seat) {
                      dispatch({
                        type: 'SET_ERROR',
                        payload: 'Укажите номер места жертвы мафии',
                      })
                      return
                    }
                    submitNight(seat)
                  }}
                >
                  Подтвердить
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </PageShell>
  )
}

import { useEffect, useMemo, useReducer } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
    mafiaTargetSeat: '',
    doctorSaveSeat: '',
    sheriffCheckSeat: '',
    donCheckSeat: '',
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

export default function GameDashboardPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(reducer, initialUi)

  const alivePlayers = useMemo(
    () => (state.game?.players ?? []).filter((player) => player.alive),
    [state.game],
  )

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

  const runAction = async (apiAction, warningAction = null) => {
    try {
      const game = await apiAction()
      dispatch({ type: 'SET_GAME', payload: game })
      dispatch({ type: 'CLEAR_WARNING' })
      if (game.status === 'FINISHED') navigate(`/game/${game.id}/result`)
    } catch (err) {
      if (err.message.startsWith('WARNING:') && warningAction) {
        dispatch({ type: 'SHOW_WARNING', payload: { message: err.message.replace('WARNING:', '').trim(), action: warningAction } })
      } else {
        dispatch({ type: 'SET_ERROR', payload: err.message })
      }
    }
  }

  if (state.loading) {
    return <PageShell title="Игра" subtitle="Загрузка..."><p className="text-sm text-gray-300">Подождите...</p></PageShell>
  }
  if (!state.game) {
    return <PageShell title="Игра"><p className="text-sm text-red-300">{state.error || 'Игра не найдена'}</p></PageShell>
  }
  return (
    <PageShell title={`Игра #${state.game.id}`} subtitle={`Фаза: ${state.game.phase === 'DAY' ? 'День ☀️' : 'Ночь 🌙'}`}>
      <section className="grid grid-cols-2 gap-2">
        <PrimaryButton className="p-3" onClick={() => runAction(() => togglePhase(gameId))}>
          Сменить фазу
        </PrimaryButton>
        <PrimaryButton className="bg-zinc-800 p-3 hover:bg-zinc-700" onClick={() => runAction(() => undoAction(gameId))}>
          Undo
        </PrimaryButton>
      </section>

      <section className="rounded-xl border border-red-900/40 bg-black/40 p-4">
        <h3 className="text-lg font-semibold text-red-400">Очередь выступлений</h3>
        <p className="mt-2 text-sm text-gray-300">Текущий: место {state.game.speakerSeatIndex ?? '-'}</p>
        <p className="mt-2 text-2xl font-bold text-red-500">{state.timerSeconds}s</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button className="rounded-lg bg-red-900 p-3" onClick={() => dispatch({ type: 'TOGGLE_TIMER' })}>
            {state.timerRunning ? 'Пауза' : 'Старт'}
          </button>
          <button className="rounded-lg bg-zinc-800 p-3" onClick={() => dispatch({ type: 'RESET_TIMER' })}>
            Сброс
          </button>
          <button
            className="rounded-lg bg-red-700 p-3"
            onClick={() => {
              dispatch({ type: 'RESET_TIMER' })
              runAction(() => nextSpeaker(gameId))
            }}
          >
            Следующий
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-red-900/40 bg-black/40 p-4">
        <h3 className="text-lg font-semibold text-red-400">Живые игроки</h3>
        <ul className="mt-3 space-y-2">
          {alivePlayers.map((player) => (
            <li key={player.id} className="rounded-lg border border-red-900/30 bg-zinc-950 p-3">
              <p className="text-sm font-semibold">
                #{player.seatIndex} {player.name} ({player.role || '—'})
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  className="rounded-lg bg-red-700 px-3 py-2 text-sm"
                  onClick={() =>
                    runAction(
                      () => eliminatePlayer(gameId, player.seatIndex),
                      () => eliminatePlayer(gameId, player.seatIndex, true),
                    )
                  }
                >
                  Убрать
                </button>
                <button className="rounded-lg bg-zinc-700 px-3 py-2 text-sm" onClick={() => runAction(() => restorePlayer(gameId, player.seatIndex))}>
                  Вернуть
                </button>
                <button className="rounded-lg bg-red-900 px-3 py-2 text-sm" onClick={() => runAction(() => nominatePlayer(gameId, player.seatIndex))}>
                  Выставить
                </button>
                <button className="rounded-lg bg-zinc-800 px-3 py-2 text-sm" onClick={() => runAction(() => castVote(gameId, player.seatIndex))}>
                  + Голос
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Выставлен: {player.nominatedToday ? 'да' : 'нет'} · Голосов: {player.votesReceivedToday}
              </p>
            </li>
          ))}
        </ul>
        <button className="mt-3 w-full rounded-lg bg-zinc-800 p-3" onClick={() => runAction(() => resetVotes(gameId))}>
          Сбросить голосование
        </button>
      </section>

      <section className="rounded-xl border border-red-900/40 bg-black/40 p-4">
        <h3 className="text-lg font-semibold text-red-400">Night Wizard</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {Object.keys(state.nightForm).map((field) => (
            <input
              key={field}
              className="rounded-lg border border-red-900/50 bg-black p-3"
              placeholder={field}
              value={state.nightForm[field]}
              onChange={(e) => dispatch({ type: 'SET_NIGHT_FIELD', payload: { field, value: e.target.value } })}
            />
          ))}
        </div>
        <PrimaryButton
          className="mt-3"
          onClick={() =>
            runAction(() =>
              resolveNight(gameId, {
                mafiaTargetSeat: parseSeat(state.nightForm.mafiaTargetSeat),
                doctorSaveSeat: parseSeat(state.nightForm.doctorSaveSeat),
                sheriffCheckSeat: parseSeat(state.nightForm.sheriffCheckSeat),
                donCheckSeat: parseSeat(state.nightForm.donCheckSeat),
              }),
            )
          }
        >
          Применить ночь
        </PrimaryButton>
      </section>

      <section className="rounded-xl border border-red-900/40 bg-black/40 p-4">
        <h3 className="text-lg font-semibold text-red-400">Game Log</h3>
        <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
          {[...state.game.logs].reverse().map((log) => (
            <p key={log.id} className="rounded-lg border border-red-900/20 bg-zinc-950 p-2 text-xs text-gray-300">
              #{log.sequenceNo} · {log.message}
            </p>
          ))}
        </div>
      </section>

      {state.error ? <p className="text-sm text-red-300">{state.error}</p> : null}

      {state.warningMessage ? (
        <div className="rounded-xl border border-amber-600 bg-amber-950/40 p-4">
          <p className="text-sm text-amber-200">{state.warningMessage}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="rounded-lg bg-zinc-800 p-3" onClick={() => dispatch({ type: 'CLEAR_WARNING' })}>
              Отмена
            </button>
            <button className="rounded-lg bg-amber-700 p-3" onClick={() => runAction(state.warningAction)}>
              Подтвердить
            </button>
          </div>
        </div>
      ) : null}
    </PageShell>
  )
}

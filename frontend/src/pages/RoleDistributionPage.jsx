import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import PageShell from '../components/PageShell.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import { useSetup } from '../context/SetupContext.jsx'
import { assignRoles, startGame } from '../services/api.js'
import { buildRolePool, MANUAL_ROLE_OPTIONS, shuffleArray } from '../utils/roles.js'

export default function RoleDistributionPage() {
  const navigate = useNavigate()
  const { gameId, players, rolesConfig, assignments, setAssignments } = useSetup()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [revealIndex, setRevealIndex] = useState(0)
  const [showRole, setShowRole] = useState(false)
  const [manualCustomName, setManualCustomName] = useState({})

  const orderedPool = useMemo(() => buildRolePool(rolesConfig), [rolesConfig])

  const autoShuffledPool = useMemo(() => {
    if (rolesConfig.paperRolesEnabled) return null
    return shuffleArray(buildRolePool(rolesConfig))
  }, [rolesConfig, gameId])

  const physical = rolesConfig.paperRolesEnabled

  const getRoleForSeat = (seatIndex) => {
    if (physical) {
      const idx = assignments[seatIndex]
      if (idx === undefined || idx === null) return null
      const opt = MANUAL_ROLE_OPTIONS[idx]
      if (!opt) return null
      const name =
        opt.role === 'CUSTOM' && opt.customRoleName === 'Своя роль'
          ? manualCustomName[seatIndex] || 'Роль'
          : opt.customRoleName
      return {
        role: opt.role,
        customRoleName: opt.role === 'CUSTOM' ? name : null,
        label: opt.label,
      }
    }
    if (!autoShuffledPool) return null
    return autoShuffledPool[seatIndex - 1] ?? null
  }

  const canStart = physical
    ? players.every((_, idx) => {
        const seat = idx + 1
        if (assignments[seat] === undefined || assignments[seat] === null) return false
        const opt = MANUAL_ROLE_OPTIONS[assignments[seat]]
        if (opt?.role === 'CUSTOM' && opt.customRoleName === 'Своя роль') {
          return (manualCustomName[seat] || '').trim().length > 0
        }
        return true
      })
    : autoShuffledPool?.length === players.length

  const saveAndStart = async () => {
    if (!gameId) {
      setError('Игра не создана. Вернитесь на шаг 1.')
      return
    }
    if (!canStart) {
      setError(physical ? 'Назначьте роль каждому игроку' : 'Ошибка пула ролей')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        assignments: players.map((_, idx) => {
          const role = getRoleForSeat(idx + 1)
          return {
            seatIndex: idx + 1,
            role: role.role,
            customRoleName: role.customRoleName,
          }
        }),
      }
      await assignRoles(gameId, payload)
      await startGame(gameId)
      navigate(`/game/${gameId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectClass =
    'w-full rounded-2xl border border-white/15 bg-black/40 p-4 text-white shadow-inner backdrop-blur-sm outline-none ring-red-500/30 focus:ring-2'

  const setManualAssignment = (seat, optionIndex) => {
    setAssignments((prev) => ({ ...prev, [seat]: optionIndex }))
  }

  return (
    <PageShell title="Раздача ролей" subtitle="Шаг 3: назначение ролей и старт игры">
      {physical ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-amber-500/30 bg-amber-950/20 p-4 backdrop-blur-md"
        >
          <p className="text-sm font-medium text-amber-200">Физические карточки</p>
          <p className="mt-1 text-xs text-gray-400">
            Назначьте любую роль каждому игроку. Случайная раздача отключена.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-4 backdrop-blur-md"
        >
          <p className="text-sm font-medium text-emerald-200">Случайная раздача</p>
          <p className="mt-1 text-xs text-gray-400">
            Роли перемешаны автоматически. Передайте телефон игрокам по очереди.
          </p>
        </motion.div>
      )}

      {physical ? (
        <section className="space-y-3">
          {players.map((name, idx) => {
            const seat = idx + 1
            return (
              <motion.div
                key={idx}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-white/10 bg-black/35 p-4 shadow-lg backdrop-blur-md"
              >
                <p className="mb-2 text-sm text-gray-300">
                  Игрок {seat}: <span className="font-semibold text-white">{name}</span>
                </p>
                <select
                  className={selectClass}
                  value={assignments[seat] ?? ''}
                  onChange={(e) => setManualAssignment(seat, Number(e.target.value))}
                >
                  <option value="" disabled>
                    Выберите роль
                  </option>
                  {MANUAL_ROLE_OPTIONS.map((opt, roleIndex) => (
                    <option key={`${opt.label}-${roleIndex}`} value={roleIndex}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {MANUAL_ROLE_OPTIONS[assignments[seat]]?.customRoleName === 'Своя роль' ? (
                  <input
                    className={`${selectClass} mt-2`}
                    placeholder="Название роли"
                    value={manualCustomName[seat] ?? ''}
                    onChange={(e) =>
                      setManualCustomName((prev) => ({
                        ...prev,
                        [seat]: e.target.value,
                      }))
                    }
                  />
                ) : null}
              </motion.div>
            )
          })}
        </section>
      ) : (
        <section className="rounded-3xl border border-white/10 bg-black/35 p-4 backdrop-blur-md">
          <p className="text-sm text-gray-400">Передайте телефон игроку:</p>
          <p className="mt-2 text-xl font-bold text-red-400">
            Игрок {revealIndex + 1}: {players[revealIndex]}
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={showRole ? 'open' : 'closed'}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md"
            >
              {!showRole ? (
                <p className="text-lg text-gray-300">Роль скрыта</p>
              ) : (
                <p className="text-2xl font-bold text-red-400">
                  {getRoleForSeat(revealIndex + 1)?.label ?? '—'}
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 space-y-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-2xl bg-gradient-to-b from-red-800 to-red-950 p-4 font-medium shadow-lg ring-1 ring-red-500/30"
              onClick={() => setShowRole((v) => !v)}
            >
              {showRole ? 'Скрыть роль' : 'Показать роль'}
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-2xl border border-white/15 bg-zinc-800/80 p-4 font-medium backdrop-blur-sm"
              onClick={() => {
                setShowRole(false)
                setRevealIndex((prev) => (prev + 1 >= players.length ? 0 : prev + 1))
              }}
            >
              Следующий игрок
            </motion.button>
          </div>
        </section>
      )}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <PrimaryButton type="button" disabled={saving || !canStart} onClick={saveAndStart}>
        {saving ? 'Запускаем игру...' : 'Начать игру'}
      </PrimaryButton>
    </PageShell>
  )
}

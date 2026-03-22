import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import { useSetup } from '../context/SetupContext.jsx'
import { assignRoles, startGame } from '../services/api.js'

function buildRolePool(config) {
  const roles = []
  for (let i = 0; i < config.mafiaCount; i += 1) roles.push({ role: 'MAFIA', customRoleName: null, label: 'Мафия' })
  for (let i = 0; i < config.donCount; i += 1) roles.push({ role: 'DON', customRoleName: null, label: 'Дон' })
  for (let i = 0; i < config.sheriffCount; i += 1) roles.push({ role: 'SHERIFF', customRoleName: null, label: 'Шериф' })
  for (let i = 0; i < config.citizenCount; i += 1) roles.push({ role: 'CITIZEN', customRoleName: null, label: 'Мирный' })
  config.customRoles.forEach((custom) => {
    for (let i = 0; i < custom.count; i += 1) {
      roles.push({ role: 'CUSTOM', customRoleName: custom.name, label: custom.name })
    }
  })
  return roles
}

export default function RoleDistributionPage() {
  const navigate = useNavigate()
  const { gameId, players, rolesConfig, assignments, setAssignments } = useSetup()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [revealIndex, setRevealIndex] = useState(0)
  const [showRole, setShowRole] = useState(false)
  const rolePool = useMemo(() => buildRolePool(rolesConfig), [rolesConfig])

  const getRoleBySeat = (seatIndex) => {
    const idx = assignments[seatIndex]
    if (idx === undefined) return null
    return rolePool[idx] || null
  }

  const canStart = players.every((_, idx) => getRoleBySeat(idx + 1))

  const saveAndStart = async () => {
    if (!gameId) {
      setError('Игра не создана. Вернитесь на шаг 1.')
      return
    }
    if (!canStart) {
      setError('Назначьте роли всем игрокам')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        assignments: players.map((_, idx) => {
          const role = getRoleBySeat(idx + 1)
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

  return (
    <PageShell title="Раздача ролей" subtitle="Шаг 3: назначение ролей и старт игры">
      {rolesConfig.paperRolesEnabled ? (
        <section className="space-y-3">
          {players.map((name, idx) => (
            <div key={idx} className="rounded-xl border border-red-900/40 bg-black/40 p-3">
              <p className="mb-2 text-sm text-gray-300">
                Игрок {idx + 1}: {name}
              </p>
              <select
                className="w-full rounded-lg border border-red-900/60 bg-black p-4"
                value={assignments[idx + 1] ?? ''}
                onChange={(e) => setAssignments((prev) => ({ ...prev, [idx + 1]: Number(e.target.value) }))}
              >
                <option value="" disabled>
                  Выберите роль
                </option>
                {rolePool.map((role, roleIndex) => (
                  <option key={`${role.label}-${roleIndex}`} value={roleIndex}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </section>
      ) : (
        <section className="rounded-xl border border-red-900/40 bg-black/40 p-4">
          <p className="text-sm text-gray-400">Передайте телефон игроку:</p>
          <p className="mt-2 text-xl font-bold text-red-400">
            Игрок {revealIndex + 1}: {players[revealIndex]}
          </p>

          <div className="mt-4 rounded-xl border border-red-900/50 bg-zinc-950 p-4 text-center">
            {!showRole ? (
              <p className="text-lg text-gray-300">Роль скрыта</p>
            ) : (
              <p className="text-2xl font-bold text-red-500">
                {getRoleBySeat(revealIndex + 1)?.label ?? 'Роль не назначена'}
              </p>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <select
              className="w-full rounded-lg border border-red-900/60 bg-black p-4"
              value={assignments[revealIndex + 1] ?? ''}
              onChange={(e) =>
                setAssignments((prev) => ({
                  ...prev,
                  [revealIndex + 1]: Number(e.target.value),
                }))
              }
            >
              <option value="" disabled>
                Выберите роль игрока
              </option>
              {rolePool.map((role, roleIndex) => (
                <option key={`${role.label}-${roleIndex}`} value={roleIndex}>
                  {role.label}
                </option>
              ))}
            </select>

            <button className="w-full rounded-xl bg-red-900 p-4" onClick={() => setShowRole((v) => !v)}>
              {showRole ? 'Скрыть роль' : 'Показать роль'}
            </button>
            <button
              className="w-full rounded-xl bg-zinc-800 p-4"
              onClick={() => {
                setShowRole(false)
                setRevealIndex((prev) => (prev + 1 >= players.length ? 0 : prev + 1))
              }}
            >
              Следующий игрок
            </button>
          </div>
        </section>
      )}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <PrimaryButton disabled={saving} onClick={saveAndStart}>
        {saving ? 'Запускаем игру...' : 'Начать игру'}
      </PrimaryButton>
    </PageShell>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import { useSetup } from '../context/SetupContext.jsx'
import { updateRoles } from '../services/api.js'

const roleLabels = [
  ['mafiaCount', 'Мафия'],
  ['donCount', 'Дон'],
  ['sheriffCount', 'Шериф'],
  ['citizenCount', 'Мирные'],
]

export default function SetupRolesPage() {
  const { gameId, rolesConfig, setRolesConfig, players } = useSetup()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const updateCounter = (key, delta) => {
    setRolesConfig((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }))
  }

  const addCustomRole = () => {
    setRolesConfig((prev) => ({
      ...prev,
      customRoles: [...prev.customRoles, { name: 'Новая роль', count: 1 }],
    }))
  }

  const updateCustomRole = (index, key, value) => {
    setRolesConfig((prev) => {
      const copy = [...prev.customRoles]
      copy[index] = { ...copy[index], [key]: key === 'count' ? Math.max(0, Number(value) || 0) : value }
      return { ...prev, customRoles: copy }
    })
  }

  const totalRoles =
    rolesConfig.mafiaCount +
    rolesConfig.donCount +
    rolesConfig.sheriffCount +
    rolesConfig.citizenCount +
    rolesConfig.customRoles.reduce((sum, role) => sum + role.count, 0)

  const isValid = totalRoles === players.length

  const handleNext = async () => {
    if (!gameId) {
      setError('Сначала создайте игру на первом шаге')
      return
    }
    if (!isValid) {
      setError(`Сумма ролей должна быть равна числу игроков (${players.length})`)
      return
    }

    setSaving(true)
    setError('')
    try {
      await updateRoles(gameId, {
        mafiaCount: rolesConfig.mafiaCount,
        donCount: rolesConfig.donCount,
        sheriffCount: rolesConfig.sheriffCount,
        citizenCount: rolesConfig.citizenCount,
        customRolesJson: JSON.stringify(rolesConfig.customRoles),
        paperRolesEnabled: rolesConfig.paperRolesEnabled,
      })
      navigate('/setup/distribute')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell title="Настройка ролей" subtitle="Шаг 2: распределение ролей и доп. правила">
      <p className="text-sm text-gray-300">Игроков: {players.length}</p>

      <div className="space-y-3">
        {roleLabels.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between rounded-xl border border-red-900/40 bg-black/50 p-3">
            <span className="text-base">{label}</span>
            <div className="flex items-center gap-2">
              <button className="rounded-lg bg-red-900 px-3 py-2" onClick={() => updateCounter(key, -1)}>
                -
              </button>
              <span className="min-w-8 text-center text-lg">{rolesConfig[key]}</span>
              <button className="rounded-lg bg-red-700 px-3 py-2" onClick={() => updateCounter(key, 1)}>
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-red-900/40 bg-black/40 p-3">
        <h3 className="mb-2 text-sm font-semibold text-red-300">Кастомные роли</h3>
        <div className="space-y-2">
          {rolesConfig.customRoles.map((role, index) => (
            <div key={index} className="grid grid-cols-[1fr_80px] gap-2">
              <input
                className="rounded-lg border border-red-900/50 bg-black p-3"
                value={role.name}
                onChange={(e) => updateCustomRole(index, 'name', e.target.value)}
              />
              <input
                className="rounded-lg border border-red-900/50 bg-black p-3"
                type="number"
                min={0}
                value={role.count}
                onChange={(e) => updateCustomRole(index, 'count', e.target.value)}
              />
            </div>
          ))}
        </div>
        <button className="mt-3 rounded-lg bg-red-900/70 px-3 py-2 text-sm" onClick={addCustomRole}>
          + Добавить роль
        </button>
      </section>

      <label className="flex items-center gap-3 rounded-xl border border-red-900/40 bg-black/40 p-4">
        <input
          type="checkbox"
          checked={rolesConfig.paperRolesEnabled}
          onChange={(e) => setRolesConfig((prev) => ({ ...prev, paperRolesEnabled: e.target.checked }))}
        />
        <span>Используем бумажные карточки ролей</span>
      </label>

      <p className={`text-sm ${isValid ? 'text-green-400' : 'text-amber-300'}`}>
        Всего ролей: {totalRoles} / {players.length}
      </p>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <PrimaryButton onClick={handleNext} disabled={saving}>
        {saving ? 'Сохраняем...' : 'Далее'}
      </PrimaryButton>
    </PageShell>
  )
}

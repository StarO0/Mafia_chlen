import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import PageShell from '../components/PageShell.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import { useSetup } from '../context/SetupContext.jsx'
import { updateRoles } from '../services/api.js'
import { computeRolesConfig, isRolesConfigValid } from '../utils/roles.js'

const OPTIONAL_ROLES = [
  { key: 'maniac', label: 'Маньяк' },
  { key: 'bomzh', label: 'Бомж' },
  { key: 'suicidnik', label: 'Суицидник' },
  { key: 'schastlivchik', label: 'Счастливчик' },
]

const rowClass =
  'flex items-center justify-between rounded-2xl border border-white/10 bg-black/35 p-4 shadow-md backdrop-blur-md'

export default function SetupRolesPage() {
  const { gameId, rolesConfig, setRolesConfig, players } = useSetup()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const N = players.length
  const physical = rolesConfig.paperRolesEnabled
  const valid = physical || isRolesConfigValid(rolesConfig)

  const setOptional = (key, enabled) => {
    setRolesConfig((prev) =>
      computeRolesConfig(N, {
        ...prev.optionals,
        [key]: enabled,
      }),
    )
  }

  const handleNext = async () => {
    if (!gameId) {
      setError('Сначала создайте игру на первом шаге')
      return
    }
    if (!valid) {
      setError('Слишком много особых ролей для этого числа игроков — отключите часть опций.')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (physical) {
        await updateRoles(gameId, {
          mafiaCount: 0,
          donCount: 0,
          sheriffCount: 0,
          citizenCount: N,
          customRolesJson: '[]',
          paperRolesEnabled: true,
        })
      } else {
        await updateRoles(gameId, {
          mafiaCount: rolesConfig.mafiaCount,
          donCount: rolesConfig.donCount,
          sheriffCount: rolesConfig.sheriffCount,
          citizenCount: rolesConfig.citizenCount,
          customRolesJson: JSON.stringify(rolesConfig.customRolesJsonPayload ?? []),
          paperRolesEnabled: false,
        })
      }
      navigate('/setup/distribute')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell title="Настройка ролей" subtitle="Шаг 2: расчёт ролей и доп. роли">
      <p className="text-sm text-gray-300">
        Игроков: <span className="font-semibold text-white">{N}</span>
      </p>

      <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-md transition active:scale-[0.99]">
        <input
          type="checkbox"
          className="h-5 w-5 accent-red-600"
          checked={rolesConfig.paperRolesEnabled}
          onChange={(e) => setRolesConfig((prev) => ({ ...prev, paperRolesEnabled: e.target.checked }))}
        />
        <span className="text-sm font-medium">Использовать физические карточки</span>
      </label>

      {physical ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-100 backdrop-blur-md"
        >
          <p className="font-semibold">Ручной режим</p>
          <p className="mt-2 text-xs text-amber-200/90">
            Автоматический расчёт мафии и лимиты отключены. На следующем шаге вы сами назначите каждую роль каждому игроку.
            Случайная раздача при старте не используется.
          </p>
        </motion.div>
      ) : (
        <>
          <section className={rowClass}>
            <div>
              <p className="font-medium text-white">Распределение (авто)</p>
              <p className="mt-1 text-xs text-gray-400">
                N≤5: 1 мафия без дона. N≥6: мафия всего = ⌊(N−3)/3⌋+1, один из них — дон. Доктор и путана — по 1.
              </p>
            </div>
          </section>

          <motion.ul className="space-y-2" layout>
            <li className={rowClass}>
              <span>Обычная мафия</span>
              <span className="text-xl font-semibold text-red-400">{rolesConfig.mafiaCount}</span>
            </li>
            <li className={rowClass}>
              <span>Дон мафии</span>
              <span className="text-xl font-semibold text-red-400">{rolesConfig.donCount > 0 ? '1' : '—'}</span>
            </li>
            <li className={rowClass}>
              <span>Шериф</span>
              <span className="text-xl font-semibold text-red-400">{rolesConfig.sheriffCount}</span>
            </li>
            <li className={rowClass}>
              <span>Доктор</span>
              <span className="text-xl font-semibold text-red-400">1</span>
            </li>
            <li className={rowClass}>
              <span>Путана</span>
              <span className="text-xl font-semibold text-red-400">1</span>
            </li>
            <li className={rowClass}>
              <span>Мирные</span>
              <span className={`text-xl font-semibold ${valid ? 'text-emerald-400' : 'text-amber-400'}`}>
                {rolesConfig.citizenCount}
              </span>
            </li>
          </motion.ul>

          <section className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-md">
            <h3 className="text-sm font-semibold text-red-300">Дополнительные роли</h3>
            <p className="mt-1 text-xs text-gray-500">Только из этого списка.</p>
            <div className="mt-4 space-y-3">
              {OPTIONAL_ROLES.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition active:scale-[0.99]"
                >
                  <span className="font-medium">{label}</span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-red-600"
                    checked={!!rolesConfig.optionals[key]}
                    onChange={(e) => setOptional(key, e.target.checked)}
                  />
                </label>
              ))}
            </div>
          </section>

          <AnimatePresence mode="wait">
            {!valid ? (
              <motion.p
                key="invalid"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-amber-300"
              >
                Не хватает слотов под мирных — отключите часть доп. ролей.
              </motion.p>
            ) : (
              <motion.p
                key="valid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-emerald-400/90"
              >
                Состав согласован с числом игроков ({N}).
              </motion.p>
            )}
          </AnimatePresence>
        </>
      )}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <PrimaryButton type="button" onClick={handleNext} disabled={saving || !valid}>
        {saving ? 'Сохраняем...' : 'Далее'}
      </PrimaryButton>
    </PageShell>
  )
}

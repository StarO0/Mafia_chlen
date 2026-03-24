import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import PageShell from '../components/PageShell.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import { useSetup } from '../context/SetupContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'
import { assignRoles, startGame } from '../services/api.js'
import { buildRolePool, MANUAL_ROLE_OPTIONS, shuffleArray } from '../utils/roles.js'

export default function RoleDistributionPage() {
  const navigate = useNavigate()
  const { gameId, players, rolesConfig, assignments, setAssignments } = useSetup()
  const { t } = useI18n()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [revealIndex, setRevealIndex] = useState(0)
  const [showRole, setShowRole] = useState(false)
  const [manualCustomName, setManualCustomName] = useState({})

  const autoShuffledPool = useMemo(() => {
    if (rolesConfig.paperRolesEnabled) return null
    return shuffleArray(buildRolePool(rolesConfig))
  }, [rolesConfig])

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
      setError(t.roleDistribution.errors.gameMissing)
      return
    }
    if (!canStart) {
      setError(physical ? t.roleDistribution.errors.assignEach : t.roleDistribution.errors.rolePool)
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
    <PageShell title={t.roleDistribution.title} subtitle={t.roleDistribution.subtitle}>
      {physical ? (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-950/20 p-4 backdrop-blur-md">
          <p className="text-sm font-medium text-amber-200">{t.roleDistribution.physicalCards}</p>
          <p className="mt-1 text-xs text-gray-400">
            {t.roleDistribution.physicalHint}
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-4 backdrop-blur-md">
          <p className="text-sm font-medium text-emerald-200">{t.roleDistribution.randomDistribution}</p>
          <p className="mt-1 text-xs text-gray-400">
            {t.roleDistribution.randomHint}
          </p>
        </div>
      )}

      {physical ? (
        <section className="space-y-3">
          {players.map((name, idx) => {
            const seat = idx + 1
            return (
              <div key={idx} className="rounded-3xl border border-white/10 bg-black/35 p-4 shadow-lg backdrop-blur-md">
                <p className="mb-2 text-sm text-gray-300">
                  {t.roleDistribution.player} {seat}: <span className="font-semibold text-white">{name}</span>
                </p>
                <select
                  className={selectClass}
                  value={assignments[seat] ?? ''}
                  onChange={(e) => setManualAssignment(seat, Number(e.target.value))}
                >
                  <option value="" disabled>
                    {t.roleDistribution.chooseRole}
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
                    placeholder={t.roleDistribution.customRoleName}
                    value={manualCustomName[seat] ?? ''}
                    onChange={(e) =>
                      setManualCustomName((prev) => ({
                        ...prev,
                        [seat]: e.target.value,
                      }))
                    }
                  />
                ) : null}
              </div>
            )
          })}
        </section>
      ) : (
        <section className="rounded-3xl border border-white/10 bg-black/35 p-4 backdrop-blur-md">
          <p className="text-sm text-gray-400">
            {t.roleDistribution.passPhoneTo}:
          </p>
          <p className="mt-2 text-xl font-bold text-red-400">
            {t.roleDistribution.player} {revealIndex + 1}: {players[revealIndex]}
          </p>

          <AnimatePresence mode="wait">
            <div
              key={showRole ? 'open' : 'closed'}
              className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md"
            >
              {!showRole ? (
                <p className="text-lg text-gray-300">{t.roleDistribution.roleHidden}</p>
              ) : (
                <p className="text-2xl font-bold text-red-400">
                  {getRoleForSeat(revealIndex + 1)?.label ?? '—'}
                </p>
              )}
            </div>
          </AnimatePresence>

          <div className="mt-4 space-y-3">
            <button type="button" className="w-full rounded-2xl bg-gradient-to-b from-red-800 to-red-950 p-4 font-medium shadow-lg ring-1 ring-red-500/30" onClick={() => setShowRole((v) => !v)}>
              {showRole ? t.roleDistribution.hideRole : t.roleDistribution.showRole}
            </button>
            <button type="button" className="w-full rounded-2xl border border-white/15 bg-zinc-800/80 p-4 font-medium backdrop-blur-sm"
              onClick={() => {
                setShowRole(false)
                setRevealIndex((prev) => (prev + 1 >= players.length ? 0 : prev + 1))
              }}
            >
              {t.roleDistribution.nextPlayer}
            </button>
          </div>
        </section>
      )}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <PrimaryButton type="button" disabled={saving || !canStart} onClick={saveAndStart}>
        {saving ? t.roleDistribution.startingGame : t.roleDistribution.startGame}
      </PrimaryButton>
    </PageShell>
  )
}

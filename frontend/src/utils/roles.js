/**
 * Мафия: N≤5 — 1 мафия, без дона.
 * N≥6: всего мафии = ⌊(N−3)/3⌋ + 1, из них 1 дон, остальные — обычные мафиози.
 * (6–8 → 2 и 1 дон; 9–11 → 3 и 1 дон; 12–14 → 4 и 1 дон; …)
 */
const DEFAULT_OPTIONALS = {
  maniac: false,
  bomzh: false,
  suicidnik: false,
  schastlivchik: false,
}

export function computeRolesConfig(playerCount, optionals = DEFAULT_OPTIONALS) {
  const N = playerCount
  const opt = { ...DEFAULT_OPTIONALS, ...optionals }

  let donCount = 0
  let mafiaCount = 0

  if (N <= 5) {
    mafiaCount = 1
    donCount = 0
  } else {
    const totalMafia = Math.floor((N - 3) / 3) + 1
    donCount = 1
    mafiaCount = Math.max(0, totalMafia - donCount)
  }

  const sheriffCount = 1
  const doctorCount = 1
  const putanaCount = 1

  let optionalSlots = 0
  if (opt.maniac) optionalSlots += 1
  if (opt.bomzh) optionalSlots += 1
  if (opt.suicidnik) optionalSlots += 1
  if (opt.schastlivchik) optionalSlots += 1

  const fixed = mafiaCount + donCount + sheriffCount + doctorCount + putanaCount + optionalSlots
  const citizenCount = N - fixed

  const customRolesForApi = []
  if (opt.bomzh) customRolesForApi.push({ name: 'Бомж', count: 1 })
  if (opt.suicidnik) customRolesForApi.push({ name: 'Суицидник', count: 1 })
  if (opt.schastlivchik) customRolesForApi.push({ name: 'Счастливчик', count: 1 })

  return {
    mafiaCount,
    donCount,
    sheriffCount,
    citizenCount,
    optionals: { ...opt },
    paperRolesEnabled: false,
    customRolesJsonPayload: customRolesForApi,
  }
}

export function isRolesConfigValid(cfg) {
  return cfg.citizenCount >= 0
}

/** Пул ролей для раздачи (размер = N). */
export function buildRolePool(cfg) {
  const roles = []
  for (let i = 0; i < cfg.mafiaCount; i += 1) {
    roles.push({ role: 'MAFIA', customRoleName: null, label: 'Мафия' })
  }
  for (let i = 0; i < cfg.donCount; i += 1) {
    roles.push({ role: 'DON', customRoleName: null, label: 'Дон мафии' })
  }
  for (let i = 0; i < cfg.sheriffCount; i += 1) {
    roles.push({ role: 'SHERIFF', customRoleName: null, label: 'Шериф' })
  }
  roles.push({ role: 'DOCTOR', customRoleName: null, label: 'Доктор' })
  roles.push({ role: 'ESCORT', customRoleName: null, label: 'Путана' })
  if (cfg.optionals.maniac) {
    roles.push({ role: 'MANIAC', customRoleName: null, label: 'Маньяк' })
  }
  if (cfg.optionals.bomzh) {
    roles.push({ role: 'CUSTOM', customRoleName: 'Бомж', label: 'Бомж' })
  }
  if (cfg.optionals.suicidnik) {
    roles.push({ role: 'CUSTOM', customRoleName: 'Суицидник', label: 'Суицидник' })
  }
  if (cfg.optionals.schastlivchik) {
    roles.push({ role: 'CUSTOM', customRoleName: 'Счастливчик', label: 'Счастливчик' })
  }
  for (let i = 0; i < cfg.citizenCount; i += 1) {
    roles.push({ role: 'CITIZEN', customRoleName: null, label: 'Мирный' })
  }
  return roles
}

export function shuffleArray(array) {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Все варианты для ручного режима (физические карточки). */
export const MANUAL_ROLE_OPTIONS = [
  { role: 'MAFIA', customRoleName: null, label: 'Мафия' },
  { role: 'DON', customRoleName: null, label: 'Дон мафии' },
  { role: 'SHERIFF', customRoleName: null, label: 'Шериф' },
  { role: 'DOCTOR', customRoleName: null, label: 'Доктор' },
  { role: 'ESCORT', customRoleName: null, label: 'Путана' },
  { role: 'MANIAC', customRoleName: null, label: 'Маньяк' },
  { role: 'CITIZEN', customRoleName: null, label: 'Мирный' },
  { role: 'CUSTOM', customRoleName: 'Бомж', label: 'Бомж' },
  { role: 'CUSTOM', customRoleName: 'Суицидник', label: 'Суицидник' },
  { role: 'CUSTOM', customRoleName: 'Счастливчик', label: 'Счастливчик' },
  { role: 'CUSTOM', customRoleName: 'Своя роль', label: 'Своя роль (укажите имя)' },
]

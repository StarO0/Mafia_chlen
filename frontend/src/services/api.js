const JSON_HEADERS = { 'Content-Type': 'application/json' }

async function http(path, options = {}) {
  const response = await fetch(path, {
    headers: JSON_HEADERS,
    ...options,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message || 'Request failed')
  }

  return response.json()
}

export function fetchGameHistory() {
  return http('/api/games/history')
}

export function createGame(payload) {
  return http('/api/games', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateRoles(gameId, payload) {
  return http(`/api/games/${gameId}/roles`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function assignRoles(gameId, payload) {
  return http(`/api/games/${gameId}/assignments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function startGame(gameId) {
  return http(`/api/games/${gameId}/start`, {
    method: 'POST',
  })
}

export function getGame(gameId) {
  return http(`/api/games/${gameId}`)
}

export function togglePhase(gameId) {
  return http(`/api/games/${gameId}/phase/toggle`, { method: 'POST' })
}

export function nextSpeaker(gameId) {
  return http(`/api/games/${gameId}/speaker/next`, { method: 'POST' })
}

export function undoAction(gameId) {
  return http(`/api/games/${gameId}/undo`, { method: 'POST' })
}

export function eliminatePlayer(gameId, seatIndex, force = false) {
  return http(`/api/games/${gameId}/players/${seatIndex}/eliminate`, {
    method: 'POST',
    body: JSON.stringify({ force }),
  })
}

export function restorePlayer(gameId, seatIndex) {
  return http(`/api/games/${gameId}/players/${seatIndex}/restore`, { method: 'POST' })
}

export function nominatePlayer(gameId, seatIndex) {
  return http(`/api/games/${gameId}/votes/nominate`, {
    method: 'POST',
    body: JSON.stringify({ seatIndex }),
  })
}

export function castVote(gameId, seatIndex) {
  return http(`/api/games/${gameId}/votes/cast`, {
    method: 'POST',
    body: JSON.stringify({ seatIndex }),
  })
}

export function resetVotes(gameId) {
  return http(`/api/games/${gameId}/votes/reset`, { method: 'POST' })
}

export function resolveNight(gameId, payload) {
  return http(`/api/games/${gameId}/night/resolve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getGameResult(gameId) {
  return http(`/api/games/${gameId}/result`)
}

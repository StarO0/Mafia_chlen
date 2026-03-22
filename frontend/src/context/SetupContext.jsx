import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { computeRolesConfig } from '../utils/roles.js'

const SetupContext = createContext(null)

const initialPlayers = ['Игрок 1', 'Игрок 2', 'Игрок 3', 'Игрок 4']

export function SetupProvider({ children }) {
  const [gameId, setGameId] = useState(null)
  const [players, setPlayers] = useState(initialPlayers)
  const [rolesConfig, setRolesConfig] = useState(() => computeRolesConfig(initialPlayers.length))
  const [assignments, setAssignments] = useState({})

  const resetSetup = useCallback(() => {
    setGameId(null)
    setAssignments({})
    setPlayers(initialPlayers)
    setRolesConfig(computeRolesConfig(initialPlayers.length))
  }, [])

  const value = useMemo(
    () => ({
      gameId,
      setGameId,
      players,
      setPlayers,
      rolesConfig,
      setRolesConfig,
      assignments,
      setAssignments,
      resetSetup,
    }),
    [assignments, gameId, players, resetSetup, rolesConfig],
  )

  return <SetupContext.Provider value={value}>{children}</SetupContext.Provider>
}

export function useSetup() {
  const context = useContext(SetupContext)
  if (!context) throw new Error('useSetup must be used inside SetupProvider')
  return context
}

import { createContext, useContext, useMemo, useState } from 'react'

const defaultCustomRoles = [{ name: 'Доктор', count: 1 }]

const SetupContext = createContext(null)

export function SetupProvider({ children }) {
  const [gameId, setGameId] = useState(null)
  const [players, setPlayers] = useState(['Игрок 1', 'Игрок 2', 'Игрок 3', 'Игрок 4'])
  const [rolesConfig, setRolesConfig] = useState({
    mafiaCount: 1,
    donCount: 1,
    sheriffCount: 1,
    citizenCount: 1,
    customRoles: defaultCustomRoles,
    paperRolesEnabled: false,
  })
  const [assignments, setAssignments] = useState({})

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
      resetSetup: () => {
        setGameId(null)
        setAssignments({})
      },
    }),
    [assignments, gameId, players, rolesConfig],
  )

  return <SetupContext.Provider value={value}>{children}</SetupContext.Provider>
}

export function useSetup() {
  const context = useContext(SetupContext)
  if (!context) throw new Error('useSetup must be used inside SetupProvider')
  return context
}

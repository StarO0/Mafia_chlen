import { Navigate, Route, Routes } from 'react-router-dom'
import MainMenuPage from './pages/MainMenuPage.jsx'
import SetupPlayersPage from './pages/SetupPlayersPage.jsx'
import SetupRolesPage from './pages/SetupRolesPage.jsx'
import RoleDistributionPage from './pages/RoleDistributionPage.jsx'
import GameDashboardPage from './pages/GameDashboardPage.jsx'
import GameResultPage from './pages/GameResultPage.jsx'

function App() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-lg bg-mafia-panel">
      <Routes>
        <Route path="/" element={<MainMenuPage />} />
        <Route path="/setup/players" element={<SetupPlayersPage />} />
        <Route path="/setup/roles" element={<SetupRolesPage />} />
        <Route path="/setup/distribute" element={<RoleDistributionPage />} />
        <Route path="/game/:gameId" element={<GameDashboardPage />} />
        <Route path="/game/:gameId/result" element={<GameResultPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App

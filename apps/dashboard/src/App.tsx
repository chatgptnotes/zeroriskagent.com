import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import RecoveryDashboard from './pages/RecoveryDashboard'
import NMITracker from './pages/NMITracker'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/recovery" element={<RecoveryDashboard />} />
        <Route path="/nmi" element={<NMITracker />} />
      </Routes>
    </Router>
  )
}

export default App

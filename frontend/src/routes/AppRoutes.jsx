import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from '../pages/Login'
import Register from '../pages/Register'
import OAuthSuccess from '../pages/OAuthSuccess'
import AdminDashboard from '../pages/AdminDashboard'
import Dashboard from '../pages/Dashboard'
import CreateTicketPage from '../pages/CreateTicketPage'
import TechnicianTasksPage from '../pages/TechnicianTasksPage'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tickets/create" element={<CreateTicketPage />} />
        <Route path="/technician/tasks" element={<TechnicianTasksPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes

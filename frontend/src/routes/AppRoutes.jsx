import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from '../pages/Login'
import Register from '../pages/Register'
import OAuthSuccess from '../pages/OAuthSuccess'
import AdminDashboard from '../pages/AdminDashboard'
import Dashboard from '../pages/Dashboard'

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
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes

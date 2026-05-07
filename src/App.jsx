import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import GreenhousePage from './pages/GreenhousePage'

function ProtectedRoute({ children }) {
  const { user, synced } = useAuth()
  if (user === undefined) return null                    // Firebase проверяет сессию
  if (user === null) return <Navigate to="/auth" replace />
  if (!synced) return null                               // Firestore ещё подгружает данные
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/greenhouse/:id" element={<ProtectedRoute><GreenhousePage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export function ProtectedRoute({ children, requiredRoles = [] }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRoles.length > 0) {
    if (!user || !requiredRoles.includes(user.role)) {
      return <Navigate to="/" replace />
    }
  }

  return children
}

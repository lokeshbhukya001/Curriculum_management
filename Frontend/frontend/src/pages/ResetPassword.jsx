import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/api'

export function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid')
  const token = searchParams.get('token')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (!uid || !token) {
      setError('Invalid or missing reset token/UID in URL')
      return
    }

    setLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      await resetPassword({ uid, token, password, password_confirm: confirmPassword })
      setSuccessMessage('Password has been reset successfully. Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">
          Reset Password
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword

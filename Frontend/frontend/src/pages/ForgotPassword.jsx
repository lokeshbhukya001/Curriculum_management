import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { forgotPassword } from '../services/api'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      await forgotPassword(email)
      setSuccessMessage('Password reset link has been sent to your email. Please check your console if in development.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">
          Forgot Password
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
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 font-medium hover:underline"
          >
            Back to Login
          </button>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword

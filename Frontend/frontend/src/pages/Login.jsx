import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { login as loginApi, register as registerApi } from '../services/api'
import { loginStart, loginSuccess, loginFailure } from '../redux/slices/authSlice'

export function Login() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [role, setRole] = useState('student')
  const [instituteName, setInstituteName] = useState('CMRCET')
  const [successMessage, setSuccessMessage] = useState('')

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.auth)

  const handleLogin = async (e) => {
    e.preventDefault()
    dispatch(loginStart())
    try {
      const response = await loginApi({ username, password, institute_name: instituteName })
      dispatch(loginSuccess(response.data))
      navigate('/')
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.detail || 'Login failed'))
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      dispatch(loginFailure('Passwords do not match'))
      return
    }
    dispatch(loginStart())
    try {
      await registerApi({
        username,
        email,
        password,
        password_confirm: confirmPassword,
        role,
        institute_name: instituteName
      })
      setIsSignup(false)
      setSuccessMessage('Account created! Please login.')
      dispatch(loginFailure(null))
    } catch (err) {
      dispatch(loginFailure(err.response?.data || 'Signup failed'))
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white relative overflow-hidden">
      {/* Left Side - Gradient and Shapes (Hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 items-center justify-center p-12 relative overflow-hidden">
        {/* Abstract shapes mimicking the image */}
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-orange-400/30 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        
        {/* Diagonal Pills */}
        <div className="absolute bottom-10 left-10 w-16 h-64 bg-gradient-to-t from-orange-400 to-pink-500 rounded-full transform rotate-45 opacity-70"></div>
        <div className="absolute bottom-20 left-40 w-12 h-48 bg-gradient-to-t from-pink-500 to-purple-600 rounded-full transform rotate-45 opacity-60"></div>
        <div className="absolute bottom-40 left-1/4 w-10 h-32 bg-gradient-to-t from-purple-600 to-indigo-600 rounded-full transform rotate-45 opacity-50"></div>
        <div className="absolute top-10 left-1/2 w-8 h-24 bg-white/20 rounded-full transform rotate-45 opacity-30"></div>
        
        <div className="relative z-10 text-white max-w-lg">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">Welcome back</h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Manage your curriculum, track progress, and analyze data all in one place. Experience a bright and interactive way to handle your education data.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-indigo-600 uppercase tracking-wider">
              {isSignup ? 'User Sign Up' : 'User Login'}
            </h2>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
              <span>{typeof error === 'object' ? JSON.stringify(error) : error}</span>
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm border border-green-100 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-5">
            <div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-purple-50/50 border-0 rounded-full focus:ring-2 focus:ring-purple-500 transition-all text-sm placeholder-gray-400"
                  placeholder="Username"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0V9a2 2 0 012-2h2a2 2 0 012 2v12"></path></svg>
                </span>
                <select
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-purple-50/50 border-0 rounded-full focus:ring-2 focus:ring-purple-500 transition-all text-sm bg-white"
                  required
                >
                  <option value="CMRCET">CMR College of Engineering & Technology</option>
                  <option value="CMREC">CMR Engineering College</option>
                  <option value="CMRIT">CMR Institute of Technology</option>
                  <option value="CMRTC">CMR Technical Campus</option>
                </select>
              </div>
            </div>

            {isSignup && (
              <>
                <div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3 bg-purple-50/50 border-0 rounded-full focus:ring-2 focus:ring-purple-500 transition-all text-sm placeholder-gray-400"
                      placeholder="Email"
                      required
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </span>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3 bg-purple-50/50 border-0 rounded-full focus:ring-2 focus:ring-purple-500 transition-all text-sm bg-white"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H8m4-6a4 4 0 100-8 4 4 0 000 8zM5 20h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z"></path></svg>
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-purple-50/50 border-0 rounded-full focus:ring-2 focus:ring-purple-500 transition-all text-sm placeholder-gray-400"
                  placeholder="Password"
                  required
                />
              </div>
            </div>

            {isSignup && (
              <div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H8m4-6a4 4 0 100-8 4 4 0 000 8zM5 20h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z"></path></svg>
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 bg-purple-50/50 border-0 rounded-full focus:ring-2 focus:ring-purple-500 transition-all text-sm placeholder-gray-400"
                    placeholder="Confirm Password"
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 px-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" className="rounded-sm border-gray-300 text-purple-600 focus:ring-purple-500" />
                <span>Remember</span>
              </label>
              {!isSignup && (
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="hover:text-purple-600 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2.5 px-6 rounded-full font-semibold text-sm hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg uppercase tracking-wider"
              >
                {loading ? '...' : isSignup ? 'Sign Up' : 'Login'}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-purple-600 font-semibold hover:text-purple-700 transition-colors"
            >
              {isSignup ? 'Login' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

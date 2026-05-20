import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { login as loginApi, register as registerApi } from '../services/api'
import { loginStart, loginSuccess, loginFailure } from '../redux/slices/authSlice'

export function Login() {
  const [activeMode, setActiveMode] = useState('student') // 'student', 'faculty', 'admin'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [instituteName, setInstituteName] = useState('CMRCET')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.auth)

  const handleModeChange = (mode) => {
    setActiveMode(mode)
    setIsSignup(false)
    setUsername('')
    setPassword('')
    setConfirmPassword('')
    setEmail('')
    setSuccessMessage('')
    dispatch(loginFailure(null))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    dispatch(loginStart())
    try {
      const response = await loginApi({ username, password, institute_name: instituteName })
      const loggedUser = response.data.user
      const userRole = loggedUser.role.toLowerCase()

      // Enforce strict login portals
      if (activeMode === 'student' && userRole !== 'student') {
        dispatch(loginFailure('Access denied. This login portal is for Students only.'))
        return
      }
      if (activeMode === 'faculty' && userRole !== 'teacher') {
        dispatch(loginFailure('Access denied. This login portal is for Faculty/Teachers only.'))
        return
      }
      if (activeMode === 'admin' && userRole !== 'admin') {
        dispatch(loginFailure('Access denied. This login portal is for Administrators only.'))
        return
      }

      dispatch(loginSuccess(response.data))
      navigate('/')
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.detail || 'Login failed. Please check your credentials.'))
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      dispatch(loginFailure('Passwords do not match'))
      return
    }
    dispatch(loginStart())

    // Map active mode to DB role ('teacher' corresponds to faculty)
    const signupRole = activeMode === 'faculty' ? 'teacher' : activeMode

    try {
      await registerApi({
        username,
        email,
        password,
        password_confirm: confirmPassword,
        role: signupRole,
        institute_name: instituteName
      })
      setIsSignup(false)
      setSuccessMessage('Account created successfully! Please login.')
      dispatch(loginFailure(null))
    } catch (err) {
      const errorMsg = typeof err.response?.data === 'object'
        ? Object.values(err.response.data).flat().join(' ')
        : 'Signup failed. Please try again.'
      dispatch(loginFailure(errorMsg))
    }
  }

  const getModeTitle = () => {
    if (activeMode === 'student') return 'Student'
    if (activeMode === 'faculty') return 'Faculty'
    return 'Admin'
  }

  const PORTAL_CONFIGS = {
    student: {
      title: 'Learn & Grow',
      description: 'Access your syllabus, download study materials, and manage your course assignments all in one interactive timeline.',
      gradient: 'from-violet-600 via-purple-600 to-pink-500',
      accentColor: 'from-orange-400 to-pink-500'
    },
    faculty: {
      title: 'Empower Learning',
      description: 'Design structured course modules, curate rich study resources, assign homework, and review student progress seamlessly.',
      gradient: 'from-blue-600 via-indigo-600 to-cyan-500',
      accentColor: 'from-teal-400 to-indigo-500'
    },
    admin: {
      title: 'Organize & Oversee',
      description: 'Govern institutional programs, monitor curriculum frameworks, maintain role privileges, and track system analytics.',
      gradient: 'from-slate-800 via-violet-900 to-emerald-700',
      accentColor: 'from-emerald-400 to-purple-600'
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white relative overflow-hidden font-sans">
      
      {/* Left Side - Dynamic Role-Based Theme */}
      <div className={`hidden md:flex md:w-1/2 bg-gradient-to-br ${PORTAL_CONFIGS[activeMode].gradient} items-center justify-center p-12 relative overflow-hidden transition-all duration-500`}>
        {/* Abstract shapes */}
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-orange-400/30 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        
        {/* Diagonal Pills */}
        <div className={`absolute bottom-10 left-10 w-16 h-64 bg-gradient-to-t ${PORTAL_CONFIGS[activeMode].accentColor} rounded-full transform rotate-45 opacity-70 transition-all duration-500`}></div>
        <div className="absolute bottom-20 left-40 w-12 h-48 bg-gradient-to-t from-pink-500 to-purple-600 rounded-full transform rotate-45 opacity-60"></div>
        <div className="absolute bottom-40 left-1/4 w-10 h-32 bg-gradient-to-t from-purple-600 to-indigo-600 rounded-full transform rotate-45 opacity-50"></div>
        <div className="absolute top-10 left-1/2 w-8 h-24 bg-white/20 rounded-full transform rotate-45 opacity-30"></div>
        
        <div className="relative z-10 text-white max-w-lg">
          <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
            {getModeTitle()} Portal
          </span>
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight mt-6 transition-all duration-300">
            {PORTAL_CONFIGS[activeMode].title}
          </h1>
          <p className="text-lg text-white/80 leading-relaxed transition-all duration-300">
            {PORTAL_CONFIGS[activeMode].description}
          </p>
        </div>
      </div>

      {/* Right Side - Form styled in the project's original theme */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-indigo-600 uppercase tracking-wider">
              {isSignup ? `Create ${getModeTitle()} Account` : `${getModeTitle()} Login`}
            </h2>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100 flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
              </svg>
              <span>{typeof error === 'object' ? JSON.stringify(error) : error}</span>
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm border border-green-100 flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-5">
            
            {/* Username */}
            <div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-purple-50/50 border-0 rounded-full focus:ring-2 focus:ring-purple-500 transition-all text-sm placeholder-gray-400"
                  placeholder={activeMode === 'student' ? 'Username or Student ID' : 'Username'}
                  required
                />
              </div>
            </div>

            {/* Email (only for signup) */}
            {isSignup && (
              <div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 bg-purple-50/50 border-0 rounded-full focus:ring-2 focus:ring-purple-500 transition-all text-sm placeholder-gray-400"
                    placeholder="Email Address"
                    required
                  />
                </div>
              </div>
            )}

            {/* College Selection Dropdown (For all modes) */}
            <div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 z-10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0V9a2 2 0 012-2h2a2 2 0 012 2v12"></path>
                  </svg>
                </span>
                <select
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  className="block w-full pl-12 pr-10 py-3 bg-purple-50/50 border-0 rounded-full focus:ring-2 focus:ring-purple-500 transition-all text-sm bg-white appearance-none cursor-pointer"
                  required
                >
                  <option value="CMRCET">CMR College of Engineering & Technology</option>
                  <option value="CMREC">CMR Engineering College</option>
                  <option value="CMRIT">CMR Institute of Technology</option>
                  <option value="CMRTC">CMR Technical Campus</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H8m4-6a4 4 0 100-8 4 4 0 000 8zM5 20h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z"></path>
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-3 bg-purple-50/50 border-0 rounded-full focus:ring-2 focus:ring-purple-500 transition-all text-sm placeholder-gray-400"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-purple-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password (only for signup) */}
            {isSignup && (
              <div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H8m4-6a4 4 0 100-8 4 4 0 000 8zM5 20h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z"></path>
                    </svg>
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

            {/* Remember Me & Forgot Password */}
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

            {/* Submit Button */}
            <div className="flex justify-center mt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2.5 px-6 rounded-full font-semibold text-sm hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg uppercase tracking-wider"
              >
                {loading ? '...' : isSignup ? 'Sign Up' : 'Login'}
              </button>
            </div>
          </form>



          {/* Toggle Signup/Login */}
          <p className="mt-8 text-center text-sm text-gray-600">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-purple-600 font-semibold hover:text-purple-700 transition-colors"
            >
              {isSignup ? 'Login' : 'Sign Up'}
            </button>
          </p>

          {/* Swap Login Portals Links (Matching Layout in the uploaded image) */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            {activeMode === 'student' && (
              <>
                <div className="flex items-center gap-1">
                  <span>FACULTY?</span>
                  <button
                    onClick={() => handleModeChange('faculty')}
                    className="text-purple-600 font-bold hover:underline tracking-wider"
                  >
                    LOGIN HERE
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <span>ADMIN?</span>
                  <button
                    onClick={() => handleModeChange('admin')}
                    className="text-[#00e676] font-bold hover:underline tracking-wider"
                  >
                    LOGIN HERE
                  </button>
                </div>
              </>
            )}

            {activeMode === 'faculty' && (
              <>
                <div className="flex items-center gap-1">
                  <span>STUDENT?</span>
                  <button
                    onClick={() => handleModeChange('student')}
                    className="text-purple-600 font-bold hover:underline tracking-wider"
                  >
                    LOGIN HERE
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <span>ADMIN?</span>
                  <button
                    onClick={() => handleModeChange('admin')}
                    className="text-[#00e676] font-bold hover:underline tracking-wider"
                  >
                    LOGIN HERE
                  </button>
                </div>
              </>
            )}

            {activeMode === 'admin' && (
              <>
                <div className="flex items-center gap-1">
                  <span>STUDENT?</span>
                  <button
                    onClick={() => handleModeChange('student')}
                    className="text-purple-600 font-bold hover:underline tracking-wider"
                  >
                    LOGIN HERE
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <span>FACULTY?</span>
                  <button
                    onClick={() => handleModeChange('faculty')}
                    className="text-[#00e676] font-bold hover:underline tracking-wider"
                  >
                    LOGIN HERE
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default Login

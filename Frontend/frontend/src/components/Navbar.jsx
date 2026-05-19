import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Bell, Search, UserCircle2, BookOpenCheck, LogOut } from 'lucide-react'
import { logoutUser } from '../services/api'
import { logout } from '../redux/slices/authSlice'

export function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      dispatch(logout())
      navigate('/login')
    }
  }

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  return (
    <div className="w-full bg-white shadow-sm border-b border-gray-200 px-6 py-2 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <BookOpenCheck className="text-blue-600" size={20} />
          <span className="hidden lg:inline uppercase tracking-tight">Curriculum Management</span>
          <span className="lg:hidden">CMS</span>
        </h1>
      </div>

      <div className="flex items-center gap-5">
        <div className="hidden md:flex items-center bg-gray-100 px-3 py-2 rounded-xl w-72 border border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search programs, courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="bg-transparent ml-2 outline-none w-full text-gray-700"
          />
        </div>

        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
          <Bell size={24} />
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            3
          </span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 pr-3 hover:bg-gray-100 rounded-xl transition"
          >
            <UserCircle2 size={32} className="text-blue-600" />
            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold text-gray-800 leading-none">
                {user?.username || 'User'}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
                {user?.role || 'Guest'}
              </p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Signed in as</p>
                <p className="text-sm font-bold text-gray-800 truncate">{user?.email}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={() => {
                    navigate('/profile')
                    setShowUserMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  My Profile
                </button>
                <button
                  onClick={() => {
                    navigate('/settings')
                    setShowUserMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  Settings
                </button>
                <div className="my-2 border-t border-gray-100"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2 font-semibold"
                >
                  <LogOut size={18} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

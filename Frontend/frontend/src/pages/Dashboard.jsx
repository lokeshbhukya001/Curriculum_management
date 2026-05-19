import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getStats } from '../services/api'

export function Dashboard() {
  const { user } = useSelector((state) => state.auth)
  const [stats, setStats] = useState({
    programs: 0,
    courses: 0,
    modules: 0,
    topics: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const response = await getStats()
        setStats(response.data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching stats:', err)
        setError('Failed to fetch statistics')
        setLoading(false)
      }
    }

    if (user) {
      fetchStats()
    }
  }, [user?.id])

  const statCards = [
    { label: 'Programs', key: 'programs', color: 'text-blue-600', path: '/programs', icon: '📁' },
    { label: 'Courses', key: 'courses', color: 'text-green-600', path: '/courses', icon: '📚' },
    { label: 'Modules', key: 'modules', color: 'text-purple-600', path: '/modules', icon: '🧩' },
    { label: 'Topics', key: 'topics', color: 'text-red-600', path: '/topics', icon: '📝' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-xl font-semibold text-gray-500 animate-pulse">Loading Analytics...</div>
    </div>
  )

  if (error) return (
    <div className="p-8">
      <div className="bg-red-100 text-red-700 p-4 rounded-xl border border-red-200">
        {error}
      </div>
    </div>
  )

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-gray-500 text-sm">Summary of your curriculum platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Link 
            to={card.path} 
            key={card.key} 
            className="group bg-white p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wider">{card.label}</h2>
            <p className={`text-3xl font-black mt-1 ${card.color}`}>
              {stats[card.key]}
            </p>
          </Link>
        ))}
      </div>

      {/* Placeholder for Quick Actions or Recent Activity */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/programs" className="p-4 bg-blue-50 text-blue-700 rounded-2xl hover:bg-blue-100 transition text-center font-bold">
              + New Program
            </Link>
            <Link to="/courses" className="p-4 bg-green-50 text-green-700 rounded-2xl hover:bg-green-100 transition text-center font-bold">
              + New Course
            </Link>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center">
          <p className="text-gray-400 italic">Recent activity will appear here...</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
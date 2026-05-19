
import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Layers3,
  FileText,
  CalendarDays,
  BrainCircuit,
  History,
} from 'lucide-react'

export function Sidebar() {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: BookOpen, label: 'Programs', path: '/programs' },
    { icon: Layers3, label: 'Courses', path: '/courses' },
    { icon: FileText, label: 'Modules', path: '/modules' },
    { icon: Layers3, label: 'Topics', path: '/topics' },
    { icon: CalendarDays, label: 'Schedule', path: '/schedule', color: 'text-green-400' },
    { icon: BrainCircuit, label: 'AI Analysis', path: '/ai-analysis', color: 'text-purple-400' },
    { icon: History, label: 'System Logs', path: '/audit-logs', color: 'text-orange-400' },
  ]

  return (
    <div className="w-64 h-screen bg-gray-900 text-white p-4 flex flex-col shadow-2xl">
      <h1 className="text-2xl font-black mb-6 text-blue-400 tracking-tighter px-2">
        CMS PRO
      </h1>

      <ul className="space-y-1 text-sm overflow-y-auto flex-1 custom-scrollbar">
        {navItems.map((item) => {
          const IconComponent = item.icon
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className="flex items-center gap-4 py-2 px-3 rounded-xl hover:bg-gray-800 transition-all group"
              >
                <IconComponent size={22} className={`${item.color || 'text-blue-400'} group-hover:scale-110 transition-transform`} /> 
                <span className="font-medium group-hover:translate-x-1 transition-transform">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

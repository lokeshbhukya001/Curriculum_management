import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { History, User, Activity, Clock, Database } from 'lucide-react'

export function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const res = await api.get('/audit-logs/')
      setLogs(res.data.results || res.data || [])
      setLoading(false)
    } catch (err) {
      setError('Failed to load audit logs. Only admins can view this.')
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading system logs...</div>
  if (error) return <div className="p-8 text-red-500 bg-red-50 rounded-2xl m-8 border border-red-100 flex items-center gap-2"><Activity size={20} /> {error}</div>

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-10 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <History className="text-blue-600" /> System Audit Logs
        </h1>
        <p className="mt-2 text-gray-600 text-lg">Track all changes across programs, courses, modules, and topics.</p>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Model</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">No logs recorded yet.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="font-semibold text-gray-700">{log.username || 'System'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                      log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-purple-600">
                    <div className="flex items-center gap-2">
                      <Database size={14} />
                      {log.table_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="max-w-xs truncate font-medium">
                      {log.new_data?.title || log.old_data?.title || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-bold">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

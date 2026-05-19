import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { getSchedules, createSchedule, getCourses } from '../services/api'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Calendar as CalendarIcon, Plus, AlertCircle, Clock } from 'lucide-react'

export function Schedule() {
  const [schedules, setSchedules] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ course: '', date: '', start_time: '', end_time: '' })
  const [conflict, setConflict] = useState(null)

  const { user } = useSelector((state) => state.auth)
  const canAdd = user?.role === 'admin' || user?.role === 'teacher'

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [schRes, courseRes] = await Promise.all([getSchedules(), getCourses()])
      setSchedules(schRes.data.results || schRes.data || [])
      setCourses(courseRes.data.results || courseRes.data || [])
      setLoading(false)
    } catch (err) {
      setError('Failed to fetch schedules')
      setLoading(false)
    }
  }

  const checkConflict = (newSch) => {
    const newStart = `${newSch.date}T${newSch.start_time}`
    const newEnd = `${newSch.date}T${newSch.end_time}`
    
    const overlap = schedules.find(s => {
      if (s.date !== newSch.date) return false
      const sStart = `${s.date}T${s.start_time}`
      const sEnd = `${s.date}T${s.end_time}`
      return (newStart < sEnd && newEnd > sStart)
    })
    
    return overlap
  }

  const handleTimeChange = (e, field) => {
    const newValue = e.target.value
    const updatedForm = { ...formData, [field]: newValue }
    setFormData(updatedForm)
    
    if (updatedForm.date && updatedForm.start_time && updatedForm.end_time) {
      const existing = checkConflict(updatedForm)
      if (existing) {
        setConflict(`Conflict detected with ${existing.course_name} (${existing.start_time.substring(0,5)} - ${existing.end_time.substring(0,5)})`)
      } else {
        setConflict(null)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (conflict && !window.confirm('Schedule conflict detected. Save anyway?')) return
    
    try {
      await createSchedule(formData)
      setFormData({ course: '', date: '', start_time: '', end_time: '' })
      setShowForm(false)
      setConflict(null)
      fetchInitialData()
    } catch (err) {
      setError('Failed to create schedule')
    }
  }

  const calendarEvents = schedules.map(s => ({
    id: s.id,
    title: s.course_name,
    start: `${s.date}T${s.start_time}`,
    end: `${s.date}T${s.end_time}`,
    extendedProps: { teacher: s.teacher_name }
  }))

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Academic Calendar...</div>

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <CalendarIcon className="text-blue-600" size={24} /> Academic Calendar
          </h1>
          <p className="text-gray-500 text-sm">Manage and view all course schedules.</p>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-lg font-bold text-sm"
          >
            {showForm ? 'View Calendar' : <><Plus size={18} /> Add Session</>}
          </button>
        )}
      </div>

      {error && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-2xl border border-red-200">{error}</div>}

      {showForm ? (
        <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-300">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Clock className="text-blue-500" size={20} /> New Class Session
          </h2>
          
          {courses.length === 0 ? (
            <div className="text-center py-10">
              <div className="bg-orange-50 text-orange-700 p-4 rounded-xl border border-orange-100 mb-6 text-sm font-medium">
                No courses found for your college! You need to create a course before you can schedule a session.
              </div>
              <button 
                onClick={() => window.location.href = '/courses'}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg"
              >
                Create Course Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Select Course</label>
                <select
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                  required
                >
                  <option value="">-- Choose a course --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleTimeChange(e, 'date')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => handleTimeChange(e, 'start_time')}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => handleTimeChange(e, 'end_time')}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                    required
                  />
                </div>
              </div>

              {conflict && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100 text-xs font-bold animate-pulse">
                  <AlertCircle size={16} />
                  <span>{conflict}</span>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg text-sm uppercase tracking-wider">
                  Save Schedule
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition text-sm">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={calendarEvents}
            eventClick={(info) => {
              alert(`Course: ${info.event.title}\nTeacher: ${info.event.extendedProps.teacher}\nTime: ${info.event.start.toLocaleTimeString()} - ${info.event.end.toLocaleTimeString()}`)
            }}
            height="700px"
            eventBackgroundColor="#2563eb"
            eventBorderColor="#1d4ed8"
            dayMaxEvents={true}
          />
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { getCourses, createCourse, updateCourse, deleteCourse, getPrograms } from '../services/api'

export function Courses() {
  const [courses, setCourses] = useState([])
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [formData, setFormData] = useState({ title: '', description: '', program: '' })

  const { user } = useSelector((state) => state.auth)
  
  // Permissions
  const userRole = user?.role?.toLowerCase()
  const isAdmin = userRole === 'admin'
  const isTeacher = userRole === 'teacher'
  const canAdd = isAdmin || isTeacher
  const canDelete = isAdmin

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [coursesRes, programsRes] = await Promise.all([getCourses(), getPrograms()])
      
      const coursesData = coursesRes.data.results || coursesRes.data
      setCourses(Array.isArray(coursesData) ? coursesData : [])
      
      const programsData = programsRes.data.results || programsRes.data
      setPrograms(Array.isArray(programsData) ? programsData : [])
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to fetch data')
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, formData)
      } else {
        await createCourse(formData)
      }
      resetForm()
      fetchInitialData()
    } catch (err) {
      setError(editingCourse ? 'Failed to update course' : 'Failed to create course')
    }
  }

  const handleEdit = (course) => {
    setEditingCourse(course)
    setFormData({ 
      title: course.title, 
      description: course.description, 
      program: course.program 
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this course?')) {
      try {
        await deleteCourse(id)
        fetchInitialData()
      } catch (err) {
        setError('Failed to delete course')
      }
    }
  }

  const resetForm = () => {
    setEditingCourse(null)
    setFormData({ title: '', description: '', program: '' })
    setShowForm(false)
  }

  if (loading) return <div className="p-8 text-center text-xl">Loading...</div>

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Courses</h1>
        {canAdd && (
          <button
            onClick={() => {
              if (showForm) resetForm()
              else setShowForm(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            {showForm ? 'Cancel' : 'Add Course'}
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-xl shadow-md space-y-4 border border-blue-100">
          <h2 className="text-xl font-semibold text-gray-700">
            {editingCourse ? 'Edit Course' : 'Create New Course'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Course Title</label>
              <input
                type="text"
                placeholder="Course Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Program</label>
              <select
                value={formData.program}
                onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a Program</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              required
            />
          </div>
          <div className="flex space-x-3">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-bold shadow-sm">
              {editingCourse ? 'Update Course' : 'Save Course'}
            </button>
            {editingCourse && (
              <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition font-bold shadow-sm">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 bg-white p-12 rounded-xl shadow-inner">No courses yet</div>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{course.title}</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
              <div className="text-xs text-blue-600 font-bold mb-4 bg-blue-50 inline-block px-2 py-1 rounded">
                Program ID: {course.program}
              </div>
              {(isAdmin || isTeacher) && (
                <div className="flex space-x-4 border-t pt-4">
                  <button 
                    onClick={() => handleEdit(course)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-bold transition"
                  >
                    Edit
                  </button>
                  {canDelete && (
                    <button 
                      onClick={() => handleDelete(course.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-bold transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

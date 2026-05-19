import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { getPrograms, createProgram, updateProgram, deleteProgram } from '../services/api'

export function Programs() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingProgram, setEditingProgram] = useState(null)
  const [formData, setFormData] = useState({ title: '', description: '', institution_id: 'default' })

  const { user } = useSelector((state) => state.auth)
  
  // Permissions logic
  const userRole = user?.role?.toLowerCase()
  const isAdmin = userRole === 'admin'
  const isTeacher = userRole === 'teacher'
  const canAdd = isAdmin || isTeacher
  const canDelete = isAdmin

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      const response = await getPrograms()
      const data = response.data.results || response.data
      setPrograms(Array.isArray(data) ? data : [])
      setLoading(false)
    } catch (err) {
      setError('Failed to fetch programs')
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingProgram) {
        await updateProgram(editingProgram.id, formData)
      } else {
        await createProgram(formData)
      }
      resetForm()
      fetchPrograms()
    } catch (err) {
      setError(editingProgram ? 'Failed to update program' : 'Failed to create program')
    }
  }

  const handleEdit = (program) => {
    setEditingProgram(program)
    setFormData({ 
      title: program.title, 
      description: program.description, 
      institution_id: program.institution_id || 'default' 
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      try {
        await deleteProgram(id)
        fetchPrograms()
      } catch (err) {
        setError('Failed to delete program')
      }
    }
  }

  const resetForm = () => {
    setEditingProgram(null)
    setFormData({ title: '', description: '', institution_id: 'default' })
    setShowForm(false)
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Programs</h1>
        {canAdd && (
          <button
            onClick={() => {
              if (showForm) resetForm()
              else setShowForm(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-lg"
          >
            {showForm ? 'Cancel' : 'Add Program'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-xl shadow-md space-y-4 border border-blue-100">
          <h2 className="text-xl font-semibold text-gray-700">
            {editingProgram ? 'Edit Program' : 'Create New Program'}
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">Program Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="e.g. Computer Science B.Sc."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Provide a detailed description of the program..."
              rows="4"
              required
            />
          </div>
          <div className="flex space-x-3">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold shadow-md">
              {editingProgram ? 'Update Program' : 'Save Program'}
            </button>
            {editingProgram && (
              <button 
                type="button" 
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition font-semibold shadow-md"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <div key={program.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition group">
            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition">{program.title}</h3>
            <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">{program.description}</p>
            {(isAdmin || isTeacher) && (
              <div className="flex space-x-4 mt-4 pt-4 border-t border-gray-50">
                <button 
                  onClick={() => handleEdit(program)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-bold transition"
                >
                  Edit
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(program.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-bold transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

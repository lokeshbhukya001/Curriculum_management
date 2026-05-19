import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { getModules, createModule, updateModule, deleteModule, getCourses, reorderModules } from '../services/api'
import { GripVertical } from 'lucide-react'
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableModule({ module, isAdmin, isTeacher, canDelete, handleEdit, handleDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: module.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition relative group"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-gray-800">{module.title}</h3>
        {(isAdmin || isTeacher) && (
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab p-1 text-gray-400 hover:text-gray-600 active:cursor-grabbing"
          >
            <GripVertical size={20} />
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-500 mb-4">Module # {module.order_number}</p>
      <div className="text-xs text-green-600 font-bold mb-4 bg-green-50 inline-block px-2 py-1 rounded">
        Course ID: {module.course}
      </div>
      
      {(isAdmin || isTeacher) && (
        <div className="flex space-x-4 border-t pt-4">
          <button 
            onClick={() => handleEdit(module)}
            className="text-blue-600 hover:text-blue-800 text-sm font-bold transition"
          >
            Edit
          </button>
          {canDelete && (
            <button 
              onClick={() => handleDelete(module.id)}
              className="text-red-500 hover:text-red-700 text-sm font-bold transition"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function Modules() {
  const [modules, setModules] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingModule, setEditingModule] = useState(null)
  const [formData, setFormData] = useState({ title: '', course: '', order_number: 0 })

  const { user } = useSelector((state) => state.auth)
  
  const userRole = user?.role?.toLowerCase()
  const isAdmin = userRole === 'admin'
  const isTeacher = userRole === 'teacher'
  const canAdd = isAdmin || isTeacher
  const canDelete = isAdmin

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [modulesRes, coursesRes] = await Promise.all([getModules(), getCourses()])
      
      let modulesData = modulesRes.data.results || modulesRes.data
      modulesData = Array.isArray(modulesData) ? modulesData : []
      // Sort by order_number
      modulesData.sort((a, b) => (a.order_number || 0) - (b.order_number || 0))
      
      setModules(modulesData)
      
      const coursesData = coursesRes.data.results || coursesRes.data
      setCourses(Array.isArray(coursesData) ? coursesData : [])
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to fetch data')
      setLoading(false)
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    
    if (active.id !== over.id) {
      const oldIndex = modules.findIndex((m) => m.id === active.id)
      const newIndex = modules.findIndex((m) => m.id === over.id)
      
      const newModules = arrayMove(modules, oldIndex, newIndex)
      setModules(newModules)
      
      // Update order_numbers in backend
      const orders = newModules.map((module, index) => ({
        id: module.id,
        order_number: index
      }))
      
      try {
        await reorderModules(orders)
      } catch (err) {
        console.error('Failed to save order:', err)
        setError('Failed to save new order')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingModule) {
        await updateModule(editingModule.id, formData)
      } else {
        const nextOrder = modules.length > 0 ? Math.max(...modules.map(m => m.order_number || 0)) + 1 : 0
        await createModule({ ...formData, order_number: nextOrder })
      }
      resetForm()
      fetchInitialData()
    } catch (err) {
      setError(editingModule ? 'Failed to update module' : 'Failed to create module')
    }
  }

  const handleEdit = (module) => {
    setEditingModule(module)
    setFormData({ 
      title: module.title, 
      course: module.course,
      order_number: module.order_number 
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this module?')) {
      try {
        await deleteModule(id)
        fetchInitialData()
      } catch (err) {
        setError('Failed to delete module')
      }
    }
  }

  const resetForm = () => {
    setEditingModule(null)
    setFormData({ title: '', course: '', order_number: 0 })
    setShowForm(false)
  }

  if (loading) return <div className="p-8 text-center text-xl">Loading...</div>

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Modules</h1>
        {canAdd && (
          <button
            onClick={() => {
              if (showForm) resetForm()
              else setShowForm(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            {showForm ? 'Cancel' : 'Add Module'}
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-xl shadow-md space-y-4 border border-blue-100">
          <h2 className="text-xl font-semibold text-gray-700">
            {editingModule ? 'Edit Module' : 'Create New Module'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Module Title</label>
              <input
                type="text"
                placeholder="Module Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Course</label>
              <select
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a Course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex space-x-3">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-bold shadow-sm">
              {editingModule ? 'Update Module' : 'Save Module'}
            </button>
            {editingModule && (
              <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition font-bold shadow-sm">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={modules.map(m => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 bg-white p-12 rounded-xl shadow-inner">No modules yet</div>
            ) : (
              modules.map((module) => (
                <SortableModule 
                  key={module.id} 
                  module={module} 
                  isAdmin={isAdmin}
                  isTeacher={isTeacher}
                  canDelete={canDelete}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

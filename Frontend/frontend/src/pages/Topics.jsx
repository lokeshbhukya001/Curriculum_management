import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { 
  getTopics, 
  createTopic, 
  updateTopic, 
  deleteTopic, 
  getModules,
  reorderTopics 
} from '../services/api'
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

function SortableTopic({ topic, isAdmin, isTeacher, canDelete, handleEdit, handleDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: topic.id })

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
        <Link to={`/topics/${topic.id}`} className="hover:text-blue-600 transition flex-1">
          <h3 className="text-xl font-bold text-gray-800">{topic.title}</h3>
        </Link>
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
      
      <p className="text-gray-600 mb-4 line-clamp-3 text-sm">{topic.content}</p>
      <div className="text-xs text-purple-600 font-bold mb-4 bg-purple-50 inline-block px-2 py-1 rounded">
        Module ID: {topic.module}
      </div>
      
      {(isAdmin || isTeacher) && (
        <div className="flex space-x-4 border-t pt-4">
          <button 
            onClick={() => handleEdit(topic)}
            className="text-blue-600 hover:text-blue-800 text-sm font-bold transition"
          >
            Edit
          </button>
          {canDelete && (
            <button 
              onClick={() => handleDelete(topic.id)}
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

export function Topics() {
  const [topics, setTopics] = useState([])
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingTopic, setEditingTopic] = useState(null)
  const [formData, setFormData] = useState({ title: '', content: '', module: '', order_number: 0 })

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
      const [topicsRes, modulesRes] = await Promise.all([getTopics(), getModules()])
      
      let topicsData = topicsRes.data.results || topicsRes.data
      topicsData = Array.isArray(topicsData) ? topicsData : []
      // Sort by order_number
      topicsData.sort((a, b) => (a.order_number || 0) - (b.order_number || 0))
      
      setTopics(topicsData)
      
      const modulesData = modulesRes.data.results || modulesRes.data
      setModules(Array.isArray(modulesData) ? modulesData : [])
      
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
      const oldIndex = topics.findIndex((t) => t.id === active.id)
      const newIndex = topics.findIndex((t) => t.id === over.id)
      
      const newTopics = arrayMove(topics, oldIndex, newIndex)
      setTopics(newTopics)
      
      // Update order_numbers in backend
      const orders = newTopics.map((topic, index) => ({
        id: topic.id,
        order_number: index
      }))
      
      try {
        await reorderTopics(orders)
      } catch (err) {
        console.error('Failed to save order:', err)
        setError('Failed to save new order')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingTopic) {
        await updateTopic(editingTopic.id, formData)
      } else {
        // Set order_number to end of list
        const nextOrder = topics.length > 0 ? Math.max(...topics.map(t => t.order_number || 0)) + 1 : 0
        await createTopic({ ...formData, order_number: nextOrder })
      }
      resetForm()
      fetchInitialData()
    } catch (err) {
      setError(editingTopic ? 'Failed to update topic' : 'Failed to create topic')
    }
  }

  const handleEdit = (topic) => {
    setEditingTopic(topic)
    setFormData({ 
      title: topic.title, 
      content: topic.content,
      module: topic.module,
      order_number: topic.order_number 
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this topic?')) {
      try {
        await deleteTopic(id)
        fetchInitialData()
      } catch (err) {
        setError('Failed to delete topic')
      }
    }
  }

  const resetForm = () => {
    setEditingTopic(null)
    setFormData({ title: '', content: '', module: '', order_number: 0 })
    setShowForm(false)
  }

  if (loading) return <div className="p-8 text-center text-xl">Loading...</div>

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Curriculum Topics</h1>
        {canAdd && (
          <button
            onClick={() => {
              if (showForm) resetForm()
              else setShowForm(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            {showForm ? 'Cancel' : 'Add Topic'}
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-xl shadow-md space-y-4 border border-blue-100">
          <h2 className="text-xl font-semibold text-gray-700">
            {editingTopic ? 'Edit Topic' : 'Create New Topic'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Topic Title</label>
              <input
                type="text"
                placeholder="Topic Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Module</label>
              <select
                value={formData.module}
                onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a Module</option>
                {modules.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Content</label>
            <textarea
              placeholder="Topic Content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              rows="5"
            />
          </div>
          <div className="flex space-x-3">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-bold shadow-sm">
              {editingTopic ? 'Update Topic' : 'Save Topic'}
            </button>
            {editingTopic && (
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
          items={topics.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 bg-white p-12 rounded-xl shadow-inner">No topics yet</div>
            ) : (
              topics.map((topic) => (
                <SortableTopic 
                  key={topic.id} 
                  topic={topic} 
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

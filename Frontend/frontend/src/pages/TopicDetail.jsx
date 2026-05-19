import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { 
  getTopicDetail, 
  generateAIContent, 
  updateTopic, 
  uploadMaterial, 
  deleteMaterial, 
  createAssignment, 
  getAssignmentsByTopic 
} from '../services/api'
import { 
  FileText, 
  Video, 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  Download, 
  ExternalLink,
  BookOpen,
  ClipboardList,
  Clock,
  Sparkles,
  ArrowLeft
} from 'lucide-react'

export function TopicDetail() {
  const { id } = useParams()
  const [topic, setTopic] = useState(null)
  const [materials, setMaterials] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  
  const [materialData, setMaterialData] = useState({ title: '', file: null, file_url: '', file_type: 'pdf' })
  const [assignmentData, setAssignmentData] = useState({ title: '', description: '', deadline: '' })
  const [isEditingContent, setIsEditingContent] = useState(false)
  const [editedContent, setEditedContent] = useState('')

  const { user } = useSelector((state) => state.auth)
  const canManage = user?.role === 'admin' || user?.role === 'teacher'

  useEffect(() => {
    fetchTopicData()
  }, [id])

  const fetchTopicData = async () => {
    setLoading(true)
    try {
      const [topicRes, assignmentsRes] = await Promise.all([
        getTopicDetail(id),
        getAssignmentsByTopic(id)
      ])
      setTopic(topicRes.data)
      setEditedContent(topicRes.data.content || '')
      setMaterials(topicRes.data.materials || [])
      setAssignments(assignmentsRes.data.results || assignmentsRes.data || [])
      setLoading(false)
    } catch (err) {
      console.error('Error fetching topic detail:', err)
      setError('Failed to load topic details')
      setLoading(false)
    }
  }

  const handleGenerateAI = async () => {
    if (!window.confirm('Use Gemma AI to generate detailed study notes for this topic?')) return
    setIsGenerating(true)
    try {
      const response = await generateAIContent(topic.title)
      const aiContent = response.data.content
      await updateTopic(id, { content: aiContent })
      setTopic({ ...topic, content: aiContent })
      alert('Content generated successfully!')
    } catch (err) {
      console.error('AI Generation failed:', err)
      alert(err.response?.data?.error || 'AI Generation failed. Check your API key.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveContent = async () => {
    try {
      await updateTopic(id, { content: editedContent })
      setTopic({ ...topic, content: editedContent })
      setIsEditingContent(false)
      alert('Content saved successfully!')
    } catch (err) {
      alert('Failed to save content')
    }
  }

  const handleMaterialUpload = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('topic', id)
    formData.append('title', materialData.title)
    formData.append('file_type', materialData.file_type)
    if (materialData.file) {
      formData.append('file', materialData.file)
    } else if (materialData.file_url) {
      formData.append('file_url', materialData.file_url)
    }

    try {
      await uploadMaterial(formData)
      fetchTopicData()
      setShowMaterialForm(false)
      setMaterialData({ title: '', file: null, file_url: '', file_type: 'pdf' })
    } catch (err) {
      alert('Upload failed')
    }
  }

  const handleAssignmentCreate = async (e) => {
    e.preventDefault()
    try {
      await createAssignment({
        ...assignmentData,
        topic: id,
        course: topic.module_detail?.course || 1
      })
      fetchTopicData()
      setShowAssignmentForm(false)
      setAssignmentData({ title: '', description: '', deadline: '' })
    } catch (err) {
      alert('Failed to create assignment')
    }
  }

  const handleDeleteMaterial = async (mId) => {
    if (window.confirm('Delete this material?')) {
      try {
        await deleteMaterial(mId)
        fetchTopicData()
      } catch (err) {
        alert('Delete failed')
      }
    }
  }

  const handleViewMaterial = async (url) => {
    if (!url) return;
    
    // For PDFs and videos, or external links, open directly
    if (url.endsWith('.pdf') || url.endsWith('.mp4')) {
      window.open(url, '_blank');
      return;
    }

    try {
      const response = await fetch(url);
      const text = await response.text();
      
      let blob;
      if (url.endsWith('.json')) {
        blob = new Blob([text], { type: 'application/json' });
      } else if (url.endsWith('.csv')) {
        blob = new Blob([text], { type: 'text/plain' }); // text/plain opens in browser
      } else {
        window.open(url, '_blank');
        return;
      }
      
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('Error viewing material:', err);
      window.open(url, '_blank'); // fallback
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-xl font-bold text-gray-400 animate-pulse">Fetching Topic Details...</div>
    </div>
  )
  
  if (error) return <div className="p-8 text-red-500 font-bold bg-red-50 rounded-2xl m-6 border border-red-100">{error}</div>
  if (!topic) return <div className="p-8 text-gray-500">Topic not found</div>

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Link to="/topics" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold text-sm mb-6 transition-all">
        <ArrowLeft size={16} /> Back to Topics
      </Link>

      {/* Header Card */}
      <div className="mb-8 bg-white p-6 lg:p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
          <div className="flex-1 space-y-4">
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight">
              {topic.title}
            </h1>
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 min-h-[120px] shadow-inner">
               {isEditingContent ? (
                 <div>
                   <ReactQuill 
                     theme="snow" 
                     value={editedContent} 
                     onChange={setEditedContent}
                     className="bg-white rounded-xl mb-4"
                   />
                   <div className="flex gap-2">
                     <button onClick={handleSaveContent} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-xs">SAVE</button>
                     <button onClick={() => setIsEditingContent(false)} className="bg-gray-500 text-white px-4 py-2 rounded-lg font-bold text-xs">CANCEL</button>
                   </div>
                 </div>
               ) : topic.content ? (
                 <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed text-sm lg:text-base">
                   {topic.content.split('\n').map((line, i) => (
                     <p key={i} className="mb-3">{line}</p>
                   ))}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full py-4 text-gray-400">
                   <p className="italic">No detailed notes available.</p>
                   <p className="text-xs font-bold mt-1">Use the Gemma AI button to write them instantly!</p>
                 </div>
               )}
            </div>
          </div>
          
          <div className="flex flex-col gap-3 w-full lg:w-72">
            {canManage && (
              <>
                <button 
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white px-6 py-4 rounded-2xl hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all font-black uppercase tracking-widest disabled:opacity-50 text-xs shadow-lg shadow-purple-100"
                >
                  <Sparkles size={20} className={isGenerating ? 'animate-spin' : ''} />
                  {isGenerating ? 'AI IS THINKING...' : 'AI ASSISTANT (PRO)'}
                </button>
                
                <button 
                  onClick={() => setIsEditingContent(true)}
                  className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-2xl hover:border-blue-500 border-2 border-gray-100 transition-all font-bold text-xs mt-2"
                >
                  EDIT CONTENT
                </button>
                
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button 
                    onClick={() => setShowMaterialForm(!showMaterialForm)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl transition-all font-bold text-xs border-2 ${showMaterialForm ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-100 hover:border-blue-200'}`}
                  >
                    <Plus size={16} /> MATERIAL
                  </button>
                  <button 
                    onClick={() => setShowAssignmentForm(!showAssignmentForm)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl transition-all font-bold text-xs border-2 ${showAssignmentForm ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-100 hover:border-purple-200'}`}
                  >
                    <Plus size={16} /> TASK
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Material Form */}
          {showMaterialForm && (
            <div className="p-6 bg-white rounded-3xl border-2 border-blue-100 shadow-xl shadow-blue-50 animate-in slide-in-from-top-4 duration-300">
              <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
                <Plus className="text-blue-600" /> ADD STUDY MATERIAL
              </h3>
              <form onSubmit={handleMaterialUpload} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Material Title</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={materialData.title}
                    onChange={e => setMaterialData({...materialData, title: e.target.value})}
                    placeholder="e.g. Chapter 1 Summary"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Resource Type</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none"
                      value={materialData.file_type}
                      onChange={e => setMaterialData({...materialData, file_type: e.target.value})}
                    >
                      <option value="pdf">File (PDF, DOCX, JSON, CSV)</option>
                      <option value="video">Link / URL</option>
                    </select>
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Source</label>
                     {materialData.file_type === 'pdf' ? (
                        <div 
                          className="mt-1 flex justify-center px-6 pt-4 pb-4 border-2 border-gray-200 border-dashed rounded-xl hover:border-blue-500 transition-colors cursor-pointer bg-gray-50/50"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const files = e.dataTransfer.files;
                            if (files.length > 0) {
                              setMaterialData({...materialData, file: files[0]});
                            }
                          }}
                          onClick={() => document.getElementById('file-upload').click()}
                        >
                          <div className="space-y-1 text-center">
                            <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4H12m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4-4m4-4l6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-xs text-gray-600 justify-center">
                              <label htmlFor="file-upload" className="relative cursor-pointer font-bold text-blue-600 hover:text-blue-500">
                                <span>Select a file</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf,.doc,.docx,.json,.csv" onChange={(e) => setMaterialData({...materialData, file: e.target.files[0]})} />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-[10px] text-gray-500">PDF, DOCX, JSON, CSV</p>
                            {materialData.file && (
                              <p className="text-[10px] text-green-600 font-bold mt-1">
                                Selected: {materialData.file.name}
                              </p>
                            )}
                          </div>
                        </div>
                     ) : (
                        <input 
                          type="url" 
                          placeholder="https://example.com or video link..." 
                          value={materialData.file_url} 
                          onChange={e => setMaterialData({...materialData, file_url: e.target.value})} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none text-xs" 
                          required
                        />
                     )}
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-50">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100">
                    START UPLOAD
                  </button>
                  <button type="button" onClick={() => setShowMaterialForm(false)} className="px-6 py-3 text-gray-400 font-bold text-xs uppercase">
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Materials List */}
          <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <BookOpen size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Study Materials</h2>
            </div>

            <div className="grid gap-4">
              {materials.length === 0 ? (
                <div className="text-center py-16">
                   <div className="text-4xl mb-4">📂</div>
                   <p className="text-gray-400 italic text-sm font-medium">No files or videos found for this topic.</p>
                </div>
              ) : (
                materials.map(material => (
                  <div key={material.id} className="group flex items-center justify-between p-5 rounded-2xl border border-gray-50 bg-gray-50/50 hover:bg-white hover:border-blue-100 hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-50 group-hover:scale-110 transition-transform">
                        {material.file_type === 'video' ? <Video size={20} className="text-red-500" /> : <FileText size={20} className="text-blue-500" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{material.title}</h4>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">Resource Type: {material.file_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                       <button 
                         onClick={() => handleViewMaterial(material.file || material.file_url)} 
                         className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                       >
                          <ExternalLink size={16} />
                       </button>
                       {canManage && (
                         <button 
                           onClick={() => handleDeleteMaterial(material.id)} 
                           className="p-3 bg-white text-red-500 rounded-xl border border-red-50 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                         >
                            <Trash2 size={16} />
                         </button>
                       )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar: Tasks/Assignments */}
        <div className="space-y-6">
          <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                <ClipboardList size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Active Tasks</h2>
            </div>
            
            <div className="space-y-4">
              {assignments.length === 0 ? (
                <div className="text-center py-10 text-gray-300 italic text-xs">No assignments linked.</div>
              ) : (
                assignments.map(item => (
                  <div key={item.id} className="p-5 rounded-2xl bg-gray-50 border border-gray-50 hover:border-purple-100 transition-all">
                    <h4 className="font-bold text-gray-800 text-sm">{item.title}</h4>
                    <div className="mt-3 flex items-center gap-2 text-red-500 font-bold text-[10px] uppercase">
                       <Clock size={12} /> DUE: {new Date(item.deadline).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

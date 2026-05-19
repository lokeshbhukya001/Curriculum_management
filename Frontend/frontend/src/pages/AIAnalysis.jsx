import { useState, useEffect } from 'react'
import { getTopics, runAISequence, runAIGapAnalysis, reorderTopics, generateAIContent } from '../services/api'
import { 
  Wand2, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw,
  LayoutList,
  Sparkles,
  Eye,
  FileText,
  Send
} from 'lucide-react'

export function AIAnalysis() {
  const [topics, setTopics] = useState([])
  const [selectedTopicId, setSelectedTopicId] = useState('all')
  const [customPrompt, setCustomPrompt] = useState('')
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  
  // Results
  const [sequence, setSequence] = useState(null)
  const [gaps, setGaps] = useState(null)
  const [customGenerated, setCustomGenerated] = useState(null)
  const [standardSyllabus, setStandardSyllabus] = useState('')
  const [comparison, setComparison] = useState(null)
  const [comparing, setComparing] = useState(false)
  
  // Visibility States
  const [showAnalysisResults, setShowAnalysisResults] = useState(false)
  const [showCustomResult, setShowCustomResult] = useState(false)
  
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async () => {
    try {
      const res = await getTopics()
      const data = res.data.results || res.data || []
      setTopics(data)
      setLoading(false)
    } catch (err) {
      setError('Failed to load topics')
      setLoading(false)
    }
  }

  const runAnalysis = async () => {
    setAnalyzing(true)
    setError(null)
    setShowAnalysisResults(false) // Hide until user clicks "Show"
    setShowCustomResult(false)
    
    const analysisContext = selectedTopicId === 'all' 
      ? topics 
      : topics.filter(t => t.id === parseInt(selectedTopicId))

    const selectedTopicTitle = selectedTopicId === 'all' ? 'Entire Curriculum' : analysisContext[0]?.title
    const contextName = selectedTopicId === 'all' ? 'Global Curriculum' : `Topic: ${selectedTopicTitle}`

    try {
      // Run the standard analysis and the custom prompt in parallel
      const requests = [
        runAISequence(analysisContext),
        runAIGapAnalysis(analysisContext, contextName)
      ]
      
      if (customPrompt.trim()) {
        requests.push(generateAIContent(selectedTopicTitle, customPrompt))
      }

      const results = await Promise.all(requests)
      
      setSequence(results[0].data)
      setGaps(results[1].data)
      
      if (customPrompt.trim() && results[2]) {
        setCustomGenerated(results[2].data.content)
      } else {
        setCustomGenerated(null)
      }

      setAnalyzing(false)
      // We don't set showAnalysisResults to true here—the user must click the button
    } catch (err) {
      console.error('Full Error Object:', err)
      const serverError = err.response?.data?.error || err.message
      setError(`AI Analysis Error: ${serverError}`)
      setAnalyzing(false)
    }
  }

  const runComparison = async () => {
    if (!standardSyllabus.trim()) {
      alert('Please enter a standard syllabus to compare against.')
      return
    }
    setComparing(true)
    setError(null)
    try {
      const { runAIBenchmark } = await import('../services/api')
      const res = await runAIBenchmark(topics, standardSyllabus)
      setComparison(res.data.comparison)
      setComparing(false)
    } catch (err) {
      console.error('Comparison failed:', err)
      const serverError = err.response?.data?.error || err.message
      setError(`Comparison failed: ${serverError}`)
      setComparing(false)
    }
  }

  const applySequence = async () => {
    if (!sequence) return
    if (window.confirm('Apply this suggested sequence? This will update the order of all topics.')) {
      try {
        const orders = sequence.suggested_sequence.map((topic, index) => ({
          id: topic.id,
          order_number: index
        }))
        await reorderTopics(orders)
        alert('Sequence applied successfully!')
        fetchTopics()
      } catch (err) {
        alert('Failed to apply sequence')
      }
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-400 font-black animate-pulse uppercase tracking-[0.2em]">Initializing AI Neural Engine...</div>
    </div>
  )

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Search and Selection Area */}
      <div className="mb-8 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-8 items-end">
          <div className="flex-1 w-full space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
                <Wand2 size={24} />
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">AI Command Center</h1>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">1. Select Target</label>
                <select 
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-indigo-500 outline-none font-bold text-sm transition-all shadow-inner"
                >
                  <option value="all">Full Curriculum Benchmarking</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>Topic Focus: {t.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">2. Custom AI Instruction (Optional)</label>
                <div className="relative">
                   <input 
                    type="text" 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g. Generate a 1-page material for this..."
                    className="w-full px-5 py-4 pr-12 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-indigo-500 outline-none font-bold text-sm transition-all shadow-inner"
                  />
                  <FileText className="absolute right-4 top-4 text-gray-300" size={20} />
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={runAnalysis}
            disabled={analyzing || topics.length === 0}
            className="w-full lg:w-auto flex items-center justify-center gap-3 bg-indigo-600 text-white px-10 py-5 rounded-2xl hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-indigo-100 font-black text-sm uppercase tracking-widest disabled:opacity-50 h-[60px]"
          >
            {analyzing ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
            {analyzing ? 'Processing...' : 'Execute Analysis'}
          </button>
        </div>
      </div>

      {error && <div className="mb-6 p-5 bg-red-50 text-red-700 rounded-2xl border border-red-100 font-black text-xs uppercase tracking-widest">{error}</div>}

      {/* Delayed Reveal Area */}
      {(sequence || gaps || customGenerated) && !analyzing && (
        <div className="mb-12 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
           <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
           <button 
              onClick={() => {
                setShowAnalysisResults(true)
                setShowCustomResult(true)
              }}
              className="flex items-center gap-3 bg-white text-gray-900 border-2 border-gray-100 px-8 py-4 rounded-full hover:border-indigo-600 hover:text-indigo-600 transition-all font-black uppercase tracking-[0.2em] text-xs shadow-xl group"
           >
              <Eye className="group-hover:scale-125 transition-transform" />
              Show Updated Information
           </button>
        </div>
      )}

      {/* Curriculum Comparison Section */}
      <div className="mb-8 bg-white p-6 lg:p-8 rounded-[2rem] shadow-sm border border-gray-100 mt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <FileText size={24} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Curriculum Comparison</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Standard Syllabus / Framework</label>
            <textarea
              placeholder="Paste the standard syllabus or framework here to compare against..."
              value={standardSyllabus}
              onChange={(e) => setStandardSyllabus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 min-h-[150px]"
            />
          </div>
          
          <button 
            onClick={runComparison}
            disabled={comparing}
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-all font-bold text-sm disabled:opacity-50"
          >
            {comparing ? 'Comparing...' : 'Compare Curriculums'}
          </button>
          
          {comparison && (
            <div className="mt-6 p-6 bg-purple-50 rounded-2xl border border-purple-100">
              <h3 className="text-lg font-bold text-purple-800 mb-4">Comparison Report</h3>
              <div className="space-y-4">
                {comparison.map((item, index) => (
                  <div key={index} className="bg-white p-4 rounded-xl border border-purple-100">
                    <h4 className="font-bold text-gray-800">{item.topic}</h4>
                    <p className="text-sm text-red-600 mt-1"><strong>Gap:</strong> {item.gap}</p>
                    <p className="text-sm text-green-600 mt-1"><strong>Suggestion:</strong> {item.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAnalysisResults && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-700">
          {/* Custom Generated Content Section */}
          {customGenerated && showCustomResult && (
            <div className="lg:col-span-2">
              <section className="bg-gradient-to-br from-indigo-900 to-blue-900 p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                   <Sparkles size={200} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                      <Sparkles size={24} />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">AI Generated Insight</h2>
                  </div>
                  <div className="prose prose-invert max-w-none bg-black/20 p-8 rounded-3xl border border-white/10 backdrop-blur-sm min-h-[200px]">
                     {customGenerated.split('\n').map((line, i) => (
                       <p key={i} className="mb-3 opacity-90 text-sm lg:text-base leading-relaxed">{line}</p>
                     ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Topic Sequencing */}
          <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 min-h-[500px]">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                <LayoutList size={24} />
              </div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Optimal Sequence</h2>
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-blue-50/50 rounded-2xl border-l-8 border-blue-600 mb-8">
                <p className="text-sm text-blue-900 font-bold italic">"{sequence?.explanation}"</p>
              </div>
              
              <div className="space-y-3">
                {sequence?.suggested_sequence.map((topic, index) => (
                  <div key={topic.id} className="flex items-center gap-5 p-5 rounded-3xl border border-gray-50 bg-gray-50/30 hover:bg-white hover:shadow-xl transition-all duration-300">
                    <span className="flex-none w-12 h-12 bg-white text-blue-600 border-2 border-blue-100 rounded-2xl flex items-center justify-center font-black text-base shadow-sm">
                      {index + 1}
                    </span>
                    <span className="font-black text-gray-800 text-sm">{topic.title}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={applySequence}
                className="mt-10 w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95 text-xs"
              >
                Confirm & Update Database
              </button>
            </div>
          </section>

          {/* Gap Analysis */}
          <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 min-h-[500px]">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Intelligence Gaps</h2>
            </div>

            {gaps?.gaps_identified.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 text-green-500">
                <CheckCircle2 size={64} className="mb-4" />
                <p className="font-black uppercase tracking-widest text-sm">Perfect Syllabus!</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-6 bg-orange-50 rounded-2xl border-l-8 border-orange-500 mb-8">
                  <p className="text-xs text-orange-900 font-black uppercase tracking-widest">{gaps?.summary}</p>
                </div>

                {gaps?.gaps_identified.map((gap, index) => (
                  <div key={index} className="p-6 rounded-[2rem] border border-orange-100 bg-white shadow-sm hover:shadow-2xl transition-all">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-orange-500 text-white rounded-xl">
                        <ArrowRight size={18} />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-800 mb-2 uppercase text-xs tracking-tight">{gap.topic}</h4>
                        <p className="text-xs text-gray-500 font-bold leading-relaxed">{gap.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Empty State */}
      {!analyzing && !sequence && !gaps && (
        <div className="mt-20 flex flex-col items-center justify-center text-gray-300">
           <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Sparkles size={48} className="opacity-20" />
           </div>
           <p className="font-black uppercase tracking-[0.3em] text-xs">Awaiting Instructions</p>
        </div>
      )}
    </div>
  )
}

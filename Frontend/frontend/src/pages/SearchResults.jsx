import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { searchCurriculum } from '../services/api'

export function SearchResults() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')
  const [results, setResults] = useState({ programs: [], courses: [], modules: [], topics: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (query) {
      handleSearch()
    }
  }, [query])

  const handleSearch = async () => {
    setLoading(true)
    try {
      const response = await searchCurriculum(query)
      setResults(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Search error:', err)
      setError('Failed to perform search')
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-xl animate-pulse">Searching the curriculum...</div>

  const totalResults = results.programs.length + results.courses.length + results.modules.length + results.topics.length

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Search Results for "{query}"
        </h1>
        <p className="text-gray-500 mt-2">Found {totalResults} matches across all sections.</p>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-700 rounded-xl mb-6">{error}</div>}

      <div className="space-y-12">
        {/* Programs */}
        {results.programs.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">Programs</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.programs.map(item => (
                <Link to="/programs" key={item.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100">
                  <h3 className="font-bold text-gray-800">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Courses */}
        {results.courses.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">Courses</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.courses.map(item => (
                <Link to="/courses" key={item.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100">
                  <h3 className="font-bold text-gray-800">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Modules */}
        {results.modules.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">Modules</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.modules.map(item => (
                <Link to="/modules" key={item.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100">
                  <h3 className="font-bold text-gray-800">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-2 italic">Part of Course ID: {item.course}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Topics */}
        {results.topics.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">Topics</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.topics.map(item => (
                <Link to="/topics" key={item.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100">
                  <h3 className="font-bold text-gray-800">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.content}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {totalResults === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-800">No matches found</h3>
            <p className="text-gray-500 mt-2">Try searching for something else or check your spelling.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import axios from 'axios'

let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Auto-correct if VITE_API_URL was set without the '/api' suffix
if (API_BASE_URL && !API_BASE_URL.endsWith('/api') && !API_BASE_URL.endsWith('/api/')) {
  const cleanedUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
  API_BASE_URL = `${cleanedUrl}/api`
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add a request interceptor to add the JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Do not try to refresh if the failed request was a login or refresh attempt
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
        return Promise.reject(error);
      }
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) throw new Error('No refresh token')
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        })
        const { access } = response.data
        localStorage.setItem('access_token', access)
        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshError) {
        // Redirect to login or logout user
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

// ============ Auth APIs ============
export const login = (credentials) => api.post('/auth/login/', credentials)
export const register = (userData) => api.post('/auth/register/', userData)
export const logoutUser = () => api.post('/auth/logout/', { refresh: localStorage.getItem('refresh_token') })
export const forgotPassword = (email) => api.post('/auth/password-reset/', { email })
export const resetPassword = (data) => api.post('/auth/password-reset-confirm/', data)

// ============ Curriculum APIs ============
export const getPrograms = () => api.get('/curriculum/programs/')
export const createProgram = (data) => api.post('/curriculum/programs/', data)
export const updateProgram = (id, data) => api.put(`/curriculum/programs/${id}/`, data)
export const deleteProgram = (id) => api.delete(`/curriculum/programs/${id}/`)

export const getCourses = () => api.get('/curriculum/courses/')
export const createCourse = (data) => api.post('/curriculum/courses/', data)
export const updateCourse = (id, data) => api.put(`/curriculum/courses/${id}/`, data)
export const deleteCourse = (id) => api.delete(`/curriculum/courses/${id}/`)

export const getModules = () => api.get('/curriculum/modules/')
export const createModule = (data) => api.post('/curriculum/modules/', data)
export const updateModule = (id, data) => api.put(`/curriculum/modules/${id}/`, data)
export const deleteModule = (id) => api.delete(`/curriculum/modules/${id}/`)
export const reorderModules = (orders) => api.post('/curriculum/modules/reorder/', { orders })

export const getTopics = () => api.get('/curriculum/topics/')
export const getTopicDetail = (id) => api.get(`/curriculum/topics/${id}/`)
export const createTopic = (data) => api.post('/curriculum/topics/', data)
export const updateTopic = (id, data) => api.patch(`/curriculum/topics/${id}/`, data)
export const deleteTopic = (id) => api.delete(`/curriculum/topics/${id}/`)
export const reorderTopics = (orders) => api.post('/curriculum/topics/reorder/', { orders })

// Materials
export const uploadMaterial = (data) => api.post('/curriculum/materials/', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const deleteMaterial = (id) => api.delete(`/curriculum/materials/${id}/`)

// ============ Assignments APIs ============
export const getAssignments = () => api.get('/assignments/assignments/')
export const getAssignmentsByTopic = (topicId) => api.get(`/assignments/assignments/?topic=${topicId}`)
export const createAssignment = (data) => api.post('/assignments/assignments/', data)
export const submitAssignment = (data) => api.post('/assignments/submissions/', data)

// ============ Schedules APIs ============
export const getSchedules = () => api.get('/schedules/')
export const createSchedule = (data) => api.post('/schedules/', data)

// ============ Analytics APIs ============
export const getStats = () => api.get('/analytics/stats/')

// ============ Search APIs ============
export const searchCurriculum = (query) => api.get(`/search/?q=${query}`)

// ============ AI Engine ============
export const runAISequence = (topics) => api.post('/ai/sequence/', { topics })
export const runAIGapAnalysis = (topics) => api.post('/ai/gap-analysis/', { topics })
export const generateAIContent = (topic_title, custom_prompt = '') => api.post('/ai/generate/', { topic_title, custom_prompt })
export const runAIBenchmark = (topics, standard_syllabus) => api.post('/ai/benchmark/', { topics, standard_syllabus })

export { api }
export default api

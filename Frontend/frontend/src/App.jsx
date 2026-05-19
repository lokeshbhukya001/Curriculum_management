import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import { ProtectedRoute } from './components/ProtectedRoute'

// Lazy load pages to improve initial load performance
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })))
const Programs = lazy(() => import('./pages/Programs').then(module => ({ default: module.Programs })))
const Courses = lazy(() => import('./pages/Courses').then(module => ({ default: module.Courses })))
const Modules = lazy(() => import('./pages/Modules').then(module => ({ default: module.Modules })))
const Topics = lazy(() => import('./pages/Topics').then(module => ({ default: module.Topics })))
const TopicDetail = lazy(() => import('./pages/TopicDetail').then(module => ({ default: module.TopicDetail })))
const Schedule = lazy(() => import('./pages/Schedule').then(module => ({ default: module.Schedule })))
const AIAnalysis = lazy(() => import('./pages/AIAnalysis').then(module => ({ default: module.AIAnalysis })))
const AuditLogs = lazy(() => import('./pages/AuditLogs').then(module => ({ default: module.AuditLogs })))
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })))
const SearchResults = lazy(() => import('./pages/SearchResults').then(module => ({ default: module.SearchResults })))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })))
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword })))

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-xl font-semibold text-indigo-600 animate-pulse">Loading...</div>
  </div>
)

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="flex bg-gray-100 min-h-screen">
                  <Sidebar />
                  <div className="flex-1">
                    <Navbar />
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/programs" element={<Programs />} />
                        <Route path="/courses" element={<Courses />} />
                        <Route path="/modules" element={<Modules />} />
                        <Route path="/topics" element={<Topics />} />
                        <Route path="/topics/:id" element={<TopicDetail />} />
                        <Route path="/schedule" element={<Schedule />} />
                        <Route path="/ai-analysis" element={<AIAnalysis />} />
                        <Route path="/audit-logs" element={<AuditLogs />} />
                        <Route path="/search" element={<SearchResults />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Suspense>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
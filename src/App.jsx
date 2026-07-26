import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import { SavedCoursesProvider } from '@/context/SavedCoursesContext';
import { AdminProvider } from '@/context/AdminContext';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Loader2 } from 'lucide-react';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('@/pages/HomePage'));
const BlogPage = lazy(() => import('@/pages/BlogPage'));
const BlogPostDetail = lazy(() => import('@/pages/BlogPostDetail'));
const CoursesPage = lazy(() => import('@/pages/CoursesPage'));
const CourseDetail = lazy(() => import('@/pages/CourseDetail'));
const SavedCoursesPage = lazy(() => import('@/pages/SavedCoursesPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const AdminLoginPage = lazy(() => import('@/pages/AdminLoginPage'));
const JobsPage = lazy(() => import('@/pages/JobsPage'));
const JobDetailPage = lazy(() => import('@/pages/JobDetailPage'));

// Baba Glass House ERP — self-contained sub-application mounted at /baba
const BabaApp = lazy(() => import('@/baba/BabaApp'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
  </div>
);

// The main marketing site (navigation + footer chrome around its routes).
function SiteLayout() {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navigation />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          {/* Legacy Services URLs (redirect to courses) */}
          <Route path="/services" element={<Navigate to="/courses" replace />} />
          <Route path="/services/:id" element={<Navigate to="/courses" replace />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostDetail />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/saved-courses" element={<SavedCoursesPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
      <Footer />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminProvider>
          <SavedCoursesProvider>
            <Routes>
              {/* Baba Glass House ERP renders full-screen without the site chrome */}
              <Route
                path="/baba/*"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <BabaApp />
                  </Suspense>
                }
              />
              <Route path="/*" element={<SiteLayout />} />
            </Routes>
          </SavedCoursesProvider>
        </AdminProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

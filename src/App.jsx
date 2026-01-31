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

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminProvider>
          <SavedCoursesProvider>
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
                  <Route path="/blog/:id" element={<BlogPostDetail />} />
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
          </SavedCoursesProvider>
        </AdminProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
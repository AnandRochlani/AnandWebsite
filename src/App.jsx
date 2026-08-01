import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import { SavedCoursesProvider } from '@/context/SavedCoursesContext';
import { AdminProvider } from '@/context/AdminContext';
import { AuthProvider } from '@/context/AuthContext';
import { SiteSettingsProvider } from '@/context/SiteSettingsContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Loader2 } from 'lucide-react';
import { SpeedInsights } from '@vercel/speed-insights/react';

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
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const SystemDesignCaseStudiesPage = lazy(() => import('@/pages/SystemDesignCaseStudiesPage'));
const SystemDesignGlossaryPage = lazy(() => import('@/pages/SystemDesignGlossaryPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-white flex items-center justify-center" role="status" aria-label="Loading page">
    <Loader2 className="w-10 h-10 text-brand animate-spin" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminProvider>
          <SiteSettingsProvider>
            <SavedCoursesProvider>
              <div className="min-h-screen bg-white">
                <Navigation />
                <main id="main-content" tabIndex="-1" className="outline-none">
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/courses" element={<CoursesPage />} />
                      <Route path="/courses/:slugOrId" element={<CourseDetail />} />
                      {/* Legacy Services URLs (redirect to courses) */}
                      <Route path="/services" element={<Navigate to="/courses" replace />} />
                      <Route path="/services/:id" element={<Navigate to="/courses" replace />} />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/blog/:slug" element={<BlogPostDetail />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/system-design-case-studies" element={<SystemDesignCaseStudiesPage />} />
                      <Route path="/system-design-glossary" element={<SystemDesignGlossaryPage />} />
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
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
                <Toaster />
                <SpeedInsights />
              </div>
            </SavedCoursesProvider>
          </SiteSettingsProvider>
        </AdminProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

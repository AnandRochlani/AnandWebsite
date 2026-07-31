import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Code2, Heart, Shield, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSavedCourses } from '@/context/SavedCoursesContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { savedCourseIds } = useSavedCourses();
  const { isAuthenticated, logout } = useAuth();
  const { toast } = useToast();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'Tutorials', path: '/blog' },
    { name: 'About', path: '/about' },
    { name: 'Jobs', path: '/jobs' },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      // Use replace to avoid adding to history stack (reduces redirect overhead)
      navigate('/admin/login', { replace: true });
      setMobileMenuOpen(false);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    }
  };

  return (
    <>
    <a
      href="#main-content"
      className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0"
    >
      Skip to main content
    </a>
    <nav aria-label="Primary navigation" className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-[0_1px_12px_rgba(15,23,42,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[4.5rem]">
          {/* Logo */}
          <Link to="/" aria-label="AnandRochlani home" className="flex min-h-11 items-center space-x-2.5 group rounded-lg">
            <div className="bg-brand p-2 rounded-lg group-hover:bg-brand-dark transition-colors duration-300">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              AnandRochlani
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                aria-current={isActive(link.path) ? 'page' : undefined}
                className={`relative inline-flex min-h-11 items-center text-sm font-semibold transition-colors duration-300 ${
                  isActive(link.path)
                    ? 'text-brand'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-[0.875rem] left-0 right-0 h-0.5 bg-brand"
                  />
                )}
              </Link>
            ))}
            
            {/* Saved Items Link */}
            <Link
              to="/saved-courses"
              aria-current={isActive('/saved-courses') ? 'page' : undefined}
              className={`relative flex min-h-11 items-center space-x-1.5 text-sm font-semibold transition-colors duration-300 ${
                isActive('/saved-courses')
                  ? 'text-brand'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Saved</span>
              {savedCourseIds.length > 0 && (
                <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-brand rounded-full">
                  {savedCourseIds.length}
                </span>
              )}
              {isActive('/saved-courses') && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-[0.875rem] left-0 right-0 h-0.5 bg-brand"
                  />
              )}
            </Link>

            {/* Primary CTA — Udemy course */}
            <a
              href="https://www.udemy.com/course/system-design-fundamental/?referralCode=4D123B9F202E6D906A73"
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="inline-flex min-h-11 items-center bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors duration-300"
            >
              System Design Course
            </a>

            {/* Admin Section */}
            {isAuthenticated && (
              <div className="flex items-center space-x-4">
                <Link
                  to="/admin"
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive('/admin')
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                      : 'text-blue-400 hover:bg-blue-600/10 border border-transparent hover:border-blue-500/30'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors duration-300"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-slate-900" />
            ) : (
              <Menu className="w-6 h-6 text-slate-900" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white border-t border-slate-200 shadow-xl"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive(link.path) ? 'page' : undefined}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive(link.path)
                      ? 'bg-brand-soft text-brand'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              <Link
                to="/saved-courses"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isActive('/saved-courses')
                    ? 'bg-brand-soft text-brand'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-2" />
                Saved courses
                </div>
                {savedCourseIds.length > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-brand rounded-full">
                    {savedCourseIds.length}
                  </span>
                )}
              </Link>

              <a
                href="https://www.udemy.com/course/system-design-fundamental/?referralCode=4D123B9F202E6D906A73"
                target="_blank"
                rel="sponsored noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="block min-h-11 text-center bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-3 rounded-lg transition-colors duration-300"
              >
                Explore the System Design Course
              </a>

              {/* Mobile Admin Section */}
              <div className="pt-2 border-t border-slate-200 mt-2">
                {isAuthenticated && (
                  <>
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                        isActive('/admin')
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'text-blue-400 hover:bg-blue-600/10'
                      }`}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-300"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </>
  );
};

export default Navigation;

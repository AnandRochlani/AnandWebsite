import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, FileText, Plus, Trash2, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAdmin } from '@/context/AdminContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';

const AdminPage = () => {
  const { addCourse, addBlogPost } = useAdmin();
  const { logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('course');

  // Course Form State
  const initialCourseState = {
    name: '',
    description: '',
    instructor: '',
    duration: '',
    level: 'Beginner',
    price: '',
    rating: '',
    studentsEnrolled: '',
    category: 'Web Development',
    modules: [{ title: '', lessons: '', duration: '' }]
  };
  const [courseForm, setCourseForm] = useState(initialCourseState);

  // Blog Post Form State
  const initialBlogState = {
    title: '',
    description: '',
    content: '',
    author: '',
    date: '',
    category: 'Web Development'
  };
  const [blogForm, setBlogForm] = useState(initialBlogState);

  // Errors State
  const [errors, setErrors] = useState({});

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      // Use replace to avoid adding to history stack (reduces redirect overhead)
      navigate('/admin/login', { replace: true });
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    }
  };

  const validateCourse = () => {
    const newErrors = {};
    if (!courseForm.name) newErrors.name = 'Title is required';
    if (!courseForm.description) newErrors.description = 'Description is required';
    if (!courseForm.instructor) newErrors.instructor = 'Instructor is required';
    if (!courseForm.duration) newErrors.duration = 'Duration is required';
    if (!courseForm.price) newErrors.price = 'Price is required';
    
    if (!courseForm.rating) newErrors.rating = 'Rating is required';
    else if (isNaN(courseForm.rating) || Number(courseForm.rating) < 1 || Number(courseForm.rating) > 5) {
      newErrors.rating = 'Rating must be a number between 1 and 5';
    }

    if (!courseForm.studentsEnrolled) newErrors.studentsEnrolled = 'Student count is required';
    else if (isNaN(courseForm.studentsEnrolled)) {
      newErrors.studentsEnrolled = 'Student count must be a number';
    }

    return newErrors;
  };

  const validateBlog = () => {
    const newErrors = {};
    if (!blogForm.title) newErrors.title = 'Title is required';
    if (!blogForm.description) newErrors.description = 'Description is required';
    if (!blogForm.content) newErrors.content = 'Content is required';
    if (!blogForm.author) newErrors.author = 'Author is required';
    if (!blogForm.date) newErrors.date = 'Date is required';
    return newErrors;
  };

  const handleCourseSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateCourse();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const formattedCourse = {
      ...courseForm,
      studentsEnrolled: parseInt(courseForm.studentsEnrolled),
      rating: parseFloat(courseForm.rating)
    };

    const result = addCourse(formattedCourse);
    if (result.success) {
      toast({
        title: "Success!",
        description: "Course added successfully",
        className: "bg-green-600 border-green-700 text-white"
      });
      setCourseForm(initialCourseState);
      setErrors({});
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  const handleBlogSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateBlog();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const result = addBlogPost(blogForm);
    if (result.success) {
      toast({
        title: "Success!",
        description: "Blog post added successfully",
        className: "bg-green-600 border-green-700 text-white"
      });
      setBlogForm(initialBlogState);
      setErrors({});
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  const handleModuleChange = (index, field, value) => {
    const newModules = [...courseForm.modules];
    newModules[index][field] = value;
    setCourseForm({ ...courseForm, modules: newModules });
  };

  const addModule = () => {
    setCourseForm({
      ...courseForm,
      modules: [...courseForm.modules, { title: '', lessons: '', duration: '' }]
    });
  };

  const removeModule = (index) => {
    const newModules = courseForm.modules.filter((_, i) => i !== index);
    setCourseForm({ ...courseForm, modules: newModules });
  };

  return (
    <>
      <SEOHead 
        title="Admin Dashboard"
        description="Manage your website content with the admin dashboard. Add new courses and blog posts, update existing content, and control your website from one central location."
        canonical="https://www.anandrochlani.com/admin"
        keywords="admin dashboard, content management, add courses, add blog posts, website management"
      />

      <div className="min-h-screen bg-slate-900 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex justify-between items-center"
          >
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">Manage your courses and blog posts</p>
            </div>
            
            <Button 
              onClick={handleLogout}
              variant="destructive"
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </motion.div>

          {/* Tabs */}
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setActiveTab('course')}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'course'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Add Course
            </button>
            <button
              onClick={() => setActiveTab('blog')}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'blog'
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <FileText className="w-5 h-5 mr-2" />
              Add Blog Post
            </button>
          </div>

          {/* Forms Area */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <AnimatePresence mode="wait">
              {activeTab === 'course' ? (
                <motion.form
                  key="course-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleCourseSubmit}
                  className="space-y-6"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Course Title</label>
                      <input
                        type="text"
                        value={courseForm.name}
                        onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        placeholder="e.g. Advanced React Patterns"
                      />
                      {errors.name && <span className="text-red-400 text-sm flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.name}</span>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Instructor</label>
                      <input
                        type="text"
                        value={courseForm.instructor}
                        onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        placeholder="Instructor Name"
                      />
                      {errors.instructor && <span className="text-red-400 text-sm flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.instructor}</span>}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-medium text-gray-300">Description</label>
                      <textarea
                        value={courseForm.description}
                        onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none h-24"
                        placeholder="Brief description of the course..."
                      />
                      {errors.description && <span className="text-red-400 text-sm flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.description}</span>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Level</label>
                      <select
                        value={courseForm.level}
                        onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Category</label>
                      <select
                        value={courseForm.category}
                        onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      >
                        <option value="Web Development">Web Development</option>
                        <option value="Design">Design</option>
                        <option value="Data Science">Data Science</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Duration (e.g. "40 hours")</label>
                      <input
                        type="text"
                        value={courseForm.duration}
                        onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                      {errors.duration && <span className="text-red-400 text-sm flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.duration}</span>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Price</label>
                      <input
                        type="text"
                        value={courseForm.price}
                        onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        placeholder="$99"
                      />
                      {errors.price && <span className="text-red-400 text-sm flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.price}</span>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Rating (1-5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={courseForm.rating}
                        onChange={(e) => setCourseForm({ ...courseForm, rating: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                      {errors.rating && <span className="text-red-400 text-sm flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.rating}</span>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Student Count</label>
                      <input
                        type="number"
                        value={courseForm.studentsEnrolled}
                        onChange={(e) => setCourseForm({ ...courseForm, studentsEnrolled: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                      {errors.studentsEnrolled && <span className="text-red-400 text-sm flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.studentsEnrolled}</span>}
                    </div>
                  </div>

                  {/* Modules Section */}
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-white">Course Modules</h3>
                      <Button
                        type="button"
                        onClick={addModule}
                        variant="outline"
                        size="sm"
                        className="text-purple-400 border-purple-400/50 hover:bg-purple-500/10"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Module
                      </Button>
                    </div>

                    {courseForm.modules.map((module, index) => (
                      <div key={index} className="flex gap-4 items-start bg-black/20 p-4 rounded-lg">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            placeholder="Module Title"
                            value={module.title}
                            onChange={(e) => handleModuleChange(index, 'title', e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-black/20 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Lessons (e.g. 8)"
                              value={module.lessons}
                              onChange={(e) => handleModuleChange(index, 'lessons', e.target.value)}
                              className="w-1/2 px-3 py-1.5 rounded bg-black/20 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                            />
                            <input
                              type="text"
                              placeholder="Duration (e.g. 2h)"
                              value={module.duration}
                              onChange={(e) => handleModuleChange(index, 'duration', e.target.value)}
                              className="w-1/2 px-3 py-1.5 rounded bg-black/20 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeModule(index)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                      Create Course
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setCourseForm(initialCourseState)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Reset
                    </Button>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="blog-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleBlogSubmit}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Blog Title</label>
                    <input
                      type="text"
                      value={blogForm.title}
                      onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    />
                    {errors.title && <span className="text-red-400 text-sm flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.title}</span>}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Author</label>
                      <input
                        type="text"
                        value={blogForm.author}
                        onChange={(e) => setBlogForm({ ...blogForm, author: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
                      />
                      {errors.author && <span className="text-red-400 text-sm flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.author}</span>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Publish Date</label>
                      <input
                        type="date"
                        value={blogForm.date}
                        onChange={(e) => setBlogForm({ ...blogForm, date: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
                      />
                      {errors.date && <span className="text-red-400 text-sm flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.date}</span>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Category</label>
                    <select
                      value={blogForm.category}
                      onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    >
                      <option value="Web Development">Web Development</option>
                      <option value="Design">Design</option>
                      <option value="Data Science">Data Science</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Description</label>
                    <textarea
                      value={blogForm.description}
                      onChange={(e) => setBlogForm({ ...blogForm, description: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none h-24"
                      placeholder="Short summary for the card view..."
                    />
                    {errors.description && <span className="text-red-400 text-sm flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.description}</span>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Content (HTML supported)</label>
                    <textarea
                      value={blogForm.content}
                      onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none h-64 font-mono text-sm"
                      placeholder="<h2>Subtitle</h2><p>Your content here...</p>"
                    />
                    {errors.content && <span className="text-red-400 text-sm flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.content}</span>}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white">
                      Publish Post
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setBlogForm(initialBlogState)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Reset
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPage;
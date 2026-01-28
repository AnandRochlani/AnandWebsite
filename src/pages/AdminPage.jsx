import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, FileText, Plus, Trash2, CheckCircle, AlertCircle, LogOut, ArrowUp, ArrowDown, GripVertical, Save, Pencil, Settings, Image as ImageIcon, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAdmin } from '@/context/AdminContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { getAllBlogPosts } from '@/data/blogPosts';
import { getAllCourses } from '@/data/courses';
import { getAllServices } from '@/data/services';

const AdminPage = () => {
  const { 
    addCourse, 
    addBlogPost, 
    updateCourse, 
    deleteCourse, 
    updateBlogPost, 
    deleteBlogPost, 
    updateBlogOrder,
    addService,
    updateService,
    deleteService,
    updateSchemaData,
    getSchemaData,
    updateImageAltTags,
    getImageAltTags,
    getAllImages,
    addImage
  } = useAdmin();
  const { logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('course');

  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editingBlogId, setEditingBlogId] = useState(null);
  
  // Get all System Design blogs for ordering
  const systemDesignBlogs = useMemo(() => {
    const allPosts = getAllBlogPosts();
    return allPosts
      .filter(post => post.category === 'System Design' && post.series && post.order !== undefined)
      .sort((a, b) => (a.order || 999) - (b.order || 999));
  }, []);

  const allCourses = useMemo(() => getAllCourses(), []);
  const allPosts = useMemo(() => getAllBlogPosts(), []);
  const allServices = useMemo(() => getAllServices(), []);
  
  const [blogOrderList, setBlogOrderList] = useState([]);
  
  useEffect(() => {
    setBlogOrderList(systemDesignBlogs.map(post => ({ id: post.id, title: post.title, order: post.order || 999 })));
  }, [systemDesignBlogs]);

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

  // Service Form State
  const initialServiceState = {
    name: '',
    description: '',
    category: 'Graphic Design',
    featuredImage: '',
    features: [''],
    addOns: [{ name: '', price: '' }],
    membershipPrice: '',
    generalPrice: ''
  };
  const [serviceForm, setServiceForm] = useState(initialServiceState);
  const [editingServiceId, setEditingServiceId] = useState(null);

  // Schema Form State
  const [schemaForm, setSchemaForm] = useState({
    ratingValue: 4.5,
    bestRating: 5,
    worstRating: 1,
    ratingCount: 100,
    reviewCount: 85
  });

  // Image Alt Tags State
  const [imageAltTags, setImageAltTags] = useState({});
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');

  // Errors State
  const [errors, setErrors] = useState({});

  // Load schema data and image alt tags on mount
  useEffect(() => {
    try {
      const schemaData = getSchemaData();
      if (schemaData && Object.keys(schemaData).length > 0) {
        setSchemaForm({
          ratingValue: schemaData.ratingValue || 4.5,
          bestRating: schemaData.bestRating || 5,
          worstRating: schemaData.worstRating || 1,
          ratingCount: schemaData.ratingCount || 100,
          reviewCount: schemaData.reviewCount || 85
        });
      }

      const altTags = getImageAltTags();
      if (altTags && Object.keys(altTags).length > 0) {
        setImageAltTags(altTags);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  }, [getSchemaData, getImageAltTags]);

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
      rating: parseFloat(courseForm.rating),
      modules: (courseForm.modules || []).map((m, idx) => ({
        id: m.id ?? (idx + 1),
        title: m.title,
        lessons: isNaN(Number(m.lessons)) ? m.lessons : parseInt(m.lessons),
        duration: m.duration
      }))
    };

    const result = editingCourseId ? updateCourse(editingCourseId, formattedCourse) : addCourse(formattedCourse);
    if (result.success) {
      toast({
        title: "Success!",
        description: editingCourseId ? "Course updated successfully" : "Course added successfully",
        className: "bg-green-600 border-green-700 text-white"
      });
      setCourseForm(initialCourseState);
      setEditingCourseId(null);
      setErrors({});
      setTimeout(() => window.location.reload(), 800);
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

    const result = editingBlogId ? updateBlogPost(editingBlogId, blogForm) : addBlogPost(blogForm);
    if (result.success) {
      toast({
        title: "Success!",
        description: editingBlogId ? "Blog post updated successfully" : "Blog post added successfully",
        className: "bg-green-600 border-green-700 text-white"
      });
      setBlogForm(initialBlogState);
      setEditingBlogId(null);
      setErrors({});
      setTimeout(() => window.location.reload(), 800);
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

  const startEditCourse = (course) => {
    setActiveTab('course');
    setEditingBlogId(null);
    setEditingCourseId(course.id);

    setCourseForm({
      name: course.name || '',
      description: course.description || '',
      instructor: course.instructor || '',
      duration: course.duration || '',
      level: course.level || 'Beginner',
      price: course.price || '',
      rating: course.rating ?? '',
      studentsEnrolled: course.studentsEnrolled ?? '',
      category: course.category || 'Web Development',
      modules: (course.modules || []).map((m) => ({
        id: m.id,
        title: m.title ?? '',
        lessons: m.lessons ?? '',
        duration: m.duration ?? ''
      }))
    });
    setErrors({});
  };

  const startEditBlog = (post) => {
    setActiveTab('blog');
    setEditingCourseId(null);
    setEditingBlogId(post.id);

    setBlogForm({
      title: post.title || '',
      description: post.description || '',
      content: post.content || '',
      author: post.author || '',
      date: post.date || '',
      category: post.category || 'Web Development'
    });
    setErrors({});
  };

  const handleDeleteCourse = (course) => {
    if (!window.confirm(`Delete course: "${course.name}"?`)) return;
    const result = deleteCourse(course.id);
    if (result.success) {
      toast({ title: "Deleted", description: "Course deleted successfully" });
      setTimeout(() => window.location.reload(), 600);
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleDeleteBlog = (post) => {
    if (!window.confirm(`Delete blog post: "${post.title}"?`)) return;
    const result = deleteBlogPost(post.id);
    if (result.success) {
      toast({ title: "Deleted", description: "Blog post deleted successfully" });
      setTimeout(() => window.location.reload(), 600);
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  // Blog Order Management Functions
  const moveBlogUp = (index) => {
    if (index === 0) return;
    const newOrder = [...blogOrderList];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    // Update order numbers
    newOrder.forEach((item, idx) => {
      item.order = idx + 1;
    });
    setBlogOrderList(newOrder);
  };

  const moveBlogDown = (index) => {
    if (index === blogOrderList.length - 1) return;
    const newOrder = [...blogOrderList];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    // Update order numbers
    newOrder.forEach((item, idx) => {
      item.order = idx + 1;
    });
    setBlogOrderList(newOrder);
  };

  const handleSaveBlogOrder = () => {
    const result = updateBlogOrder(blogOrderList);
    if (result.success) {
      toast({
        title: "Success!",
        description: "Blog order updated successfully. Please refresh the page to see changes.",
        className: "bg-green-600 border-green-700 text-white"
      });
      // Reload page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  // Service handlers
  const handleServiceSubmit = (e) => {
    e.preventDefault();
    const formattedService = {
      ...serviceForm,
      addOns: serviceForm.addOns
        .filter(addOn => addOn.name && addOn.price)
        .map((addOn, idx) => ({
          id: idx + 1,
          name: addOn.name,
          price: parseFloat(addOn.price) || 0
        })),
      features: serviceForm.features.filter(f => f.trim() !== ''),
      membershipPrice: serviceForm.membershipPrice ? parseFloat(serviceForm.membershipPrice) : null,
      generalPrice: serviceForm.generalPrice ? parseFloat(serviceForm.generalPrice) : null
    };

    const result = editingServiceId ? updateService(editingServiceId, formattedService) : addService(formattedService);
    if (result.success) {
      toast({
        title: "Success!",
        description: editingServiceId ? "Service updated successfully" : "Service added successfully",
        className: "bg-green-600 border-green-700 text-white"
      });
      setServiceForm(initialServiceState);
      setEditingServiceId(null);
      setTimeout(() => window.location.reload(), 800);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  const handleSchemaSubmit = (e) => {
    e.preventDefault();
    const result = updateSchemaData(schemaForm);
    if (result.success) {
      toast({
        title: "Success!",
        description: "Schema data updated successfully",
        className: "bg-green-600 border-green-700 text-white"
      });
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  const handleImageAltSubmit = (e) => {
    e.preventDefault();
    const result = updateImageAltTags(imageAltTags);
    if (result.success) {
      toast({
        title: "Success!",
        description: "Image alt tags updated successfully",
        className: "bg-green-600 border-green-700 text-white"
      });
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) {
      toast({
        title: "Error",
        description: "Image URL is required",
        variant: "destructive"
      });
      return;
    }
    addImage(newImageUrl, newImageAlt);
    setImageAltTags({ ...imageAltTags, [newImageUrl]: newImageAlt });
    setNewImageUrl('');
    setNewImageAlt('');
    toast({
      title: "Success!",
      description: "Image added successfully",
      className: "bg-green-600 border-green-700 text-white"
    });
  };

  return (
    <>
      <SEOHead 
        title="Admin Dashboard"
        description="Manage your website content with the admin dashboard. Add new services, blog posts, manage schema data, and image alt tags from one central location."
        canonical="https://www.ritvikwebsite.com/admin"
        keywords="admin dashboard, content management, add services, add blog posts, schema management, image alt tags, website management"
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
              <p className="text-gray-400">Manage services, blog posts, schema data, and images</p>
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
            <button
              onClick={() => setActiveTab('order')}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'order'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <GripVertical className="w-5 h-5 mr-2" />
              Manage Blog Order
            </button>
            <button
              onClick={() => setActiveTab('service')}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'service'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-500/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Settings className="w-5 h-5 mr-2" />
              Services
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'schema'
                  ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-500/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Star className="w-5 h-5 mr-2" />
              Schema
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'images'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <ImageIcon className="w-5 h-5 mr-2" />
              Images
            </button>
          </div>

          {/* Forms Area */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <AnimatePresence mode="wait">
              {activeTab === 'course' && (
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
                        <option value="System Design">System Design</option>
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
                      {editingCourseId ? 'Update Course' : 'Create Course'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setCourseForm(initialCourseState);
                        setEditingCourseId(null);
                      }}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      {editingCourseId ? 'Cancel Edit' : 'Reset'}
                    </Button>
                  </div>
                </motion.form>
              )}
              {activeTab === 'course' && (
                <motion.div
                  key="course-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-10 pt-8 border-t border-white/10"
                >
                  <h3 className="text-xl font-bold text-white mb-4">All Courses</h3>
                  <div className="space-y-3">
                    {allCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between gap-4 p-4 rounded-lg bg-black/20 border border-white/10"
                      >
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{course.name}</p>
                          <p className="text-xs text-gray-400">{course.category} • {course.level}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditCourse(course)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
                            title="Edit course"
                          >
                            <Pencil className="w-4 h-4 text-gray-200" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(course)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
                            title="Delete course"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              {activeTab === 'blog' && (
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
                      <option value="System Design">System Design</option>
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
                      {editingBlogId ? 'Update Post' : 'Publish Post'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setBlogForm(initialBlogState);
                        setEditingBlogId(null);
                      }}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      {editingBlogId ? 'Cancel Edit' : 'Reset'}
                    </Button>
                  </div>
                </motion.form>
              )}
              {activeTab === 'blog' && (
                <motion.div
                  key="blog-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-10 pt-8 border-t border-white/10"
                >
                  <h3 className="text-xl font-bold text-white mb-4">All Blog Posts</h3>
                  <div className="space-y-3">
                    {allPosts
                      .slice()
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((post) => (
                        <div
                          key={post.id}
                          className="flex items-center justify-between gap-4 p-4 rounded-lg bg-black/20 border border-white/10"
                        >
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">{post.title}</p>
                            <p className="text-xs text-gray-400">{post.category} • {post.date}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => startEditBlog(post)}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
                              title="Edit post"
                            >
                              <Pencil className="w-4 h-4 text-gray-200" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBlog(post)}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
                              title="Delete post"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}
              {activeTab === 'order' && (
                <motion.div
                  key="order-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Manage System Design Blog Order</h2>
                    <p className="text-gray-400">Reorder the System Design tutorial series by moving blogs up or down.</p>
                  </div>

                  {blogOrderList.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p>No System Design blogs found with order numbers.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {blogOrderList.map((blog, index) => (
                          <div
                            key={blog.id}
                            className="flex items-center gap-4 p-4 rounded-lg bg-black/20 border border-white/10 hover:border-blue-500/50 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-blue-400 font-bold text-lg w-8 text-center">
                                {blog.order}
                              </span>
                              <GripVertical className="w-5 h-5 text-gray-500" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-medium line-clamp-1">{blog.title}</h3>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => moveBlogUp(index)}
                                disabled={index === 0}
                                className={`p-2 rounded-lg transition-all ${
                                  index === 0
                                    ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                }`}
                                title="Move up"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveBlogDown(index)}
                                disabled={index === blogOrderList.length - 1}
                                className={`p-2 rounded-lg transition-all ${
                                  index === blogOrderList.length - 1
                                    ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                }`}
                                title="Move down"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-4 pt-4 border-t border-white/10">
                        <Button
                          onClick={handleSaveBlogOrder}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Order
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setBlogOrderList(systemDesignBlogs.map(post => ({ id: post.id, title: post.title, order: post.order || 999 })));
                            toast({
                              title: "Reset",
                              description: "Order reset to original",
                            });
                          }}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          Reset
                        </Button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
              {activeTab === 'service' && (
                <motion.div
                  key="service-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-white mb-4">Manage Services</h2>
                  <form onSubmit={handleServiceSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Service Name</label>
                        <input
                          type="text"
                          value={serviceForm.name}
                          onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Category</label>
                        <select
                          value={serviceForm.category}
                          onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                        >
                          <option value="Graphic Design">Graphic Design</option>
                          <option value="Website Design">Website Design</option>
                          <option value="Web Development">Web Development</option>
                          <option value="Digital Marketing">Digital Marketing</option>
                          <option value="Mobile App Development">Mobile App Development</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Description</label>
                      <textarea
                        value={serviceForm.description}
                        onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-green-500 focus:outline-none h-24"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Featured Image URL</label>
                      <input
                        type="url"
                        value={serviceForm.featuredImage}
                        onChange={(e) => setServiceForm({ ...serviceForm, featuredImage: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Membership Price (Optional)</label>
                        <input
                          type="number"
                          value={serviceForm.membershipPrice}
                          onChange={(e) => setServiceForm({ ...serviceForm, membershipPrice: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">General Price (Optional)</label>
                        <input
                          type="number"
                          value={serviceForm.generalPrice}
                          onChange={(e) => setServiceForm({ ...serviceForm, generalPrice: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
                      {editingServiceId ? 'Update Service' : 'Add Service'}
                    </Button>
                  </form>
                  <div className="mt-8 pt-8 border-t border-white/10">
                    <h3 className="text-xl font-bold text-white mb-4">All Services</h3>
                    <div className="space-y-3">
                      {allServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between gap-4 p-4 rounded-lg bg-black/20 border border-white/10"
                        >
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">{service.name}</p>
                            <p className="text-xs text-gray-400">{service.category}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingServiceId(service.id);
                                setServiceForm({
                                  name: service.name || '',
                                  description: service.description || '',
                                  category: service.category || 'Graphic Design',
                                  featuredImage: service.featuredImage || '',
                                  features: service.features || [''],
                                  addOns: service.addOns || [{ name: '', price: '' }],
                                  membershipPrice: service.membershipPrice || '',
                                  generalPrice: service.generalPrice || ''
                                });
                              }}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
                            >
                              <Pencil className="w-4 h-4 text-gray-200" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete service: "${service.name}"?`)) {
                                  deleteService(service.id);
                                  setTimeout(() => window.location.reload(), 600);
                                }
                              }}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'schema' && (
                <motion.div
                  key="schema-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-white mb-4">Manage Schema Data</h2>
                  <p className="text-gray-400 mb-6">
                    Update schema rating values that will be used across all pages. These values affect SEO and rich snippets.
                  </p>
                  <form onSubmit={handleSchemaSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Rating Value</label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          value={schemaForm.ratingValue}
                          onChange={(e) => setSchemaForm({ ...schemaForm, ratingValue: parseFloat(e.target.value) })}
                          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Best Rating</label>
                        <input
                          type="number"
                          value={schemaForm.bestRating}
                          onChange={(e) => setSchemaForm({ ...schemaForm, bestRating: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Worst Rating</label>
                        <input
                          type="number"
                          value={schemaForm.worstRating}
                          onChange={(e) => setSchemaForm({ ...schemaForm, worstRating: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Rating Count</label>
                        <input
                          type="number"
                          value={schemaForm.ratingCount}
                          onChange={(e) => setSchemaForm({ ...schemaForm, ratingCount: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Review Count</label>
                        <input
                          type="number"
                          value={schemaForm.reviewCount}
                          onChange={(e) => setSchemaForm({ ...schemaForm, reviewCount: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
                      Save Schema Data
                    </Button>
                  </form>
                </motion.div>
              )}
              {activeTab === 'images' && (
                <motion.div
                  key="images-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-white mb-4">Manage Image Alt Tags</h2>
                  <p className="text-gray-400 mb-6">
                    Add and manage alt text for images used throughout the website. This improves SEO and accessibility.
                  </p>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Image URL"
                        className="flex-1 px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={newImageAlt}
                        onChange={(e) => setNewImageAlt(e.target.value)}
                        placeholder="Alt text"
                        className="flex-1 px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <Button onClick={handleAddImage} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        Add
                      </Button>
                    </div>
                    <form onSubmit={handleImageAltSubmit} className="space-y-4">
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {Object.entries(imageAltTags).map(([url, alt]) => (
                          <div key={url} className="flex gap-2 items-center p-3 rounded-lg bg-black/20 border border-white/10">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-400 truncate mb-1">{url}</p>
                              <input
                                type="text"
                                value={alt}
                                onChange={(e) => {
                                  setImageAltTags({ ...imageAltTags, [url]: e.target.value });
                                }}
                                className="w-full px-3 py-1 rounded bg-black/20 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                                placeholder="Alt text"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newTags = { ...imageAltTags };
                                delete newTags[url];
                                setImageAltTags(newTags);
                              }}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                      {Object.keys(imageAltTags).length === 0 && (
                        <p className="text-gray-400 text-center py-8">No images added yet. Add images using the form above.</p>
                      )}
                      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                        Save All Alt Tags
                      </Button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPage;
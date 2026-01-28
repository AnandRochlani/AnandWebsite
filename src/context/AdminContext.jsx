import React, { createContext, useContext } from 'react';
import { useToast } from '@/components/ui/use-toast';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const { toast } = useToast();

  const addCourse = (courseData) => {
    try {
      const existingCourses = JSON.parse(localStorage.getItem('customCourses') || '[]');
      // Generate a random ID that doesn't conflict with existing ones (assuming < 1000 static courses)
      const newId = Date.now();
      
      const newCourse = {
        ...courseData,
        id: newId,
        featuredImage: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&w=800&q=80`, // Random placeholder
        featured: false,
        modules: courseData.modules || []
      };

      const updatedCourses = [...existingCourses, newCourse];
      localStorage.setItem('customCourses', JSON.stringify(updatedCourses));
      
      // Force reload of window to update static imports in other files if strictly necessary, 
      // but for SPA we usually rely on context/state. 
      // Since we can't edit CourseDetail to use context, we might rely on the user navigating or 
      // the fact that we updated localStorage which getAllCourses reads.
      
      return { success: true };
    } catch (error) {
      // Silently handle errors - return error message to caller
      return { success: false, error: error.message || 'Failed to add course' };
    }
  };

  const addBlogPost = (postData) => {
    try {
      const existingPosts = JSON.parse(localStorage.getItem('customBlogPosts') || '[]');
      const newId = Date.now();

      const newPost = {
        ...postData,
        id: newId,
        featuredImage: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&w=800&q=80`, // Random placeholder
        featured: false,
        readTime: `${Math.ceil(postData.content.length / 1000)} min read` // Estimate read time
      };

      const updatedPosts = [...existingPosts, newPost];
      localStorage.setItem('customBlogPosts', JSON.stringify(updatedPosts));

      return { success: true };
    } catch (error) {
      // Silently handle errors - return error message to caller
      return { success: false, error: error.message || 'Failed to add blog post' };
    }
  };

  const updateBlogOrder = (blogOrders) => {
    try {
      // blogOrders is an array of { id, order } objects
      const orderMap = {};
      blogOrders.forEach(({ id, order }) => {
        orderMap[id] = order;
      });
      localStorage.setItem('blogOrder', JSON.stringify(orderMap));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to update blog order' };
    }
  };

  return (
    <AdminContext.Provider value={{ addCourse, addBlogPost, updateBlogOrder }}>
      {children}
    </AdminContext.Provider>
  );
};
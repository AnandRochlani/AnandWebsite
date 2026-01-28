import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { getAllCourses } from '@/data/courses';

const SavedCoursesContext = createContext();

export const useSavedCourses = () => {
  const context = useContext(SavedCoursesContext);
  if (!context) {
    throw new Error('useSavedCourses must be used within a SavedCoursesProvider');
  }
  return context;
};

export const SavedCoursesProvider = ({ children }) => {
  const [savedCourseIds, setSavedCourseIds] = useState([]);
  const { toast } = useToast();

  // Initialize from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedCourses');
    if (saved) {
      try {
        setSavedCourseIds(JSON.parse(saved));
      } catch (e) {
        // Silently handle parse errors - use empty array as fallback
        setSavedCourseIds([]);
      }
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('savedCourses', JSON.stringify(savedCourseIds));
  }, [savedCourseIds]);

  const addSavedCourse = (courseId) => {
    if (!savedCourseIds.includes(courseId)) {
      setSavedCourseIds(prev => [...prev, courseId]);
      toast({
        title: "Course Saved",
        description: "This course has been added to your saved list.",
        className: "bg-green-600 border-green-700 text-white"
      });
    }
  };

  const removeSavedCourse = (courseId) => {
    setSavedCourseIds(prev => prev.filter(id => id !== courseId));
    toast({
      title: "Course Removed",
      description: "This course has been removed from your saved list.",
    });
  };

  const toggleSave = (courseId) => {
    if (savedCourseIds.includes(courseId)) {
      removeSavedCourse(courseId);
    } else {
      addSavedCourse(courseId);
    }
  };

  const isSaved = (courseId) => savedCourseIds.includes(courseId);

  const getSavedCourses = () => {
    return getAllCourses().filter(course => savedCourseIds.includes(course.id));
  };

  return (
    <SavedCoursesContext.Provider value={{ 
      savedCourseIds, 
      addSavedCourse, 
      removeSavedCourse, 
      toggleSave, 
      isSaved,
      getSavedCourses 
    }}>
      {children}
    </SavedCoursesContext.Provider>
  );
};
import React from 'react';
import { Heart } from 'lucide-react';
import { useSavedCourses } from '@/context/SavedCoursesContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const SaveButton = ({ courseId, className, showText = false, onSave }) => {
  const { isSaved, toggleSave } = useSavedCourses();
  const saved = isSaved(courseId);

  const handleClick = (e) => {
    e.preventDefault(); // Prevent link navigation if inside a Link
    e.stopPropagation();
    toggleSave(courseId);
    if (onSave) onSave(courseId);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group flex items-center justify-center transition-all duration-300 rounded-full",
        showText ? "px-4 py-2" : "p-2",
        className
      )}
      aria-label={saved ? "Remove from saved" : "Save course"}
    >
      <motion.div
        whileTap={{ scale: 0.8 }}
        animate={{ scale: saved ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        <Heart
          className={cn(
            "w-5 h-5 transition-colors duration-300",
            saved
              ? "fill-brand text-brand"
              : "text-white group-hover:text-lavender"
          )}
        />
      </motion.div>
      {showText && (
        <span className={cn(
          "ml-2 font-medium transition-colors duration-300",
          saved ? "text-brand" : "text-white group-hover:text-lavender"
        )}>
          {saved ? "Saved" : "Save Course"}
        </span>
      )}
    </button>
  );
};

export default SaveButton;

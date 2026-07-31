export const defaultCourses = [
  {
    id: 9,
    slug: "system-design-fundamental",
    name: "System Design Fundamentals for Interviews",
    description: "Learn system design fundamentals with databases, caching, scalability, consistent hashing, and real-world interview case studies.",
    instructor: "Anand Rochlani",
    instructorBio: "Anand Rochlani is a Member of Technical Staff at Salesforce and a system design educator focused on practical architecture, scaling trade-offs, and interview-ready fundamentals.",
    level: "Beginner",
    duration: "5h 40m",
    price: "View on Udemy",
    category: "System Design",
    rating: 4.8,
    studentsEnrolled: 350,
    featuredImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
    modules: [
       { id: 1, title: "Introduction", lessons: 3, duration: "10 min" },
       { id: 2, title: "System Design Terminology", lessons: 14, duration: "1h 36m" },
       { id: 3, title: "Social Bookmarking Service Case Study", lessons: 8, duration: "1h 2m" },
       { id: 4, title: "Consistent Hashing Deep Dive", lessons: 7, duration: "1h 9m" },
       { id: 5, title: "Master-Slave Architecture", lessons: 2, duration: "19 min" },
       { id: 6, title: "Coding Contest Platform Case Study", lessons: 2, duration: "30 min" },
       { id: 7, title: "Facebook News Feed Case Study", lessons: 7, duration: "53 min" },
       { id: 8, title: "Google Typeahead Case Study", lessons: 6, duration: "3 min" }
    ],
    learningOutcomes: [
      "Design scalable, reliable, and maintainable systems",
      "Understand core concepts like load balancing, caching, and partitioning",
      "Analyze and choose appropriate database technologies (SQL vs NoSQL)",
      "Identify read and write bottlenecks and choose practical scaling strategies",
      "Apply a structured, trade-off-driven approach in system design interviews"
    ],
    featured: true,
    isExternal: true,
    externalUrl: "https://www.udemy.com/course/system-design-fundamental/?referralCode=4D123B9F202E6D906A73"
  }
];

// Migration: enforce "only System Design" catalog in localStorage.
const COURSE_CATALOG_VERSION = '3';
const migrateCourseCatalog = () => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    const current = localStorage.getItem('courseCatalogVersion');
    if (current !== COURSE_CATALOG_VERSION) {
      // Remove any custom/old courses and keep only System Design.
      localStorage.setItem('customCourses', '[]');
      localStorage.setItem('courseOverrides', '{}');
      localStorage.setItem('deletedCourseIds', '[]');
      // Keep only course 9 in saved list (if present)
      try {
        const saved = JSON.parse(localStorage.getItem('savedCourses') || '[]');
        const filtered = Array.isArray(saved) ? saved.filter((id) => Number(id) === 9) : [];
        localStorage.setItem('savedCourses', JSON.stringify(filtered));
      } catch (e) {
        localStorage.setItem('savedCourses', '[]');
      }
      localStorage.setItem('courseCatalogVersion', COURSE_CATALOG_VERSION);
    }
  } catch (e) {
    // Ignore migration errors
  }
};

// Run migration once on module load
migrateCourseCatalog();

// Helper to get local courses
const getLocalCourses = () => {
  try {
    const local = localStorage.getItem('customCourses');
    return local ? JSON.parse(local) : [];
  } catch (e) {
    return [];
  }
};

const getCourseOverrides = () => {
  try {
    const overrides = localStorage.getItem('courseOverrides');
    return overrides ? JSON.parse(overrides) : {};
  } catch (e) {
    return {};
  }
};

const getDeletedCourseIds = () => {
  try {
    const deleted = localStorage.getItem('deletedCourseIds');
    return deleted ? JSON.parse(deleted) : [];
  } catch (e) {
    return [];
  }
};

const applyCourseEdits = (coursesList) => {
  const overrides = getCourseOverrides();
  const deletedIds = new Set(getDeletedCourseIds());

  return coursesList
    .filter((course) => !deletedIds.has(course.id))
    .map((course) => (overrides[course.id] ? { ...course, ...overrides[course.id] } : course));
};

// Export combined for backward compatibility with components using static imports (will only load once on init)
export const courses = applyCourseEdits([...defaultCourses, ...getLocalCourses()]);

// Export function for fresh data
export const getAllCourses = () => {
  return applyCourseEdits([...defaultCourses, ...getLocalCourses()]);
};

export const defaultCourses = [
  {
    id: 9,
    name: "System Design Fundamental",
    description: "Master system design fundamentals—scalability, load balancing, caching, databases, and distributed systems. Designed for interview prep and real-world architecture thinking.",
    instructor: "Anand Rochlani",
    instructorBio: "System design educator focused on practical architecture, scaling trade-offs, and interview-ready fundamentals.",
    level: "Beginner to Advanced",
    duration: "Self-paced (Udemy)",
    price: "Udemy",
    category: "System Design",
    rating: 4.8,
    studentsEnrolled: "50K+",
    featuredImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
    modules: [
       { id: 1, title: "Introduction to System Design", lessons: 4, duration: "1 hour" },
       { id: 2, title: "Load Balancing & Scaling", lessons: 6, duration: "2 hours" },
       { id: 3, title: "Database Technologies", lessons: 8, duration: "2.5 hours" },
       { id: 4, title: "Caching & Content Delivery", lessons: 5, duration: "1.5 hours" },
       { id: 5, title: "Distributed Systems", lessons: 7, duration: "2 hours" },
       { id: 6, title: "System Design Interviews", lessons: 10, duration: "3 hours" }
    ],
    learningOutcomes: [
      "Design scalable, reliable, and maintainable systems",
      "Understand core concepts like load balancing, caching, and partitioning",
      "Analyze and choose appropriate database technologies (SQL vs NoSQL)",
      "Master distributed systems patterns and microservices architecture",
      "Prepare effectively for system design interviews at top tech companies"
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
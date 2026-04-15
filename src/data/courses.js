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
  },
  {
    id: 10,
    name: "Data Structures & Algorithms: Complete DSA Course (2026)",
    description: "Master arrays, trees, graphs, dynamic programming, and sorting algorithms. Build a strong foundation for coding interviews at top tech companies with hands-on problem solving.",
    instructor: "Anand Rochlani",
    instructorBio: "Software engineer and educator specializing in DSA, system design, and interview preparation for top tech companies.",
    level: "Beginner to Advanced",
    duration: "Self-paced (Udemy)",
    price: "Udemy",
    category: "Data Structures & Algorithms",
    rating: 4.7,
    studentsEnrolled: "10K+",
    featuredImage: "https://images.unsplash.com/photo-1509228468518-180dd4864904",
    modules: [
      { id: 1, title: "Arrays & Strings", lessons: 8, duration: "2 hours" },
      { id: 2, title: "Linked Lists & Stacks", lessons: 6, duration: "1.5 hours" },
      { id: 3, title: "Trees & Binary Search Trees", lessons: 8, duration: "2.5 hours" },
      { id: 4, title: "Graphs & Traversals", lessons: 7, duration: "2 hours" },
      { id: 5, title: "Dynamic Programming", lessons: 10, duration: "3 hours" },
      { id: 6, title: "Sorting & Searching Algorithms", lessons: 6, duration: "1.5 hours" },
      { id: 7, title: "Interview Problem Patterns", lessons: 12, duration: "3.5 hours" }
    ],
    learningOutcomes: [
      "Solve coding interview problems using proven patterns and techniques",
      "Master arrays, strings, linked lists, trees, graphs, and hash maps",
      "Understand and implement dynamic programming solutions",
      "Analyze time and space complexity of algorithms (Big O)",
      "Prepare effectively for coding rounds at FAANG and top tech companies"
    ],
    featured: true,
    isExternal: true,
    externalUrl: "https://www.udemy.com/course/data-structures-algorithms-anand-rochlani/"
  },
  {
    id: 11,
    name: "Low Level Design: OOP & Design Patterns for Interviews",
    description: "Learn object-oriented design, SOLID principles, and design patterns to ace machine coding rounds and LLD interviews. Build real systems from scratch.",
    instructor: "Anand Rochlani",
    instructorBio: "Software engineer and educator focused on practical design skills for coding interviews and production systems.",
    level: "Intermediate to Advanced",
    duration: "Coming Soon",
    price: "Coming Soon",
    category: "Low Level Design",
    rating: 0,
    studentsEnrolled: "Coming Soon",
    featuredImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
    modules: [
      { id: 1, title: "OOP Fundamentals & SOLID Principles", lessons: 6, duration: "2 hours" },
      { id: 2, title: "Creational Design Patterns", lessons: 5, duration: "1.5 hours" },
      { id: 3, title: "Structural Design Patterns", lessons: 5, duration: "1.5 hours" },
      { id: 4, title: "Behavioral Design Patterns", lessons: 6, duration: "2 hours" },
      { id: 5, title: "LLD Case Studies", lessons: 10, duration: "3 hours" },
      { id: 6, title: "Machine Coding Round Prep", lessons: 8, duration: "2.5 hours" }
    ],
    learningOutcomes: [
      "Design clean, maintainable object-oriented systems",
      "Apply SOLID principles and design patterns in real code",
      "Solve LLD interview problems: parking lot, elevator, chess, etc.",
      "Ace machine coding rounds with structured approach",
      "Bridge the gap between DSA and system design thinking"
    ],
    featured: true,
    isExternal: false,
    comingSoon: true
  }
];

// Migration: enforce "only System Design" catalog in localStorage.
const COURSE_CATALOG_VERSION = '4';
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
        const validIds = new Set([9, 10, 11]);
      const filtered = Array.isArray(saved) ? saved.filter((id) => validIds.has(Number(id))) : [];
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
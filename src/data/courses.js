export const defaultCourses = [
  {
    id: 9,
    name: "System Design Fundamental",
    description: "Master the fundamentals of system design including scalability, load balancing, databases, caching, and distributed systems architecture. Learn how to design large-scale systems that can handle millions of users.",
    instructor: "Udemy Instructor",
    instructorBio: "Expert Software Architect with experience designing scalable systems for major tech companies.",
    level: "Advanced",
    duration: "12 hours",
    price: "$89.99",
    category: "System Design",
    rating: 4.8,
    studentsEnrolled: 50000,
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
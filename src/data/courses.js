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
    status: "published",
    workload: "PT5H40M",
    // Search title. Kept short so the " | AnandRochlani" suffix fits inside the
    // ~60-character budget without the prerenderer truncating it mid-phrase.
    seoTitle: "System Design Course for Interviews",
    seoDescription: "Learn system design for interviews: scalability, caching, load balancing, consistent hashing, SQL vs NoSQL, and five worked case studies in 5h 40m of video.",
    externalUrl: "https://www.udemy.com/course/system-design-fundamental/?referralCode=4D123B9F202E6D906A73"
  },
  {
    // In production. There is NO Udemy URL yet — do not invent one. When the course
    // ships, set status: "published", isExternal: true and add externalUrl.
    id: 10,
    slug: "amazon-coding-interview-patterns",
    name: "Crack the Amazon Coding Interview: 15 LeetCode Patterns",
    description: "Pass the Amazon coding interview by learning 15 reusable LeetCode patterns instead of grinding 300 random problems — with optimised solutions for each one.",
    seoDescription: "The 15 LeetCode patterns behind the Amazon coding interview — two pointers, sliding window, BFS/DFS, heaps and DP — across 111 lessons and 4 mock interviews.",
    instructor: "Anand Rochlani",
    instructorBio: "Anand Rochlani is a Member of Technical Staff at Salesforce and an interview-prep educator focused on pattern recognition, clear complexity reasoning, and think-out-loud interview technique.",
    level: "Beginner to Intermediate",
    duration: "~16h",
    price: "Launching soon",
    category: "Coding Interview",
    studentsEnrolled: 0,
    featuredImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    modules: [
      { id: 0, title: "Orientation — Inside the Amazon Loop", lessons: 3, duration: "24 min" },
      { id: 1, title: "Complexity & The Toolbox", lessons: 5, duration: "46 min" },
      { id: 2, title: "Two Pointers", lessons: 6, duration: "59 min" },
      { id: 3, title: "Sliding Window", lessons: 7, duration: "1h 15m" },
      { id: 4, title: "Fast & Slow Pointers", lessons: 4, duration: "37 min" },
      { id: 5, title: "Linked List In-Place Reversal", lessons: 4, duration: "46 min" },
      { id: 6, title: "Stacks & Monotonic Stacks", lessons: 5, duration: "54 min" },
      { id: 7, title: "Modified Binary Search", lessons: 6, duration: "1h 8m" },
      { id: 8, title: "Trees — BFS", lessons: 5, duration: "50 min" },
      { id: 9, title: "Trees — DFS", lessons: 6, duration: "1h 2m" },
      { id: 10, title: "Graphs on Grids & Nodes", lessons: 7, duration: "1h 18m" },
      { id: 11, title: "Topological Sort", lessons: 4, duration: "49 min" },
      { id: 12, title: "Heaps & Top-K", lessons: 6, duration: "1h 11m" },
      { id: 13, title: "Subsets & Backtracking", lessons: 7, duration: "1h 24m" },
      { id: 14, title: "Dynamic Programming", lessons: 10, duration: "2h 2m" },
      { id: 15, title: "Greedy & Intervals", lessons: 5, duration: "55 min" },
      { id: 16, title: "Tries & Union-Find", lessons: 5, duration: "1h 2m" },
      { id: 17, title: "Amazon Design Problems (LRU, LFU, O(1) sets)", lessons: 5, duration: "1h 1m" },
      { id: 18, title: "Amazon Most-Asked Rapid-Fire", lessons: 6, duration: "1h 7m" },
      { id: 19, title: "Mock Interviews & Leadership Principles", lessons: 5, duration: "1h 4m" }
    ],
    learningOutcomes: [
      "Recognise which of the 15 patterns a new problem maps to within the first 60 seconds",
      "Write the brute force, explain why it times out, then reach the optimal solution",
      "State time and space complexity out loud the way an interviewer scores it",
      "Solve Amazon's recurring design problems — LRU cache, LFU cache, O(1) insert/delete/getRandom",
      "Map your own project stories to Amazon's 14 Leadership Principles using STAR"
    ],
    highlights: [
      "111 lessons across 20 sections",
      "15 reusable patterns, not 300 memorised problems",
      "Every problem taught brute force → optimised → space-optimised",
      "4 narrated mock interviews",
      "5 downloadable cheat sheets (pattern selector, Big-O, 6-step framework, Leadership Principles, top-50 list)"
    ],
    featured: true,
    isExternal: false,
    status: "in-production",
    workload: "PT16H",
    seoTitle: "Amazon Coding Interview Patterns",
    previewArticle: "/blog/leetcode-patterns-coding-interview-guide"
  },
  {
    // In production. There is NO Udemy URL yet — do not invent one.
    id: 11,
    slug: "google-coding-interview-50-problems",
    name: "Crack the Google Coding Interview: The 50-Problem List",
    description: "50 real Google-tagged LeetCode problems — including the premium and hard ones generic courses skip — each taught intuition-first and mapped to the reusable pattern underneath it.",
    seoDescription: "Work through 50 real Google-tagged LeetCode problems grouped into 11 patterns, with intuition-first solutions and the GCA narration Google actually scores.",
    instructor: "Anand Rochlani",
    instructorBio: "Anand Rochlani is a Member of Technical Staff at Salesforce and an interview-prep educator focused on pattern recognition, clear complexity reasoning, and think-out-loud interview technique.",
    level: "Intermediate to Advanced",
    duration: "~11h",
    price: "Launching soon",
    category: "Coding Interview",
    studentsEnrolled: 0,
    featuredImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
    modules: [
      { id: 1, title: "Strings & Parsing", lessons: 10, duration: "2h 10m" },
      { id: 2, title: "Tries", lessons: 1, duration: "14 min" },
      { id: 3, title: "Graphs & Grids", lessons: 8, duration: "1h 52m" },
      { id: 4, title: "Union-Find", lessons: 3, duration: "40 min" },
      { id: 5, title: "Topological Sort", lessons: 1, duration: "13 min" },
      { id: 6, title: "Trees", lessons: 2, duration: "25 min" },
      { id: 7, title: "Heaps, Intervals & Scheduling", lessons: 7, duration: "1h 36m" },
      { id: 8, title: "Design (Implement-a-Class)", lessons: 7, duration: "1h 30m" },
      { id: 9, title: "Dynamic Programming", lessons: 7, duration: "1h 38m" },
      { id: 10, title: "Backtracking & Interactive", lessons: 2, duration: "29 min" },
      { id: 11, title: "Geometry & Math", lessons: 2, duration: "26 min" }
    ],
    learningOutcomes: [
      "Solve the harder, stranger Google-tagged problems generic top-75 lists skip",
      "Map each problem to the reusable pattern underneath it instead of memorising answers",
      "Narrate your approach the way Google's General Cognitive Ability rubric scores it",
      "Handle Google favourites — Robot Room Cleaner, Guess the Word, Race Car, Text Justification, Meeting Rooms III",
      "Prepare Googleyness and Leadership stories with a reusable STAR map"
    ],
    highlights: [
      "50 real Google-tagged problems in 11 pattern sections",
      "Intuition-first: how you would actually arrive at the solution",
      "Brute force → optimised → space optimisation for every problem",
      "GCA narration drilled in every lesson",
      "5 downloadable cheat sheets including the Google-50 checklist"
    ],
    featured: false,
    isExternal: false,
    status: "in-production",
    workload: "PT11H",
    seoTitle: "Google Coding Interview: 50 Problems",
    previewArticle: "/blog/google-coding-interview-questions-preparation-guide"
  }
];

/** True when a course has no purchasable destination yet. */
export const isInProduction = (course) => course?.status === 'in-production';

// Migration: keep localStorage in step with the curated catalog. Bump the version
// whenever defaultCourses changes so stale overrides/deletions cannot hide a course.
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
      // Keep only catalog courses in the saved list (if present)
      try {
        const catalogIds = new Set(defaultCourses.map((c) => c.id));
        const saved = JSON.parse(localStorage.getItem('savedCourses') || '[]');
        const filtered = Array.isArray(saved) ? saved.filter((id) => catalogIds.has(Number(id))) : [];
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

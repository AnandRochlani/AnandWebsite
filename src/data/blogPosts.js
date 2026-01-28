export const defaultBlogPosts = [
  {
    id: 1,
    title: "Getting Started with React Hooks: Learn How to Use useState, useEffect, and Custom Hooks in Functional Components",
    description: "Learn how to use React Hooks including useState hook, useEffect hook, and custom hooks to manage state and side effects in functional components. Master React Hooks for better code organization.",
    content: `
      <h2>Introduction to React Hooks</h2>
      <p>React Hooks revolutionized the way we write React components. Instead of using class components to manage state and lifecycle methods, we can now use functional components with hooks. This comprehensive guide will teach you how to use React Hooks effectively in your projects.</p>
      
      <p>Functional components have become the preferred way to build React applications, and React Hooks make it possible to use state and other React features without writing a class. Whether you're building a simple component or a complex application, understanding React Hooks is essential for modern React development.</p>
      
      <h2>Understanding Functional Components with React Hooks</h2>
      <p>Functional components are JavaScript functions that return JSX. Before React Hooks, functional components were limited to displaying data passed as props. With React Hooks, functional components can now manage state, handle side effects, and access React features that were previously only available in class components.</p>
      
      <p>Learn how to transform your class components into functional components using React Hooks. This approach leads to cleaner, more maintainable code and better performance. Functional components with hooks are easier to test and understand, making your codebase more developer-friendly.</p>
      
      <h3>useState Hook: Managing State in Functional Components</h3>
      <p>The useState hook allows you to add state to functional components. This is one of the most commonly used React Hooks. Here's a simple example of how to use the useState hook:</p>
      <pre><code>import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    &lt;div&gt;
      &lt;p&gt;You clicked {count} times&lt;/p&gt;
      &lt;button onClick={() => setCount(count + 1)}&gt;
        Click me
      &lt;/button&gt;
    &lt;/div&gt;
  );
}</code></pre>
      
      <p>The useState hook returns an array with two elements: the current state value and a function to update it. You can use the useState hook multiple times in a single component to manage different pieces of state. This makes it easy to organize and manage component state in functional components.</p>
      
      <p>When working with the useState hook, remember that state updates are asynchronous. If you need to update state based on the previous state value, use the functional update form: <code>setCount(prevCount => prevCount + 1)</code>. This ensures you're always working with the most current state value.</p>
      
      <h3>useEffect Hook: Handling Side Effects in Functional Components</h3>
      <p>The useEffect hook lets you perform side effects in functional components. It's similar to componentDidMount, componentDidUpdate, and componentWillUnmount combined. Learn how to use the useEffect hook to fetch data, set up subscriptions, or manually change the DOM.</p>
      
      <p>Here's an example of how to use the useEffect hook:</p>
      <pre><code>import React, { useState, useEffect } from 'react';

function DataFetcher() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // This function runs after every render
    fetch('/api/data')
      .then(response => response.json())
      .then(data => setData(data));
  }, []); // Empty array means this effect runs only once
  
  return &lt;div&gt;{data ? data.message : 'Loading...'}&lt;/div&gt;;
}</code></pre>
      
      <p>The useEffect hook accepts two arguments: a function that contains the side effect logic, and an optional dependency array. When the dependency array is empty, the effect runs only once after the initial render. If you include dependencies, the effect will re-run whenever those dependencies change.</p>
      
      <p>Learn how to clean up effects by returning a cleanup function from useEffect. This is important for preventing memory leaks, especially when setting up subscriptions or timers. The cleanup function runs before the component unmounts or before the effect runs again.</p>
      
      <h3>Custom Hooks: Reusing Stateful Logic</h3>
      <p>You can create your own custom hooks to reuse stateful logic across components. This promotes code reusability and cleaner component structure. Custom hooks are regular JavaScript functions that use other React Hooks.</p>
      
      <p>Here's an example of a custom hook:</p>
      <pre><code>function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(initialValue);
  
  return { count, increment, decrement, reset };
}

// Usage in a component
function MyComponent() {
  const { count, increment, decrement, reset } = useCounter(0);
  
  return (
    &lt;div&gt;
      &lt;p&gt;Count: {count}&lt;/p&gt;
      &lt;button onClick={increment}&gt;+&lt;/button&gt;
      &lt;button onClick={decrement}&gt;-&lt;/button&gt;
      &lt;button onClick={reset}&gt;Reset&lt;/button&gt;
    &lt;/div&gt;
  );
}</code></pre>
      
      <p>Custom hooks allow you to extract component logic into reusable functions. By creating custom hooks, you can share stateful logic between different components without duplicating code. This makes your codebase more maintainable and easier to test.</p>
      
      <p>When creating custom hooks, always start the function name with "use" to follow React's naming convention. This helps React identify hooks and apply the Rules of Hooks correctly. Custom hooks can use other hooks, including other custom hooks, allowing you to build complex, reusable logic.</p>
      
      <h2>Best Practices for Using React Hooks</h2>
      <p>When working with React Hooks, there are several best practices to follow. Always call hooks at the top level of your component, never inside loops, conditions, or nested functions. This ensures hooks are called in the same order every time your component renders.</p>
      
      <p>Only call hooks from React function components or custom hooks. Don't call hooks from regular JavaScript functions. This helps React track hook calls and maintain state correctly across renders.</p>
      
      <h2>Common React Hooks You Should Know</h2>
      <p>In addition to useState and useEffect, React provides several other built-in hooks. The useContext hook allows you to consume context values in functional components. The useReducer hook provides an alternative to useState for managing complex state logic.</p>
      
      <p>The useMemo and useCallback hooks help optimize performance by memoizing values and functions. Learn how to use these hooks to prevent unnecessary re-renders and improve your application's performance.</p>
      
      <h2>Conclusion</h2>
      <p>React Hooks make your code more readable and maintainable. By using functional components with hooks, you can write cleaner, more concise code that's easier to understand and test. Start incorporating React Hooks into your projects today to take advantage of these powerful features.</p>
      
      <p>Whether you're using the useState hook to manage component state, the useEffect hook to handle side effects, or creating custom hooks to share logic, React Hooks provide a modern approach to building React applications. Learn how to use React Hooks effectively, and you'll see significant improvements in your code quality and development workflow.</p>
    `,
    author: "Sarah Johnson",
    date: "2026-01-20",
    category: "Web Development",
    readTime: "5 min read",
    featuredImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee",
    featured: true
  },
  {
    id: 2,
    title: "Mastering CSS Grid Layout",
    description: "A comprehensive guide to creating complex layouts with CSS Grid.",
    content: `
      <h2>Why CSS Grid?</h2>
      <p>CSS Grid is a powerful layout system that allows you to create complex, responsive layouts with ease. Unlike Flexbox, which is one-dimensional, Grid is two-dimensional.</p>
      
      <h3>Basic Grid Setup</h3>
      <p>To create a grid container, simply use display: grid. Then define your columns and rows using grid-template-columns and grid-template-rows.</p>
      
      <h3>Grid Areas</h3>
      <p>Grid areas allow you to name sections of your layout, making it easier to position items and create responsive designs.</p>
      
      <h2>Best Practices</h2>
      <p>Always consider mobile-first design and use media queries to adjust your grid layout for different screen sizes.</p>
    `,
    author: "Michael Chen",
    date: "2026-01-18",
    category: "Design",
    readTime: "7 min read",
    featuredImage: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2",
    featured: false
  },
  {
    id: 3,
    title: "Introduction to Machine Learning",
    description: "Understand the basics of machine learning and its real-world applications.",
    content: `
      <h2>What is Machine Learning?</h2>
      <p>Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.</p>
      
      <h3>Types of Machine Learning</h3>
      <p>There are three main types: supervised learning, unsupervised learning, and reinforcement learning. Each has its own use cases and advantages.</p>
      
      <h3>Popular Algorithms</h3>
      <p>Linear regression, decision trees, neural networks, and support vector machines are some of the most commonly used algorithms.</p>
      
      <h2>Getting Started</h2>
      <p>Start with Python and libraries like scikit-learn and TensorFlow to begin your machine learning journey.</p>
    `,
    author: "Dr. Emily Wang",
    date: "2026-01-15",
    category: "Data Science",
    readTime: "10 min read",
    featuredImage: "https://images.unsplash.com/photo-1555255707-c07966088b7b",
    featured: false
  },
  {
    id: 4,
    title: "Building RESTful APIs with Node.js",
    description: "Learn how to create scalable and maintainable REST APIs using Node.js and Express.",
    content: `
      <h2>Introduction to REST APIs</h2>
      <p>REST (Representational State Transfer) is an architectural style for designing networked applications. It uses standard HTTP methods and is stateless.</p>
      
      <h3>Setting Up Express</h3>
      <p>Express is a minimal and flexible Node.js web application framework. It provides a robust set of features for building APIs.</p>
      
      <h3>Routing and Middleware</h3>
      <p>Learn how to create routes for different endpoints and use middleware for authentication, logging, and error handling.</p>
      
      <h2>Best Practices</h2>
      <p>Use proper HTTP status codes, implement versioning, and always validate input data to create secure and reliable APIs.</p>
    `,
    author: "David Martinez",
    date: "2026-01-12",
    category: "Web Development",
    readTime: "8 min read",
    featuredImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
    featured: false
  },
  {
    id: 5,
    title: "UX Design Principles for Beginners",
    description: "Essential UX design principles every designer should know.",
    content: `
      <h2>Understanding User Experience</h2>
      <p>User Experience (UX) design focuses on creating products that provide meaningful and relevant experiences to users.</p>
      
      <h3>Core Principles</h3>
      <p>Usability, accessibility, consistency, and user feedback are fundamental principles that guide great UX design.</p>
      
      <h3>User Research</h3>
      <p>Understanding your users through research, interviews, and testing is crucial for creating effective designs.</p>
      
      <h2>Design Process</h2>
      <p>Follow a structured process: research, wireframing, prototyping, testing, and iteration to create user-centered designs.</p>
    `,
    author: "Lisa Anderson",
    date: "2026-01-10",
    category: "Design",
    readTime: "6 min read",
    featuredImage: "https://images.unsplash.com/photo-1561070791-2526d30994b5",
    featured: false
  },
  {
    id: 6,
    title: "Data Visualization with D3.js",
    description: "Create stunning interactive data visualizations using D3.js library.",
    content: `
      <h2>Introduction to D3.js</h2>
      <p>D3.js is a JavaScript library for producing dynamic, interactive data visualizations in web browsers using SVG, HTML, and CSS.</p>
      
      <h3>Core Concepts</h3>
      <p>Learn about selections, data binding, scales, axes, and transitions to create powerful visualizations.</p>
      
      <h3>Common Chart Types</h3>
      <p>Bar charts, line graphs, scatter plots, and pie charts are just the beginning. D3 allows you to create any visualization you can imagine.</p>
      
      <h2>Best Practices</h2>
      <p>Focus on clarity, choose appropriate chart types, and ensure your visualizations are accessible and responsive.</p>
    `,
    author: "Robert Taylor",
    date: "2026-01-08",
    category: "Data Science",
    readTime: "9 min read",
    featuredImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
    featured: false
  },
  {
    id: 7,
    title: "Responsive Web Design Best Practices",
    description: "Master the art of creating websites that work perfectly on all devices.",
    content: `
      <h2>Mobile-First Approach</h2>
      <p>Start designing for mobile devices first, then progressively enhance the experience for larger screens.</p>
      
      <h3>Flexible Grids and Images</h3>
      <p>Use relative units like percentages and ensure images scale properly within their containers.</p>
      
      <h3>Media Queries</h3>
      <p>Media queries allow you to apply different styles based on device characteristics like screen width.</p>
      
      <h2>Performance Optimization</h2>
      <p>Optimize images, minimize HTTP requests, and use lazy loading to ensure fast load times on all devices.</p>
    `,
    author: "Jennifer Lee",
    date: "2026-01-05",
    category: "Web Development",
    readTime: "7 min read",
    featuredImage: "https://images.unsplash.com/photo-1547658719-da2b51169166",
    featured: false
  },
  {
    id: 8,
    title: "Introduction to TypeScript",
    description: "Learn how TypeScript adds static typing to JavaScript for more robust code.",
    content: `
      <h2>Why TypeScript?</h2>
      <p>TypeScript is a superset of JavaScript that adds optional static typing. It helps catch errors early and improves code quality.</p>
      
      <h3>Basic Types</h3>
      <p>Learn about primitive types like string, number, boolean, as well as arrays, tuples, and enums.</p>
      
      <h3>Interfaces and Classes</h3>
      <p>TypeScript brings object-oriented programming features to JavaScript, making it easier to structure large applications.</p>
      
      <h2>Getting Started</h2>
      <p>Install TypeScript globally, configure your tsconfig.json, and start converting your JavaScript projects today.</p>
    `,
    author: "Alex Thompson",
    date: "2026-01-03",
    category: "Web Development",
    readTime: "6 min read",
    featuredImage: "https://images.unsplash.com/photo-1516116216624-53e697fedbea",
    featured: false
  },
  // System Design Blog Series - Ordered Tutorial
  {
    id: 9,
    title: "Understanding Latency: A Beginner's Guide to System Design Fundamentals",
    description: "Learn what latency is, why it matters, and how it impacts your digital experience. A fundamental concept every system designer must understand.",
    content: `
      <h2>What is Latency?</h2>
      <p>In the world of technology, speed is everything. Whether you are scrolling through social media or waiting for a webpage to load, the time you spend waiting is defined by one critical concept: <strong>Latency</strong>.</p>
      
      <p>At its simplest, <strong>latency is the amount of time it takes for a page to load or a request to be completed</strong>.</p>
      
      <h3>The Restaurant Analogy</h3>
      <p>Think of ordering food at a restaurant:</p>
      <ul>
        <li>You place your order (the request).</li>
        <li>You wait for the chef to cook (the processing).</li>
        <li>The food is delivered to your table (the response).</li>
      </ul>
      
      <p>The total time you spend waiting from the moment you order until the food arrives is the "latency". If the food comes out fast, you have <strong>low latency</strong>. If it takes forever, you have <strong>high latency</strong>.</p>
      
      <h2>How Latency Works: The Technical Breakdown</h2>
      <p>To understand latency in a technical sense, let's look at the example of logging into <strong>Facebook.com</strong>.</p>
      
      <p>When you type a URL into your browser and hit enter, a three-step journey begins:</p>
      
      <ol>
        <li><strong>Request Travel (T1):</strong> Your request travels from your device to the server.</li>
        <li><strong>Processing/Computation (T2):</strong> The server processes your request (e.g., verifying your credentials).</li>
        <li><strong>Response Travel (T3):</strong> The server sends the webpage data back to your device.</li>
      </ol>
      
      <h3>The Latency Formula</h3>
      <p><strong>Total Latency (Δt) = T1 + T2 + T3</strong></p>
      
      <h2>Why is Your Internet Sometimes Slow?</h2>
      <p>Latency isn't fixed; it fluctuates based on several factors:</p>
      
      <h3>Network Strength</h3>
      <p>If you are in a remote area with low bandwidth, your request and response (T1 and T3) will take much longer. In urban areas with high-speed fiber or 5G, this time is significantly reduced.</p>
      
      <h3>Computation Time</h3>
      <p>This is the time the server takes to "think." If the server's code is inefficient, the user waits longer.</p>
      
      <h2>Can We Control Latency?</h2>
      <p>As developers or system designers, we cannot control a user's internet speed (T1 and T3). However, we <strong>can</strong> control the <strong>Computation Time (T2)</strong>.</p>
      
      <p>To reduce T2, developers focus on:</p>
      <ul>
        <li><strong>Writing Optimized Code:</strong> Using efficient logic to process data faster.</li>
        <li><strong>Data Structures and Algorithms (DSA):</strong> Mastering DSA is the key to writing code that minimizes processing time and keeps latency low.</li>
      </ul>
      
      <h2>Conclusion</h2>
      <p>Latency is the silent factor that determines whether a user enjoys an app or abandons it in frustration. By understanding the sum of network travel and computation time, we can build better, "snappier" systems that keep the digital world flowing smoothly.</p>
      
      <p><strong>Watch the full explanation here:</strong> <a href="https://youtu.be/r5vJP_1hX7Q" target="_blank" rel="noopener noreferrer" style="color: #a78bfa; text-decoration: underline;">What Is Latency? | System Design Fundamentals</a></p>
      
      <h2>Next Steps</h2>
      <p>Now that you understand latency, you're ready to dive deeper into system design fundamentals. In the next blog, we'll explore scalable architecture and how to build systems that can handle growth.</p>
    `,
    author: "Anand Rochlani",
    date: "2026-01-28",
    category: "System Design",
    readTime: "7 min read",
    featuredImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
    featured: false,
    order: 1,
    series: "System Design Tutorial"
  },
  {
    id: 16,
    title: "System Design Fundamentals: Introduction to Scalable Architecture",
    description: "Learn the fundamentals of system design and how to build scalable, reliable systems from the ground up.",
    content: `
      <h2>What is System Design?</h2>
      <p>System design is the process of defining the architecture, components, modules, interfaces, and data for a system to satisfy specified requirements. It's a crucial skill for software engineers working on large-scale applications.</p>
      
      <h3>Why System Design Matters</h3>
      <p>As applications grow, they face challenges like handling millions of users, processing terabytes of data, and maintaining high availability. System design helps you create solutions that can scale effectively.</p>
      
      <h3>Key Concepts</h3>
      <p>In this series, we'll cover:</p>
      <ul>
        <li>Scalability and performance</li>
        <li>Reliability and availability</li>
        <li>Load balancing and caching</li>
        <li>Database design and replication</li>
        <li>Microservices architecture</li>
        <li>Distributed systems</li>
      </ul>
      
      <h2>Getting Started</h2>
      <p>Before diving into complex architectures, it's essential to understand the basic building blocks. In the next blog, we'll explore scalability patterns and how to design systems that can handle growth.</p>
    `,
    author: "System Design Expert",
    date: "2026-01-28",
    category: "System Design",
    readTime: "8 min read",
    featuredImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
    featured: false,
    order: 2,
    series: "System Design Tutorial"
  },
  {
    id: 10,
    title: "Scalability Patterns: Horizontal vs Vertical Scaling",
    description: "Understand the difference between horizontal and vertical scaling, and when to use each approach in your system design.",
    content: `
      <h2>Understanding Scalability</h2>
      <p>Scalability is the ability of a system to handle a growing amount of work by adding resources. There are two main approaches: horizontal and vertical scaling.</p>
      
      <h3>Vertical Scaling (Scale Up)</h3>
      <p>Vertical scaling involves adding more power (CPU, RAM, storage) to your existing machines. It's simpler to implement but has limitations:</p>
      <ul>
        <li>Limited by hardware constraints</li>
        <li>Single point of failure</li>
        <li>Can be expensive at scale</li>
      </ul>
      
      <h3>Horizontal Scaling (Scale Out)</h3>
      <p>Horizontal scaling involves adding more machines to your system. It's more complex but offers better scalability:</p>
      <ul>
        <li>Can scale almost infinitely</li>
        <li>Better fault tolerance</li>
        <li>More cost-effective at scale</li>
      </ul>
      
      <h2>Choosing the Right Approach</h2>
      <p>Most modern systems use horizontal scaling for better flexibility. However, you might start with vertical scaling and migrate to horizontal as you grow.</p>
      
      <h2>Next Steps</h2>
      <p>Once you understand scaling, the next step is learning how to distribute traffic effectively. In the next blog, we'll explore load balancing strategies.</p>
    `,
    author: "System Design Expert",
    date: "2026-01-28",
    category: "System Design",
    readTime: "10 min read",
    featuredImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
    featured: false,
    order: 3,
    series: "System Design Tutorial"
  },
  {
    id: 11,
    title: "Load Balancing: Distributing Traffic Across Servers",
    description: "Learn about load balancing algorithms and how to distribute incoming requests efficiently across multiple servers.",
    content: `
      <h2>What is Load Balancing?</h2>
      <p>Load balancing is the process of distributing incoming network traffic across multiple servers to ensure no single server is overwhelmed. It's essential for horizontal scaling.</p>
      
      <h3>Load Balancing Algorithms</h3>
      <p>Different algorithms serve different purposes:</p>
      <ul>
        <li><strong>Round Robin:</strong> Distributes requests sequentially</li>
        <li><strong>Least Connections:</strong> Routes to server with fewest active connections</li>
        <li><strong>IP Hash:</strong> Routes based on client IP for session persistence</li>
        <li><strong>Weighted Round Robin:</strong> Distributes based on server capacity</li>
      </ul>
      
      <h3>Types of Load Balancers</h3>
      <p>Load balancers can operate at different layers:</p>
      <ul>
        <li><strong>Layer 4 (Transport):</strong> Routes based on IP and port</li>
        <li><strong>Layer 7 (Application):</strong> Routes based on HTTP headers, URLs, etc.</li>
      </ul>
      
      <h2>Implementation Strategies</h2>
      <p>You can implement load balancing using hardware, software, or cloud services. Popular solutions include NGINX, HAProxy, AWS ELB, and Google Cloud Load Balancer.</p>
      
      <h2>Next Steps</h2>
      <p>After distributing traffic, you need to optimize data access. In the next blog, we'll explore caching strategies to improve performance.</p>
    `,
    author: "System Design Expert",
    date: "2026-01-28",
    category: "System Design",
    readTime: "12 min read",
    featuredImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
    featured: false,
    order: 4,
    series: "System Design Tutorial"
  },
  {
    id: 12,
    title: "Caching Strategies: Improving Performance with Smart Data Storage",
    description: "Master caching techniques including cache-aside, write-through, write-behind, and refresh-ahead patterns.",
    content: `
      <h2>Why Caching Matters</h2>
      <p>Caching stores frequently accessed data in fast storage to reduce latency and database load. It's one of the most effective ways to improve system performance.</p>
      
      <h3>Cache-Aside Pattern</h3>
      <p>The application checks the cache first. If data exists (cache hit), it's returned. If not (cache miss), data is fetched from the database and stored in cache.</p>
      
      <h3>Write-Through Pattern</h3>
      <p>Data is written to both cache and database simultaneously. Ensures consistency but may be slower for write operations.</p>
      
      <h3>Write-Behind (Write-Back) Pattern</h3>
      <p>Data is written to cache first, then asynchronously written to database. Faster writes but risk of data loss if cache fails.</p>
      
      <h3>Refresh-Ahead Pattern</h3>
      <p>Cache automatically refreshes data before it expires, reducing cache misses for frequently accessed data.</p>
      
      <h2>Cache Eviction Policies</h2>
      <p>When cache is full, you need to decide what to remove:</p>
      <ul>
        <li><strong>LRU (Least Recently Used):</strong> Remove least recently accessed items</li>
        <li><strong>LFU (Least Frequently Used):</strong> Remove least frequently accessed items</li>
        <li><strong>FIFO (First In First Out):</strong> Remove oldest items</li>
      </ul>
      
      <h2>Next Steps</h2>
      <p>Now that you understand caching, let's explore database design. In the next blog, we'll cover database replication and sharding strategies.</p>
    `,
    author: "System Design Expert",
    date: "2026-01-28",
    category: "System Design",
    readTime: "15 min read",
    featuredImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
    featured: false,
    order: 5,
    series: "System Design Tutorial"
  },
  {
    id: 13,
    title: "Database Design: Replication, Sharding, and Consistency",
    description: "Learn about database replication strategies, sharding techniques, and how to maintain data consistency in distributed systems.",
    content: `
      <h2>Database Replication</h2>
      <p>Replication involves copying data across multiple database servers to improve availability, reliability, and read performance.</p>
      
      <h3>Master-Slave Replication</h3>
      <p>One master handles writes, multiple slaves handle reads. Simple but master is a single point of failure.</p>
      
      <h3>Master-Master Replication</h3>
      <p>Multiple masters can handle both reads and writes. Better availability but requires conflict resolution.</p>
      
      <h2>Database Sharding</h2>
      <p>Sharding partitions data across multiple databases based on a shard key. Each shard operates independently.</p>
      
      <h3>Sharding Strategies</h3>
      <ul>
        <li><strong>Range-based:</strong> Partition by value ranges</li>
        <li><strong>Hash-based:</strong> Partition using hash function</li>
        <li><strong>Directory-based:</strong> Use lookup table to find shard</li>
      </ul>
      
      <h2>CAP Theorem</h2>
      <p>In distributed systems, you can only guarantee two of three properties:</p>
      <ul>
        <li><strong>Consistency:</strong> All nodes see same data</li>
        <li><strong>Availability:</strong> System remains operational</li>
        <li><strong>Partition Tolerance:</strong> System works despite network failures</li>
      </ul>
      
      <h2>Next Steps</h2>
      <p>Understanding databases is crucial, but modern systems often use microservices. In the next blog, we'll explore microservices architecture and its benefits.</p>
    `,
    author: "System Design Expert",
    date: "2026-01-28",
    category: "System Design",
    readTime: "18 min read",
    featuredImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
    featured: false,
    order: 6,
    series: "System Design Tutorial"
  },
  {
    id: 14,
    title: "Microservices Architecture: Building Distributed Systems",
    description: "Explore microservices architecture, service communication patterns, and how to design loosely coupled, independently deployable services.",
    content: `
      <h2>What are Microservices?</h2>
      <p>Microservices architecture breaks applications into small, independent services that communicate over well-defined APIs. Each service owns its data and can be developed, deployed, and scaled independently.</p>
      
      <h3>Benefits of Microservices</h3>
      <ul>
        <li>Independent deployment and scaling</li>
        <li>Technology diversity (use best tool for each service)</li>
        <li>Fault isolation (one service failure doesn't bring down entire system)</li>
        <li>Team autonomy</li>
      </ul>
      
      <h3>Challenges</h3>
      <ul>
        <li>Increased complexity in communication</li>
        <li>Data consistency across services</li>
        <li>Network latency</li>
        <li>Service discovery and configuration</li>
      </ul>
      
      <h2>Service Communication</h2>
      <p>Services can communicate via:</p>
      <ul>
        <li><strong>Synchronous:</strong> REST, gRPC (request-response)</li>
        <li><strong>Asynchronous:</strong> Message queues, event streaming (Kafka, RabbitMQ)</li>
      </ul>
      
      <h2>API Gateway Pattern</h2>
      <p>An API gateway acts as a single entry point, handling routing, authentication, rate limiting, and request aggregation.</p>
      
      <h2>Next Steps</h2>
      <p>Microservices are powerful but require careful design. In the next blog, we'll put it all together by designing a complete system from scratch.</p>
    `,
    author: "System Design Expert",
    date: "2026-01-28",
    category: "System Design",
    readTime: "20 min read",
    featuredImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
    featured: false,
    order: 7,
    series: "System Design Tutorial"
  },
  {
    id: 15,
    title: "Designing a URL Shortener: Complete System Design Case Study",
    description: "Put your system design knowledge to practice by designing a URL shortener like bit.ly from scratch, covering all aspects from requirements to implementation.",
    content: `
      <h2>Problem Statement</h2>
      <p>Design a URL shortener service like bit.ly that can shorten long URLs and redirect users to original URLs when they access the short link.</p>
      
      <h2>Requirements Gathering</h2>
      <h3>Functional Requirements</h3>
      <ul>
        <li>Shorten long URLs</li>
        <li>Redirect short URLs to original URLs</li>
        <li>Custom aliases (optional)</li>
        <li>Link expiration (optional)</li>
      </ul>
      
      <h3>Non-Functional Requirements</h3>
      <ul>
        <li>High availability</li>
        <li>Low latency (redirect should be fast)</li>
        <li>Scalable to billions of URLs</li>
        <li>URLs should be as short as possible</li>
      </ul>
      
      <h2>Capacity Estimation</h2>
      <p>Assume 100M new URLs per month. That's about 40 URLs per second for writes. For reads, assume 100:1 read:write ratio = 4,000 reads/second.</p>
      
      <h2>System Design</h2>
      <h3>URL Encoding</h3>
      <p>Use base62 encoding (a-z, A-Z, 0-9) to generate short URLs. With 6 characters, we can store 62^6 = 56.8 billion URLs.</p>
      
      <h3>Database Schema</h3>
      <p>Store mappings of short URL to original URL. Use NoSQL for better scalability or SQL with proper indexing.</p>
      
      <h3>Architecture</h3>
      <ul>
        <li>Load balancer to distribute traffic</li>
        <li>Application servers to handle requests</li>
        <li>Database to store URL mappings</li>
        <li>Cache (Redis) for frequently accessed URLs</li>
      </ul>
      
      <h2>Key Design Decisions</h2>
      <ul>
        <li>Use hash function or counter for URL generation</li>
        <li>Cache popular URLs to reduce database load</li>
        <li>Use database sharding for scale</li>
        <li>Implement rate limiting to prevent abuse</li>
      </ul>
      
      <h2>Conclusion</h2>
      <p>This case study demonstrates how to apply all the concepts we've learned: scalability, load balancing, caching, database design, and more. Practice designing other systems like Twitter, Instagram, or Uber to master system design!</p>
    `,
    author: "System Design Expert",
    date: "2026-01-28",
    category: "System Design",
    readTime: "25 min read",
    featuredImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
    featured: false,
    order: 8,
    series: "System Design Tutorial"
  }
];

const getLocalBlogPosts = () => {
  try {
    const local = localStorage.getItem('customBlogPosts');
    return local ? JSON.parse(local) : [];
  } catch (e) {
    return [];
  }
};

const getBlogOrder = () => {
  try {
    const order = localStorage.getItem('blogOrder');
    return order ? JSON.parse(order) : {};
  } catch (e) {
    return {};
  }
};

// Apply custom order to blog posts
const applyBlogOrder = (posts) => {
  const orderMap = getBlogOrder();
  if (Object.keys(orderMap).length === 0) {
    return posts;
  }

  return posts.map(post => {
    if (orderMap[post.id] !== undefined) {
      return { ...post, order: orderMap[post.id] };
    }
    return post;
  });
};

export const blogPosts = applyBlogOrder([...defaultBlogPosts, ...getLocalBlogPosts()]);

export const getAllBlogPosts = () => {
  return applyBlogOrder([...defaultBlogPosts, ...getLocalBlogPosts()]);
};

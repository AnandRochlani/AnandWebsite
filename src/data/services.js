// Services data structure
export const defaultServices = [
  // Graphic Design Services
  {
    id: 1,
    name: "Poster Design",
    description: "Professional poster design services for events, marketing campaigns, and promotional materials. Eye-catching designs that capture attention and communicate your message effectively.",
    category: "Graphic Design",
    featuredImage: "https://images.unsplash.com/photo-1561070791-2526d30994b5",
    features: [
      "Custom design concepts",
      "Multiple revisions",
      "Print-ready files",
      "Source files included"
    ],
    addOns: [
      { id: 1, name: "Rush Delivery (24-48 hours)", price: 50 },
      { id: 2, name: "Additional Concepts", price: 30 },
      { id: 3, name: "Social Media Adaptations", price: 25 }
    ],
    featured: true,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 2,
    name: "Flyer Design",
    description: "Creative flyer designs that stand out and drive action. Perfect for events, sales, and promotions.",
    category: "Graphic Design",
    featuredImage: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c",
    features: [
      "Multiple design options",
      "Print and digital formats",
      "Quick turnaround",
      "Professional quality"
    ],
    addOns: [
      { id: 1, name: "Rush Delivery", price: 40 },
      { id: 2, name: "Additional Formats", price: 20 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 3,
    name: "Ebook Design",
    description: "Beautiful ebook layouts and covers that enhance readability and engagement.",
    category: "Graphic Design",
    featuredImage: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e",
    features: [
      "Custom cover design",
      "Interior layout",
      "Multiple format support",
      "Professional typography"
    ],
    addOns: [
      { id: 1, name: "Interactive Elements", price: 100 },
      { id: 2, name: "Additional Chapters", price: 50 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 4,
    name: "Video Editing",
    description: "Professional video editing services for marketing videos, social media content, and promotional materials.",
    category: "Graphic Design",
    featuredImage: "https://images.unsplash.com/photo-1533750349088-cd871a92f2a6",
    features: [
      "Color correction",
      "Motion graphics",
      "Sound design",
      "Multiple format exports"
    ],
    addOns: [
      { id: 1, name: "Rush Delivery", price: 100 },
      { id: 2, name: "Additional Revisions", price: 50 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 5,
    name: "Image Editing",
    description: "Professional image retouching, color correction, and enhancement services.",
    category: "Graphic Design",
    featuredImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
    features: [
      "Photo retouching",
      "Color correction",
      "Background removal",
      "Product photography editing"
    ],
    addOns: [
      { id: 1, name: "Bulk Editing", price: 30 },
      { id: 2, name: "Advanced Retouching", price: 75 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 6,
    name: "Clip Art Design",
    description: "Custom clip art and illustrations tailored to your brand and needs.",
    category: "Graphic Design",
    featuredImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
    features: [
      "Custom illustrations",
      "Vector format",
      "Multiple style options",
      "Commercial license"
    ],
    addOns: [
      { id: 1, name: "Additional Styles", price: 40 },
      { id: 2, name: "Extended License", price: 50 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 7,
    name: "Social Media Banner",
    description: "Eye-catching social media banners for all platforms - Facebook, Instagram, Twitter, LinkedIn, and more.",
    category: "Graphic Design",
    featuredImage: "https://images.unsplash.com/photo-1611162617474-5b21e879e113",
    features: [
      "All platform sizes",
      "Brand consistency",
      "Engaging designs",
      "Quick delivery"
    ],
    addOns: [
      { id: 1, name: "Animated Versions", price: 60 },
      { id: 2, name: "Multiple Variations", price: 30 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 8,
    name: "Website Banner",
    description: "Professional website banners and headers that enhance your site's visual appeal.",
    category: "Graphic Design",
    featuredImage: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d",
    features: [
      "Responsive designs",
      "Optimized file sizes",
      "Multiple variations",
      "SEO-friendly"
    ],
    addOns: [
      { id: 1, name: "Animated Versions", price: 80 },
      { id: 2, name: "Additional Sizes", price: 25 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  
  // Website Design Services
  {
    id: 9,
    name: "E-mail Template",
    description: "Professional email templates that are responsive, mobile-friendly, and compatible with all major email clients.",
    category: "Website Design",
    featuredImage: "https://images.unsplash.com/photo-1596524430615-b46475ddff6e",
    features: [
      "Responsive design",
      "Email client compatibility",
      "Brand customization",
      "A/B testing ready"
    ],
    addOns: [
      { id: 1, name: "Multiple Variations", price: 40 },
      { id: 2, name: "Interactive Elements", price: 60 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 10,
    name: "Newsletter Design",
    description: "Engaging newsletter designs that improve open rates and reader engagement.",
    category: "Website Design",
    featuredImage: "https://images.unsplash.com/photo-1586953208448-b95a79798f07",
    features: [
      "Mobile-responsive",
      "Brand consistency",
      "Easy to edit",
      "Analytics integration"
    ],
    addOns: [
      { id: 1, name: "Monthly Templates", price: 150 },
      { id: 2, name: "Custom Sections", price: 50 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 11,
    name: "Landing Page Design",
    description: "High-converting landing pages designed to maximize conversions and user engagement.",
    category: "Website Design",
    featuredImage: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d",
    features: [
      "Conversion-focused",
      "Mobile-responsive",
      "Fast loading",
      "A/B testing ready"
    ],
    addOns: [
      { id: 1, name: "Multiple Variations", price: 100 },
      { id: 2, name: "Advanced Animations", price: 150 }
    ],
    featured: true,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 12,
    name: "Website Page Design in WordPress",
    description: "Custom WordPress page designs that are beautiful, functional, and easy to manage.",
    category: "Website Design",
    featuredImage: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d",
    features: [
      "WordPress compatible",
      "Custom themes",
      "Plugin integration",
      "SEO optimized"
    ],
    addOns: [
      { id: 1, name: "Additional Pages", price: 80 },
      { id: 2, name: "E-commerce Integration", price: 200 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 13,
    name: "Website Page Design in Wix",
    description: "Professional Wix website designs tailored to your business needs.",
    category: "Website Design",
    featuredImage: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d",
    features: [
      "Wix optimized",
      "Drag-and-drop ready",
      "Mobile responsive",
      "SEO friendly"
    ],
    addOns: [
      { id: 1, name: "Additional Pages", price: 70 },
      { id: 2, name: "E-commerce Setup", price: 180 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 14,
    name: "Website Page Design in Weebly",
    description: "Custom Weebly website designs that are professional and easy to maintain.",
    category: "Website Design",
    featuredImage: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d",
    features: [
      "Weebly compatible",
      "Custom layouts",
      "Mobile responsive",
      "Easy editing"
    ],
    addOns: [
      { id: 1, name: "Additional Pages", price: 60 },
      { id: 2, name: "Blog Setup", price: 50 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 15,
    name: "Website Page Design in Shopify",
    description: "E-commerce focused Shopify store designs that drive sales and conversions.",
    category: "Website Design",
    featuredImage: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d",
    features: [
      "Shopify optimized",
      "Product showcase",
      "Checkout optimization",
      "Mobile commerce ready"
    ],
    addOns: [
      { id: 1, name: "Product Photography", price: 150 },
      { id: 2, name: "Advanced Features", price: 200 }
    ],
    featured: true,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 16,
    name: "Website Page Design in Magento",
    description: "Enterprise-level Magento store designs for large e-commerce operations.",
    category: "Website Design",
    featuredImage: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d",
    features: [
      "Magento compatible",
      "Scalable design",
      "Advanced features",
      "Performance optimized"
    ],
    addOns: [
      { id: 1, name: "Custom Modules", price: 300 },
      { id: 2, name: "Multi-store Setup", price: 400 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  
  // Web Development Services
  {
    id: 17,
    name: "Custom Website - React Frontend + NodeJS Backend",
    description: "Full-stack web applications built with React frontend and Node.js backend. Scalable, modern, and performant.",
    category: "Web Development",
    featuredImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    features: [
      "React.js frontend",
      "Node.js backend",
      "RESTful APIs",
      "Database integration"
    ],
    addOns: [
      { id: 1, name: "Admin Dashboard", price: 500 },
      { id: 2, name: "Payment Integration", price: 300 },
      { id: 3, name: "Third-party APIs", price: 200 }
    ],
    featured: true,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 18,
    name: "Custom Website - React Frontend + Java Backend",
    description: "Enterprise-grade web applications with React frontend and Java backend for maximum reliability and scalability.",
    category: "Web Development",
    featuredImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    features: [
      "React.js frontend",
      "Java Spring Boot",
      "Enterprise architecture",
      "High performance"
    ],
    addOns: [
      { id: 1, name: "Microservices Architecture", price: 800 },
      { id: 2, name: "Advanced Security", price: 400 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 19,
    name: "Website Issue Solved",
    description: "Expert troubleshooting and fixing of website issues, bugs, and performance problems.",
    category: "Web Development",
    featuredImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
    features: [
      "Bug fixing",
      "Performance optimization",
      "Security updates",
      "Code refactoring"
    ],
    addOns: [
      { id: 1, name: "Priority Support", price: 100 },
      { id: 2, name: "Ongoing Maintenance", price: 200 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 20,
    name: "Page Speed Issue Solved",
    description: "Optimize your website's loading speed for better user experience and SEO rankings.",
    category: "Web Development",
    featuredImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
    features: [
      "Performance audit",
      "Code optimization",
      "Image optimization",
      "CDN setup"
    ],
    addOns: [
      { id: 1, name: "Advanced Optimization", price: 150 },
      { id: 2, name: "Ongoing Monitoring", price: 100 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 21,
    name: "Contact Us Form Creation",
    description: "Custom contact forms with spam protection, email notifications, and database storage.",
    category: "Web Development",
    featuredImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
    features: [
      "Spam protection",
      "Email notifications",
      "Database storage",
      "Custom validation"
    ],
    addOns: [
      { id: 1, name: "CRM Integration", price: 150 },
      { id: 2, name: "Advanced Fields", price: 50 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 22,
    name: "Blog Page Creation",
    description: "Custom blog pages with CMS integration, SEO optimization, and social sharing features.",
    category: "Web Development",
    featuredImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643",
    features: [
      "CMS integration",
      "SEO optimized",
      "Social sharing",
      "Comment system"
    ],
    addOns: [
      { id: 1, name: "Advanced Features", price: 200 },
      { id: 2, name: "Email Newsletter", price: 150 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 23,
    name: "Make Website SEO Friendly",
    description: "Comprehensive SEO optimization to improve your website's search engine rankings and visibility.",
    category: "Web Development",
    featuredImage: "https://images.unsplash.com/photo-1432888622747-4eb9a8f2d1c6",
    features: [
      "On-page SEO",
      "Meta tags optimization",
      "Schema markup",
      "Sitemap creation"
    ],
    addOns: [
      { id: 1, name: "Technical SEO Audit", price: 200 },
      { id: 2, name: "Content Optimization", price: 150 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 24,
    name: "Server Issue Solve",
    description: "Expert server troubleshooting, configuration, and optimization services.",
    category: "Web Development",
    featuredImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
    features: [
      "Server configuration",
      "Performance tuning",
      "Security hardening",
      "Backup setup"
    ],
    addOns: [
      { id: 1, name: "24/7 Monitoring", price: 300 },
      { id: 2, name: "Disaster Recovery", price: 400 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  
  // Digital Marketing Services
  {
    id: 25,
    name: "SEO On Page and SEO Off Page",
    description: "Comprehensive SEO services including both on-page and off-page optimization strategies.",
    category: "Digital Marketing",
    featuredImage: "https://images.unsplash.com/photo-1432888622747-4eb9a8f2d1c6",
    features: [
      "On-page optimization",
      "Off-page link building",
      "Keyword research",
      "Competitor analysis"
    ],
    addOns: [
      { id: 1, name: "Monthly Reports", price: 100 },
      { id: 2, name: "Content Creation", price: 200 }
    ],
    featured: true,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 26,
    name: "Social Media Marketing",
    description: "Strategic social media marketing to grow your audience and engagement across all platforms.",
    category: "Digital Marketing",
    featuredImage: "https://images.unsplash.com/photo-1611162617474-5b21e879e113",
    features: [
      "Content strategy",
      "Post scheduling",
      "Community management",
      "Analytics reporting"
    ],
    addOns: [
      { id: 1, name: "Content Creation", price: 150 },
      { id: 2, name: "Influencer Outreach", price: 200 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 27,
    name: "Paid Marketing (FB, Instagram, Google, LinkedIn)",
    description: "Expert paid advertising campaigns across Facebook, Instagram, Google, and LinkedIn to maximize ROI.",
    category: "Digital Marketing",
    featuredImage: "https://images.unsplash.com/photo-1611162617474-5b21e879e113",
    features: [
      "Campaign setup",
      "Ad creation",
      "A/B testing",
      "Performance optimization"
    ],
    addOns: [
      { id: 1, name: "Advanced Targeting", price: 100 },
      { id: 2, name: "Retargeting Campaigns", price: 150 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 28,
    name: "Content Writing",
    description: "High-quality content writing services for blogs, websites, and marketing materials.",
    category: "Digital Marketing",
    featuredImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a",
    features: [
      "SEO optimized",
      "Original content",
      "Multiple revisions",
      "Fast turnaround"
    ],
    addOns: [
      { id: 1, name: "Rush Delivery", price: 50 },
      { id: 2, name: "Additional Research", price: 75 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 29,
    name: "WhatsApp Marketing",
    description: "Strategic WhatsApp marketing campaigns to engage customers and drive conversions.",
    category: "Digital Marketing",
    featuredImage: "https://images.unsplash.com/photo-1611162617474-5b21e879e113",
    features: [
      "Campaign setup",
      "Message automation",
      "Broadcast lists",
      "Analytics tracking"
    ],
    addOns: [
      { id: 1, name: "Advanced Automation", price: 100 },
      { id: 2, name: "CRM Integration", price: 150 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  
  // Mobile App Development Services
  {
    id: 30,
    name: "App Development for iOS",
    description: "Native iOS app development using Swift and modern iOS frameworks for optimal performance.",
    category: "Mobile App Development",
    featuredImage: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c",
    features: [
      "Swift development",
      "App Store optimization",
      "UI/UX design",
      "Testing & deployment"
    ],
    addOns: [
      { id: 1, name: "iPad Optimization", price: 200 },
      { id: 2, name: "Apple Watch App", price: 300 }
    ],
    featured: true,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 31,
    name: "App Development for Android",
    description: "Native Android app development using Kotlin/Java for seamless performance on all Android devices.",
    category: "Mobile App Development",
    featuredImage: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c",
    features: [
      "Kotlin/Java development",
      "Material Design",
      "Play Store optimization",
      "Multi-device support"
    ],
    addOns: [
      { id: 1, name: "Wear OS App", price: 250 },
      { id: 2, name: "Android Auto", price: 200 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 32,
    name: "Development of Bots",
    description: "Custom chatbot and bot development for customer service, automation, and engagement.",
    category: "Mobile App Development",
    featuredImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e",
    features: [
      "AI-powered bots",
      "Multi-platform support",
      "Natural language processing",
      "Analytics integration"
    ],
    addOns: [
      { id: 1, name: "Advanced AI Features", price: 300 },
      { id: 2, name: "Voice Integration", price: 250 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 33,
    name: "Development of React Native Apps",
    description: "Cross-platform mobile app development using React Native for iOS and Android.",
    category: "Mobile App Development",
    featuredImage: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c",
    features: [
      "Cross-platform",
      "Single codebase",
      "Native performance",
      "Fast development"
    ],
    addOns: [
      { id: 1, name: "Native Modules", price: 200 },
      { id: 2, name: "Advanced Animations", price: 150 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 34,
    name: "App Development for iPad",
    description: "Optimized iPad app development with support for Apple Pencil, multitasking, and iPad-specific features.",
    category: "Mobile App Development",
    featuredImage: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0",
    features: [
      "iPad optimization",
      "Apple Pencil support",
      "Multitasking support",
      "Large screen layouts"
    ],
    addOns: [
      { id: 1, name: "Apple Pencil Features", price: 150 },
      { id: 2, name: "Split View Support", price: 100 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 35,
    name: "App iBeacon Development",
    description: "iBeacon app development for location-based services and proximity marketing.",
    category: "Mobile App Development",
    featuredImage: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c",
    features: [
      "Beacon integration",
      "Location services",
      "Push notifications",
      "Analytics tracking"
    ],
    addOns: [
      { id: 1, name: "Advanced Analytics", price: 100 },
      { id: 2, name: "Multi-beacon Support", price: 150 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 36,
    name: "Development of Flutter Apps",
    description: "Cross-platform mobile app development using Flutter for beautiful, fast, and native apps.",
    category: "Mobile App Development",
    featuredImage: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c",
    features: [
      "Cross-platform",
      "Beautiful UI",
      "High performance",
      "Hot reload"
    ],
    addOns: [
      { id: 1, name: "Custom Widgets", price: 150 },
      { id: 2, name: "Platform Channels", price: 200 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 37,
    name: "IoT App Development",
    description: "IoT application development for connected devices and smart home solutions.",
    category: "Mobile App Development",
    featuredImage: "https://images.unsplash.com/photo-1518444065439-e933c06ce9cd",
    features: [
      "Device connectivity",
      "Real-time data",
      "Cloud integration",
      "Security features"
    ],
    addOns: [
      { id: 1, name: "Advanced Security", price: 200 },
      { id: 2, name: "Cloud Platform", price: 250 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 38,
    name: "App Development in Swift",
    description: "Native iOS app development using Swift programming language for modern iOS apps.",
    category: "Mobile App Development",
    featuredImage: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c",
    features: [
      "Swift 5+",
      "SwiftUI support",
      "Modern APIs",
      "Performance optimized"
    ],
    addOns: [
      { id: 1, name: "SwiftUI Implementation", price: 200 },
      { id: 2, name: "Combine Framework", price: 150 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  },
  {
    id: 39,
    name: "Android Auto Apps",
    description: "Android Auto app development for in-car entertainment and navigation systems.",
    category: "Mobile App Development",
    featuredImage: "https://images.unsplash.com/photo-1502877338535-766e1452684a",
    features: [
      "Android Auto compatible",
      "Voice commands",
      "Car-friendly UI",
      "Safety optimized"
    ],
    addOns: [
      { id: 1, name: "Advanced Voice Features", price: 150 },
      { id: 2, name: "Media Integration", price: 100 }
    ],
    featured: false,
    membershipPrice: null,
    generalPrice: null
  }
];

// Helper to get local services
const getLocalServices = () => {
  try {
    const local = localStorage.getItem('customServices');
    return local ? JSON.parse(local) : [];
  } catch (e) {
    return [];
  }
};

const getServiceOverrides = () => {
  try {
    const overrides = localStorage.getItem('serviceOverrides');
    return overrides ? JSON.parse(overrides) : {};
  } catch (e) {
    return {};
  }
};

const getDeletedServiceIds = () => {
  try {
    const deleted = localStorage.getItem('deletedServiceIds');
    return deleted ? JSON.parse(deleted) : [];
  } catch (e) {
    return [];
  }
};

const applyServiceEdits = (servicesList) => {
  const overrides = getServiceOverrides();
  const deletedIds = new Set(getDeletedServiceIds());

  return servicesList
    .filter((service) => !deletedIds.has(service.id))
    .map((service) => (overrides[service.id] ? { ...service, ...overrides[service.id] } : service));
};

// Export combined for backward compatibility
export const services = applyServiceEdits([...defaultServices, ...getLocalServices()]);

// Export function for fresh data
export const getAllServices = () => {
  return applyServiceEdits([...defaultServices, ...getLocalServices()]);
};

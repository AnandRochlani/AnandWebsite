import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Star, Sparkles } from 'lucide-react';
import { getAllServices } from '@/data/services';
import SaveButton from '@/components/SaveButton';
import SEOHead from '@/components/SEOHead';
import SchemaCode from '@/components/SchemaCode';
import { optimizeImageUrl, generateImageSrcset } from '@/lib/utils';

const ServicesPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleServices, setVisibleServices] = useState(8);

  const allServices = useMemo(() => getAllServices(), []);

  const categories = useMemo(() => [
    'All',
    'Graphic Design',
    'Website Design',
    'Web Development',
    'Digital Marketing',
    'Mobile App Development'
  ], []);

  const filteredServices = useMemo(() => {
    return allServices.filter(service => {
      const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           service.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, allServices]);

  const featuredServices = useMemo(() => allServices.filter(service => service.featured), [allServices]);
  
  const observerRef = useRef(null);

  useEffect(() => {
    if (featuredServices.length > 0) {
      featuredServices.slice(0, 2).forEach(service => {
        if (service.featuredImage) {
          const optimizedImage = optimizeImageUrl(service.featuredImage, 350, 30);
          const existingPreload = document.querySelector(`link[rel="preload"][href="${optimizedImage}"]`);
          if (!existingPreload) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = optimizedImage;
            link.fetchPriority = 'high';
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
          }
        }
      });
    }
  }, [featuredServices]);

  useEffect(() => {
    const images = document.querySelectorAll('img[data-lazy]');
    
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.lazy;
            img.removeAttribute('data-lazy');
            observerRef.current.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px'
      });

      images.forEach((img) => observerRef.current.observe(img));
    } else {
      images.forEach((img) => {
        img.src = img.dataset.lazy;
        img.removeAttribute('data-lazy');
      });
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [filteredServices]);

  // Get image alt tags from localStorage
  const getImageAlt = (imageUrl, defaultAlt) => {
    try {
      const imageAltTags = localStorage.getItem('imageAltTags');
      if (imageAltTags) {
        const tags = JSON.parse(imageAltTags);
        return tags[imageUrl] || defaultAlt;
      }
    } catch (e) {
      // Ignore errors
    }
    return defaultAlt;
  };

  return (
    <>
      <SEOHead 
        title="Professional Services - Graphic Design, Web Development & More"
        description="Browse our comprehensive range of professional services including graphic design, website design, web development, digital marketing, and mobile app development."
        keywords="graphic design services, website design, web development, digital marketing, mobile app development, poster design, flyer design, SEO services"
        canonical="https://www.ritvikwebsite.com/services"
      />
      
      <SchemaCode
        type="Service"
        name="Professional Services"
        description="Comprehensive range of professional services including graphic design, website design, web development, digital marketing, and mobile app development"
        url="https://www.ritvikwebsite.com/services"
        image="https://www.ritvikwebsite.com/og-image.jpg"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with H1 in content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Explore Our <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Services</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Professional services to help your business grow and succeed
            </p>
          </motion.div>

          {/* Featured Services */}
          {featuredServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Star className="w-6 h-6 text-yellow-400 mr-2" />
                Featured Services
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredServices.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Link to={`/services/${service.id}`}>
                      <div className="group relative h-full rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-slate-900/40 backdrop-blur-sm border border-purple-500/30 hover:border-purple-400/60 shadow-lg hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300">
                        <div className="absolute top-4 left-4 z-10 flex gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-medium shadow-md">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </span>
                        </div>
                        
                        <div className="absolute top-4 right-4 z-10">
                          <SaveButton 
                            courseId={service.id} 
                            className="bg-black/30 backdrop-blur-md hover:bg-black/50 border border-white/10"
                          />
                        </div>

                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={optimizeImageUrl(service.featuredImage, 350, 30)}
                            srcSet={generateImageSrcset(service.featuredImage)}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            alt={getImageAlt(service.featuredImage, service.name)}
                            fetchPriority={index < 3 ? "high" : "auto"}
                            loading={index < 3 ? "eager" : "lazy"}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
                        </div>
                        <div className="p-6">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 bg-purple-500/20 text-purple-400">
                            {service.category}
                          </span>
                          <h3 className="text-xl font-bold text-white mb-3 transition-colors duration-300 line-clamp-2 group-hover:text-purple-400">
                            {service.name}
                          </h3>
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                            {service.description}
                          </p>
                          {service.addOns && service.addOns.length > 0 && (
                            <p className="text-purple-400 text-xs mb-2">
                              {service.addOns.length} add-on{service.addOns.length > 1 ? 's' : ''} available
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8 space-y-4"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-purple-400" />
              <span className="text-gray-300 font-medium">Category:</span>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Results Count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-6"
          >
            <p className="text-gray-400">
              Showing <span className="text-white font-medium">{filteredServices.length}</span> services
            </p>
          </motion.div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.slice(0, visibleServices).map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link to={`/services/${service.id}`}>
                  <div className="group h-full rounded-xl overflow-hidden bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        data-lazy={optimizeImageUrl(service.featuredImage, 250, 30)}
                        srcSet={generateImageSrcset(service.featuredImage)}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        alt={getImageAlt(service.featuredImage, service.name)}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                      
                      <span className="absolute top-4 left-4 px-3 py-1 rounded-full backdrop-blur-sm text-white text-xs font-medium bg-purple-500/80">
                        {service.category}
                      </span>
                      
                      <div className="absolute top-4 right-4 z-10">
                        <SaveButton 
                          courseId={service.id} 
                          className="bg-black/30 backdrop-blur-md hover:bg-black/50 border border-white/10"
                        />
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-3 transition-colors duration-300 line-clamp-2 group-hover:text-purple-400">
                        {service.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {service.description}
                      </p>
                      {service.addOns && service.addOns.length > 0 && (
                        <p className="text-purple-400 text-xs">
                          {service.addOns.length} add-on{service.addOns.length > 1 ? 's' : ''} available
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Load More Button */}
          {filteredServices.length > visibleServices && (
            <div className="text-center mt-12">
              <button
                onClick={() => setVisibleServices(prev => Math.min(prev + 8, filteredServices.length))}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Load More Services
              </button>
            </div>
          )}

          {/* No Results */}
          {filteredServices.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center py-16"
            >
              <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No services found</h3>
              <p className="text-gray-400">Try adjusting your filters or search query</p>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default ServicesPage;

import React, { useMemo, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, ShoppingCart, Plus, X } from 'lucide-react';
import { getAllServices } from '@/data/services';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SaveButton from '@/components/SaveButton';
import SEOHead from '@/components/SEOHead';
import SchemaCode from '@/components/SchemaCode';
import GetQuoteForm from '@/components/GetQuoteForm';
import { useCart } from '@/context/CartContext';
import { optimizeImageUrl, generateImageSrcset } from '@/lib/utils';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart, isInCart, removeFromCart, cartItems } = useCart();
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  
  const allServices = useMemo(() => getAllServices(), []);
  const service = useMemo(() => {
    if (!id) return null;
    return allServices.find(s => s.id === parseInt(id));
  }, [allServices, id]);

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

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Service Not Found</h1>
          <Link to="/services">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
              View All Services
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = (addOn) => {
    addToCart(service.id, addOn);
  };

  const handleRemoveFromCart = (addOnId) => {
    const cartItem = cartItems.find(item => item.serviceId === service.id && item.addOnId === addOnId);
    if (cartItem) {
      removeFromCart(cartItem.id);
    }
  };

  const relatedServices = useMemo(() => {
    if (!service) return [];
    return allServices
      .filter(s => s.category === service.category && s.id !== service.id)
      .slice(0, 3);
  }, [allServices, service]);

  useEffect(() => {
    if (service?.featuredImage) {
      const optimizedImage = optimizeImageUrl(service.featuredImage, 600, 35);
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
  }, [service]);

  return (
    <>
      <SEOHead 
        title={`${service.name} - ${service.category} Service`}
        description={service.description}
        image={service.featuredImage}
        keywords={`${service.name}, ${service.category}, professional services`}
        canonical={`https://www.ritvikwebsite.com/services/${service.id}`}
        type="Service"
      />

      <SchemaCode
        type="Service"
        name={service.name}
        description={service.description}
        url={`https://www.ritvikwebsite.com/services/${service.id}`}
        image={service.featuredImage}
        serviceType={service.category}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pt-24 pb-16">
        {/* Back Button */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Button
              onClick={() => navigate('/services', { replace: true })}
              variant="outline"
              className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Services
            </Button>
          </motion.div>
        </div>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Service Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-2"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-4 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400">
                  {service.category}
                </span>
              </div>
              
              {/* H1 in content */}
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
                {service.name}
              </h1>
              <p className="text-xl text-gray-300 mb-6 leading-relaxed">{service.description}</p>

              <div className="relative h-96 rounded-2xl overflow-hidden mb-8 shadow-2xl border border-white/10 group">
                <img
                  src={optimizeImageUrl(service.featuredImage, 600, 35)}
                  srcSet={generateImageSrcset(service.featuredImage)}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                  alt={getImageAlt(service.featuredImage, service.name)}
                  fetchPriority="high"
                  loading="eager"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
              </div>
            </motion.div>

            {/* Get Quote Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-24 rounded-2xl backdrop-blur-sm border p-6 shadow-2xl bg-gradient-to-br from-white/10 to-white/5 border-white/20">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Get a Custom Quote</h3>
                  <p className="text-gray-400 text-sm">Contact us for pricing details</p>
                </div>

                <Button
                  onClick={() => setShowQuoteForm(!showQuoteForm)}
                  className="w-full py-6 text-lg rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 mb-4 text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {showQuoteForm ? 'Close Form' : 'Get Quote'}
                </Button>

                {showQuoteForm && (
                  <div className="mt-4">
                    <GetQuoteForm 
                      serviceId={service.id}
                      serviceName={service.name}
                      onClose={() => setShowQuoteForm(false)}
                    />
                  </div>
                )}

                <div className="flex justify-center mb-6 mt-6">
                  <SaveButton 
                    courseId={service.id} 
                    showText={true}
                    className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Service Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Features */}
              {service.features && service.features.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="rounded-2xl backdrop-blur-sm border p-8 bg-white/5 border-white/10"
                >
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <CheckCircle className="w-6 h-6 mr-2 text-purple-400" />
                    What's Included
                  </h2>
                  <div className="grid md:grid-cols-1 gap-4">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start">
                        <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-green-400" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Add-ons Section */}
              {service.addOns && service.addOns.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 p-8"
                >
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <ShoppingCart className="w-6 h-6 mr-2 text-purple-400" />
                    Available Add-ons
                  </h2>
                  <div className="space-y-4">
                    {service.addOns.map((addOn) => {
                      const inCart = isInCart(service.id, addOn.id);
                      return (
                        <div
                          key={addOn.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                        >
                          <div className="flex-1">
                            <h3 className="text-white font-medium mb-1">{addOn.name}</h3>
                            <p className="text-purple-400 font-bold">${addOn.price}</p>
                          </div>
                          {inCart ? (
                            <Button
                              onClick={() => handleRemoveFromCart(addOn.id)}
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleAddToCart(addOn)}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add to Cart
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Related Services */}
            <div className="lg:col-span-1">
              {relatedServices.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 p-6"
                >
                  <h2 className="text-xl font-bold text-white mb-6">Related Services</h2>
                  <div className="space-y-4">
                    {relatedServices.map((relatedService) => (
                      <Link key={relatedService.id} to={`/services/${relatedService.id}`}>
                        <div className="group rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 transition-all duration-300">
                          <div className="relative h-32 overflow-hidden">
                            <img
                              src={optimizeImageUrl(relatedService.featuredImage, 200, 30)}
                              srcSet={generateImageSrcset(relatedService.featuredImage)}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                              alt={getImageAlt(relatedService.featuredImage, relatedService.name)}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute top-2 right-2 z-10">
                              <SaveButton 
                                courseId={relatedService.id} 
                                className="w-8 h-8 p-1.5 bg-black/30 backdrop-blur-sm hover:bg-black/50"
                              />
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="text-white font-medium mb-2 group-hover:text-purple-400 transition-colors duration-300 line-clamp-2">
                              {relatedService.name}
                            </h3>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceDetail;

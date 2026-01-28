import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/context/CartContext';
import { Mail, Phone, User, MessageSquare, ShoppingCart } from 'lucide-react';

const GetQuoteForm = ({ serviceId, serviceName, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    serviceName: serviceName || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { cartItems, getCartTotal, clearCart } = useCart();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Get cart items details
    const cartDetails = cartItems.map(item => ({
      addOn: item.addOnName,
      price: item.addOnPrice
    }));

    // In a real application, you would send this to your backend
    // For now, we'll store it in localStorage and show a success message
    try {
      const inquiries = JSON.parse(localStorage.getItem('inquiries') || '[]');
      const newInquiry = {
        id: Date.now(),
        ...formData,
        cartItems: cartDetails,
        cartTotal: getCartTotal(),
        serviceId,
        timestamp: new Date().toISOString()
      };
      inquiries.push(newInquiry);
      localStorage.setItem('inquiries', JSON.stringify(inquiries));

      toast({
        title: "Quote Request Submitted",
        description: "We'll contact you soon with a custom quote. Thank you!",
        className: "bg-green-600 border-green-700 text-white"
      });

      // Clear form and cart
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        serviceName: serviceName || ''
      });
      clearCart();
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl p-6 md:p-8 border border-white/10">
      <h2 className="text-2xl font-bold text-white mb-6">Get a Quote</h2>
      
      {cartItems.length > 0 && (
        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center mb-3">
            <ShoppingCart className="w-5 h-5 text-purple-400 mr-2" />
            <h3 className="text-white font-medium">Selected Add-ons</h3>
          </div>
          <div className="space-y-2">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm text-gray-300">
                <span>{item.addOnName}</span>
                <span className="text-purple-400">${item.addOnPrice}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-white font-bold">
            <span>Total:</span>
            <span className="text-purple-400">${getCartTotal()}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Phone className="w-4 h-4 inline mr-2" />
            Phone Number *
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Project Details *
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            placeholder="Tell us about your project requirements..."
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 text-lg"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Quote Request'}
        </Button>
      </form>

      <p className="mt-4 text-sm text-gray-400 text-center">
        We'll review your request and contact you within 24-48 hours with a custom quote.
      </p>
    </div>
  );
};

export default GetQuoteForm;

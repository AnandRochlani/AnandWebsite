import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { User, Mail, Phone, Crown } from 'lucide-react';

const MembershipSignup = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Store membership signups in localStorage
      const signups = JSON.parse(localStorage.getItem('membershipSignups') || '[]');
      const newSignup = {
        ...formData,
        timestamp: new Date().toISOString()
      };
      signups.push(newSignup);
      localStorage.setItem('membershipSignups', JSON.stringify(signups));

      toast({
        title: "Membership Request Submitted!",
        description: "We'll contact you soon with membership details and pricing.",
        className: "bg-green-600 border-green-700 text-white"
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        company: ''
      });

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
      <div className="flex items-center mb-6">
        <Crown className="w-8 h-8 text-yellow-400 mr-3" />
        <h2 className="text-2xl font-bold text-white">Become a Member</h2>
      </div>
      <p className="text-gray-300 mb-6">
        Join our membership program to get exclusive pricing, priority support, and special offers on all our services.
      </p>

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
            Company Name (Optional)
          </label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            placeholder="Company Name"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Membership Request'}
          </Button>
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      <p className="mt-4 text-sm text-gray-400 text-center">
        We'll review your request and contact you within 24-48 hours with membership details.
      </p>
    </div>
  );
};

export default MembershipSignup;

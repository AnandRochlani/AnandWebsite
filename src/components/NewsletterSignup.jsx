import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Mail } from 'lucide-react';

const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Store newsletter signups in localStorage
      const signups = JSON.parse(localStorage.getItem('newsletterSignups') || '[]');
      const newSignup = {
        email,
        timestamp: new Date().toISOString()
      };
      signups.push(newSignup);
      localStorage.setItem('newsletterSignups', JSON.stringify(signups));

      toast({
        title: "Successfully Subscribed!",
        description: "Thank you for subscribing to our newsletter.",
        className: "bg-green-600 border-green-700 text-white"
      });

      setEmail('');
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error subscribing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <div className="flex-1 relative">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email"
          className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3"
      >
        {isSubmitting ? 'Subscribing...' : 'Subscribe'}
      </Button>
    </form>
  );
};

export default NewsletterSignup;

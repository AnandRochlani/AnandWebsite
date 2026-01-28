import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Github, Twitter, Linkedin, Mail, Youtube } from 'lucide-react';
import NewsletterSignup from '@/components/NewsletterSignup';

const Footer = () => {

  const socialLinks = [
    { icon: Youtube, href: 'https://www.youtube.com/@anandrochlani5226', label: 'YouTube', target: '_blank', rel: 'noopener noreferrer' },
    { icon: Linkedin, href: 'https://in.linkedin.com/in/anand-rochlani', label: 'LinkedIn', target: '_blank', rel: 'noopener noreferrer' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Mail, href: '#', label: 'Email' }
  ];

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: 'Services', path: '/services' },
    { name: 'About', path: '#' }
  ];

  return (
    <footer className="bg-slate-900 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AnandRochlani
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Professional services for graphic design, web development, digital marketing, and mobile app development.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-purple-400 transition-colors duration-300 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Connect</h3>
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target={social.target}
                  rel={social.rel}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-purple-400 transition-all duration-300 hover:scale-110"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-semibold mb-4">Newsletter</h3>
            <NewsletterSignup />
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/10">
          <p className="text-center text-gray-400 text-sm">
            © 2026 RitvikWebsite. All rights reserved. Built with React and TailwindCSS.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
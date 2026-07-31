import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Github, Twitter, Linkedin, Mail, Youtube } from 'lucide-react';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { sanitizeHref, sanitizePath } from '@/lib/safeUrl';

// Map of icon name (as stored in DB) → lucide component. Keep this list in
// sync with the options offered in the admin Settings tab.
const ICON_MAP = {
  Youtube,
  Linkedin,
  Github,
  Twitter,
  Mail,
};

const FALLBACK_SOCIAL = [
  { icon: 'Youtube', href: 'https://www.youtube.com/@anandrochlani5226', label: 'YouTube', external: true },
  { icon: 'Linkedin', href: 'https://in.linkedin.com/in/anand-rochlani', label: 'LinkedIn', external: true },
  { icon: 'Github', href: '#', label: 'GitHub', external: false },
  { icon: 'Twitter', href: '#', label: 'Twitter', external: false },
  { icon: 'Mail', href: '#', label: 'Email', external: false },
];

const FALLBACK_QUICK_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'Courses', path: '/courses' },
  { name: 'Blog', path: '/blog' },
  { name: 'Jobs', path: '/jobs' },
  { name: 'Saved Items', path: '/saved-courses' },
];

const Footer = () => {
  const { get } = useSiteSettings();

  const brandName = get('footer.brand_name', 'AnandRochlani');
  const tagline = get(
    'footer.tagline',
    'Courses and blog posts on web development, design, data science, and system design.'
  );
  const copyright = get(
    'footer.copyright',
    '© 2026 AnandRochlani. All rights reserved. Built with React and TailwindCSS.'
  );
  const quickLinksRaw = get('footer.quick_links', FALLBACK_QUICK_LINKS);
  const socialLinksRaw = get('social.links', FALLBACK_SOCIAL);

  const quickLinks = Array.isArray(quickLinksRaw) ? quickLinksRaw : FALLBACK_QUICK_LINKS;
  const socialLinks = Array.isArray(socialLinksRaw) ? socialLinksRaw : FALLBACK_SOCIAL;

  return (
    <footer className="bg-ink border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-brand p-2 rounded-lg">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                {brandName}
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              {tagline}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path || link.name}>
                  <Link
                    to={sanitizePath(link.path, '/')}
                    className="text-slate-400 hover:text-white transition-colors duration-300 text-sm"
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
              {socialLinks.map((social) => {
                const Icon = ICON_MAP[social.icon] || Mail;
                const isExternal = Boolean(social.external);
                const safeHref = sanitizeHref(social.href, '#');
                return (
                  <a
                    key={social.label || social.href}
                    href={safeHref}
                    aria-label={social.label}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-lavender transition-all duration-300 hover:scale-110"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Featured course */}
          <div>
            <h3 className="text-white font-semibold mb-4">Top Course</h3>
            <a
              href="https://www.udemy.com/course/system-design-fundamental/?referralCode=4D123B9F202E6D906A73"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors duration-300"
            >
              <p className="text-white text-sm font-semibold leading-snug">
                System Design Fundamentals for Interviews
              </p>
              <p className="text-slate-400 text-xs mt-2">5.5 hours · 49 lectures · 4.8★ on Udemy</p>
              <span className="inline-block mt-3 text-lavender text-sm font-semibold">
                Start learning →
              </span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/10">
          <p className="text-center text-slate-400 text-sm">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

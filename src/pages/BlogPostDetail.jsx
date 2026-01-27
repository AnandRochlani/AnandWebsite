import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import { getAllBlogPosts } from '@/data/blogPosts';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SEOHead from '@/components/SEOHead';

const BlogPostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Memoize blog posts lookup to prevent unnecessary recalculations
  const allBlogPosts = useMemo(() => getAllBlogPosts(), []);
  const post = useMemo(() => {
    if (!id) return null;
    return allBlogPosts.find(p => p.id === parseInt(id));
  }, [allBlogPosts, id]);

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Post Not Found</h1>
          <Link to="/blog">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
              View All Articles
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Memoize related posts to prevent recalculation
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return allBlogPosts
      .filter(p => p.category === post.category && p.id !== post.id)
      .slice(0, 3);
  }, [allBlogPosts, post]);

  const handleShare = (platform) => {
    toast({
      title: `Sharing on ${platform}`,
      description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  return (
    <>
      <SEOHead 
        title={post.title}
        description={post.description}
        image={post.featuredImage}
        keywords={`${post.category}, ${post.title}, tech blog, programming tutorial, web development, ${post.author}`}
        canonical={`https://www.anandrochlani.com/blog/${post.id}`}
        type="article"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pt-24 pb-16">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Button
              onClick={() => navigate('/blog', { replace: true })}
              variant="outline"
              className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Articles
            </Button>
          </motion.div>

          {/* Featured Image */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative h-96 rounded-2xl overflow-hidden mb-8 shadow-2xl"
          >
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          </motion.div>

          {/* Post Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <span className="inline-block px-4 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium mb-4">
              {post.category}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-gray-400 mb-6">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(post.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {post.readTime}
              </span>
              <span>By {post.author}</span>
            </div>

            {/* Share Buttons */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm mr-2">Share:</span>
              <button
                onClick={() => handleShare('Facebook')}
                className="p-2 rounded-lg bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-all duration-300"
                aria-label="Share on Facebook"
              >
                <Facebook className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('Twitter')}
                className="p-2 rounded-lg bg-white/5 hover:bg-sky-500/20 text-gray-400 hover:text-sky-400 transition-all duration-300"
                aria-label="Share on Twitter"
              >
                <Twitter className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('LinkedIn')}
                className="p-2 rounded-lg bg-white/5 hover:bg-blue-600/20 text-gray-400 hover:text-blue-600 transition-all duration-300"
                aria-label="Share on LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('Link')}
                className="p-2 rounded-lg bg-white/5 hover:bg-purple-500/20 text-gray-400 hover:text-purple-400 transition-all duration-300"
                aria-label="Copy link"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Post Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="prose prose-invert prose-lg max-w-none mb-16 text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="border-t border-white/10 pt-12"
            >
              <h2 className="text-3xl font-bold text-white mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} to={`/blog/${relatedPost.id}`}>
                    <div className="group rounded-xl overflow-hidden bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={relatedPost.featuredImage}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors duration-300 line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {relatedPost.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </article>
      </div>
    </>
  );
};

export default BlogPostDetail;
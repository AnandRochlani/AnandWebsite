import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

/**
 * Optimize Unsplash image URLs for better performance
 * Uses Unsplash Source API with extremely aggressive optimization
 * @param {string} url - Original Unsplash image URL
 * @param {number} width - Desired image width in pixels (extremely reduced)
 * @param {number} quality - Image quality (1-100, default: 40 for maximum compression)
 * @returns {string} - Optimized image URL
 */
export function optimizeImageUrl(url, width = 400, quality = 30) {
	if (!url) return url;
	
	// If it's an Unsplash URL, use Unsplash Source API for optimization
	if (url.includes('unsplash.com')) {
		// Extract photo ID from URL (format: photo-{id} where id can include dashes and underscores)
		// Example: photo-1504983875-d3b163aba9e6
		const photoMatch = url.match(/photo-([a-zA-Z0-9_-]+)/);
		if (photoMatch && photoMatch[1]) {
			const photoId = photoMatch[1];
			// Use Unsplash Source API with extremely aggressive optimization
			// Format: https://images.unsplash.com/photo-{id}?w={width}&q={quality}&fm=webp&fit=crop
			// Using very small widths and lower quality for maximum compression
			// Default: 400px width, 30% quality for optimal size/quality balance
			return `https://images.unsplash.com/photo-${photoId}?w=${width}&q=${quality}&fm=webp&fit=crop`;
		}
		// Fallback: try to use existing URL with parameters
		const baseUrl = url.split('?')[0];
		return `${baseUrl}?w=${width}&q=${quality}&fm=webp&fit=crop`;
	}
	
	// For other URLs, return as-is
	return url;
}

/**
 * Generate responsive image srcset for Unsplash images
 * Uses extremely small sizes and lower quality for maximum compression
 * @param {string} url - Original Unsplash image URL
 * @returns {string} - srcset string with multiple sizes
 */
/**
 * Generate responsive image srcset for Unsplash images
 * Optimized for both mobile (small, low quality) and desktop (larger, better quality)
 * @param {string} url - Original Unsplash image URL
 * @param {boolean} isHero - Whether this is a hero image (needs more sizes)
 * @returns {string} - srcset string with multiple sizes
 */
export function generateImageSrcset(url, isHero = false) {
	if (!url || !url.includes('unsplash.com')) return undefined;
	
	// Extract photo ID (including dashes and underscores)
	const photoMatch = url.match(/photo-([a-zA-Z0-9_-]+)/);
	if (!photoMatch || !photoMatch[1]) return undefined;
	
	const photoId = photoMatch[1];
	
	// Hero images: wider range for better desktop quality
	// Regular images: smaller range for faster load
	if (isHero) {
		// Hero images: mobile (200, 400), tablet (800), desktop (1200, 1600)
		// Quality increases with size: mobile=30%, tablet=40%, desktop=50-60%
		const sizes = [
			{ w: 200, q: 30 },
			{ w: 400, q: 35 },
			{ w: 800, q: 40 },
			{ w: 1200, q: 50 },
			{ w: 1600, q: 60 }
		];
		return sizes.map(({ w, q }) => 
			`https://images.unsplash.com/photo-${photoId}?w=${w}&q=${q}&fm=webp&fit=crop ${w}w`
		).join(', ');
	} else {
		// Regular images: smaller sizes for faster load
		// Quality: 30% for mobile, 35% for larger (more aggressive compression)
		const sizes = [
			{ w: 200, q: 30 },
			{ w: 400, q: 35 },
			{ w: 600, q: 40 },
			{ w: 800, q: 45 }
		];
		return sizes.map(({ w, q }) => 
			`https://images.unsplash.com/photo-${photoId}?w=${w}&q=${q}&fm=webp&fit=crop ${w}w`
		).join(', ');
	}
}

/**
 * Highlight important keywords and phrases in blog descriptions
 * Makes descriptions more eye-catching by emphasizing key terms
 * @param {string} text - The description text
 * @returns {JSX.Element} - React element with highlighted text
 */
export function highlightDescription(text) {
	if (!text) return text;
	
	// Combined pattern for all keywords to highlight (case-insensitive)
	// Order matters: longer phrases first to avoid partial matches
	const combinedPattern = /\b(System Design|Load Balancing|Best Practices|Learn|Master|Discover|Explore|Understand|Build|Create|Design|Develop|Implement|Optimize|Improve|Latency|Performance|Scalability|Architecture|API|Framework|Algorithm|Database|Cache|CDN|Guide|Tutorial|Fundamentals|Tips|Tricks|Strategies|Patterns|Principles|Beginner|Advanced|Expert|Professional|Complete|Comprehensive|Essential|Critical|Key|Important)\b/gi;
	
	// Track which parts are already highlighted to avoid double-highlighting
	const parts = [];
	let lastIndex = 0;
	let keyCounter = 0;
	
	const matches = [...text.matchAll(combinedPattern)];
	
	if (matches.length === 0) {
		return text;
	}
	
	matches.forEach(match => {
		// Add text before match
		if (match.index > lastIndex) {
			parts.push(text.substring(lastIndex, match.index));
		}
		// Add highlighted match
		parts.push(
			<span key={`highlight-${keyCounter++}`} className="font-bold text-purple-300 group-hover:text-purple-200">
				{match[0]}
			</span>
		);
		lastIndex = match.index + match[0].length;
	});
	
	// Add remaining text
	if (lastIndex < text.length) {
		parts.push(text.substring(lastIndex));
	}
	
	return <>{parts}</>;
}
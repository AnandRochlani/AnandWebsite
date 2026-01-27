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
export function optimizeImageUrl(url, width = 500, quality = 40) {
	if (!url) return url;
	
	// If it's an Unsplash URL, use Unsplash Source API for optimization
	if (url.includes('unsplash.com')) {
		// Extract photo ID from URL (format: photo-{id})
		const photoMatch = url.match(/photo-([a-zA-Z0-9]+)/);
		if (photoMatch && photoMatch[1]) {
			const photoId = photoMatch[1];
			// Use Unsplash Source API with extremely aggressive optimization
			// Format: https://images.unsplash.com/photo-{id}?w={width}&q={quality}&fm=webp&fit=crop
			// Using very small widths and lower quality for maximum compression
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
export function generateImageSrcset(url) {
	if (!url || !url.includes('unsplash.com')) return undefined;
	
	// Extract photo ID
	const photoMatch = url.match(/photo-([a-zA-Z0-9]+)/);
	if (!photoMatch || !photoMatch[1]) return undefined;
	
	const photoId = photoMatch[1];
	// Use extremely small sizes for maximum compression: 150, 300, 450, 600
	const sizes = [150, 300, 450, 600];
	return sizes.map(size => `https://images.unsplash.com/photo-${photoId}?w=${size}&q=40&fm=webp&fit=crop ${size}w`).join(', ');
}
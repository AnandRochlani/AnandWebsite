import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

/**
 * Optimize Unsplash image URLs for better performance
 * Uses Unsplash Source API with very aggressive optimization
 * @param {string} url - Original Unsplash image URL
 * @param {number} width - Desired image width in pixels (aggressively reduced)
 * @param {number} quality - Image quality (1-100, default: 50 for maximum compression)
 * @returns {string} - Optimized image URL
 */
export function optimizeImageUrl(url, width = 600, quality = 50) {
	if (!url) return url;
	
	// If it's an Unsplash URL, use Unsplash Source API for optimization
	if (url.includes('unsplash.com')) {
		// Extract photo ID from URL (format: photo-{id})
		const photoMatch = url.match(/photo-([a-zA-Z0-9]+)/);
		if (photoMatch && photoMatch[1]) {
			const photoId = photoMatch[1];
			// Use Unsplash Source API with very aggressive optimization
			// Format: https://images.unsplash.com/photo-{id}?w={width}&q={quality}&fm=webp&fit=crop
			// Using smaller widths and lower quality for maximum compression
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
 * Uses very small sizes and lower quality for maximum compression
 * @param {string} url - Original Unsplash image URL
 * @returns {string} - srcset string with multiple sizes
 */
export function generateImageSrcset(url) {
	if (!url || !url.includes('unsplash.com')) return undefined;
	
	// Extract photo ID
	const photoMatch = url.match(/photo-([a-zA-Z0-9]+)/);
	if (!photoMatch || !photoMatch[1]) return undefined;
	
	const photoId = photoMatch[1];
	// Use very small sizes for maximum compression: 200, 400, 600, 800
	const sizes = [200, 400, 600, 800];
	return sizes.map(size => `https://images.unsplash.com/photo-${photoId}?w=${size}&q=50&fm=webp&fit=crop ${size}w`).join(', ');
}
/**
 * Centralized Image and Asset URL Resolver
 * 
 * Future Backend Integration:
 * When connecting to a backend, set VITE_BACKEND_URL or VITE_IMAGE_BASE_URL
 * in your .env file (e.g. VITE_BACKEND_URL=https://api.yourgym.com).
 * Any relative path stored in the database (e.g. "/uploads/trainers/photo.jpg")
 * will automatically resolve to the backend server URL.
 */

const BACKEND_IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || import.meta.env.VITE_BACKEND_URL || '';

export const ASSETS = {
  trainers: {
    alex: '/assets/images/trainers/alex-carter.jpg',
    sarah: '/assets/images/trainers/sarah-jenkins.jpg',
    vikram: '/assets/images/trainers/vikram-malhotra.jpg',
  },
  gym: {
    logo: '/assets/images/gym/gym-logo.jpg',
    floor: '/assets/images/gym/gym-floor.jpg',
    weights: '/assets/images/gym/gym-weights.jpg',
    cardio: '/assets/images/gym/gym-cardio.jpg',
  },
  placeholder: '/assets/images/placeholder.svg',
};

/**
 * Resolves an image path or URL.
 * Supports:
 * - Local static asset paths (e.g., "/assets/images/trainers/alex-carter.jpg")
 * - Future backend relative paths (e.g., "/uploads/trainers/alex.jpg" -> "https://api.../uploads/trainers/alex.jpg")
 * - Data URLs (e.g., "data:image/png;base64,...")
 * - Absolute external URLs (e.g., "https://...")
 * - Missing/null inputs (falls back to placeholder)
 *
 * @param {string} [pathOrUrl]
 * @returns {string} Fully resolved image URL
 */
export function getImageUrl(pathOrUrl) {
  if (!pathOrUrl) {
    return ASSETS.placeholder;
  }

  // Already a full URL or data URI
  if (
    pathOrUrl.startsWith('data:') ||
    pathOrUrl.startsWith('blob:') ||
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://')
  ) {
    return pathOrUrl;
  }

  // Relative path with backend configured
  if (BACKEND_IMAGE_BASE_URL) {
    const cleanBase = BACKEND_IMAGE_BASE_URL.replace(/\/+$/, '');
    const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${cleanBase}${cleanPath}`;
  }

  // Relative path serving from local assets
  return pathOrUrl;
}

export default getImageUrl;

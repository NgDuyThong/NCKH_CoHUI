/**
 * Utility functions for Cloudinary
 */

/**
 * Extract publicId from Cloudinary URL
 * Example: https://res.cloudinary.com/djh8j3ofk/image/upload/v1234567890/sample.jpg
 * Returns: v1234567890/sample
 * @param {string} url - Cloudinary URL
 * @returns {string} - publicId
 */
export const getPublicIdFromUrl = (url) => {
    if (!url) return '';
    
    try {
        // If not a URL, assume it's already a publicId
        if (!url.startsWith('http')) {
            return url;
        }
        
        // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{publicId}.{extension}
        // publicId có thể có dạng: v1234567890/abc123 hoặc folder/v1234567890/abc123
        
        const uploadIndex = url.indexOf('/image/upload/');
        if (uploadIndex === -1) {
            console.warn('[Cloudinary] Invalid URL format:', url);
            return url;
        }
        
        // Lấy phần sau /image/upload/
        const afterUpload = url.substring(uploadIndex + '/image/upload/'.length);
        
        // Bỏ extension (.jpg, .png, etc) và query params
        const publicIdWithExt = afterUpload.split('?')[0]; // Bỏ query params
        const publicId = publicIdWithExt.replace(/\.(jpg|jpeg|png|gif|webp)$/i, ''); // Bỏ extension
        
        return publicId;
    } catch (error) {
        console.error('[Cloudinary] Error extracting publicId from URL:', error);
        return url; // Return original if parsing fails
    }
};

/**
 * Convert Cloudinary URL to publicId
 * @param {string|Array<string>} urlOrUrls - Single URL or array of URLs
 * @returns {string|Array<string>} - Single publicId or array of publicIds
 */
export const convertUrlsToPublicIds = (urlOrUrls) => {
    if (!urlOrUrls) return urlOrUrls;
    
    if (Array.isArray(urlOrUrls)) {
        return urlOrUrls.map(url => getPublicIdFromUrl(url));
    }
    
    return getPublicIdFromUrl(urlOrUrls);
};

/**
 * Get full Cloudinary URL from publicId
 * @param {string} publicId 
 * @returns {string} - Full Cloudinary URL
 */
export const getImageUrl = (publicId) => {
    if (!publicId) return '';
    
    // If already a URL, return as is
    if (publicId.startsWith('http')) {
        return publicId;
    }
    
    // Construct Cloudinary URL
    const cloudName = 'djh8j3ofk';
    return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
};

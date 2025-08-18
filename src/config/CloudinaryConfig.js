
/** @format */

// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
	API_KEY: process.env.REACT_APP_CLOUDINARY_API_KEY || "your-api-key",
	CLOUD_NAME: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || "your-cloud-name",
	API_SECRET: process.env.REACT_APP_CLOUDINARY_API_SECRET || "",
	UPLOAD_PRESET: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "unsigned_upload"
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} Deletion response
 */
export const deleteCloudinaryImage = async (publicId) => {
	try {
		const formData = new FormData();
		formData.append('public_id', publicId);
		formData.append('api_key', CLOUDINARY_CONFIG.API_KEY);
		
		// Note: In production, this should be done on the backend for security
		// The API secret should never be exposed on the frontend
		const response = await fetch(
			`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.CLOUD_NAME}/image/destroy`,
			{
				method: 'POST',
				body: formData
			}
		);
		
		return await response.json();
	} catch (error) {
		console.error('Error deleting image from Cloudinary:', error);
		throw error;
	}
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} Public ID
 */
export const extractPublicIdFromUrl = (url) => {
	if (!url || !url.includes('cloudinary.com')) return null;
	
	const parts = url.split('/');
	const uploadIndex = parts.findIndex(part => part === 'upload');
	if (uploadIndex === -1) return null;
	
	// Get the part after version (if exists) or directly after upload
	let publicIdPart = parts[uploadIndex + 1];
	if (publicIdPart && publicIdPart.startsWith('v')) {
		publicIdPart = parts[uploadIndex + 2];
	}
	
	// Remove file extension
	return publicIdPart ? publicIdPart.split('.')[0] : null;
};

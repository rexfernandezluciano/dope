/** @format */

// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
	API_KEY: process.env.REACT_APP_CLOUDINARY_API_KEY || "your-api-key",
	CLOUD_NAME: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || "your-cloud-name",
	API_SECRET: process.env.REACT_APP_CLOUDINARY_API_SECRET || "",
	UPLOAD_PRESET: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "unsigned_upload"
};
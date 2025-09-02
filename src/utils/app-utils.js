/** @format */

import { authAPI, userAPI, getAuthToken } from '../config/ApiConfig.js';

/**
 * Get current authenticated user
 * @returns {Promise<Object|null>} User object or null
 */
export const getUser = async () => {
	try {
		// Import getAuthToken from ApiConfig to avoid circular dependencies
		const token = getAuthToken();
		if (!token) return null;

		const response = await authAPI.me();

		// Handle the auth/me API response structure: { status: "ok", user: userObject }
		if (response.status === 'ok' && response.user) {
			return response.user;
		}

		// Fallback for other response structures
		return response.user || response;
	} catch (error) {
		console.error('Error getting user:', error);
		// Only remove token if it's an auth error (401/403)
		if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized') || error.message.includes('Invalid or expired token')) {
			const { removeAuthToken } = await import('../config/ApiConfig.js');
			removeAuthToken();
		}
		return null;
	}
};

/**
 * Check if user is admin
 * @returns {Promise<boolean>} true if admin, false otherwise
 */
export const isAdmin = async () => {
	try {
		const user = await getUser();
		if (!user) return false;

		const result = await userAPI.isAdmin(user.uid);
		return result.isAdmin;
	} catch (error) {
		console.error('Error checking admin status:', error);
		return false;
	}
};

/**
 * Check if user exists by ID
 * @param {string} uid - User ID
 * @returns {Promise<boolean>} true if exists, false otherwise
 */
export const userExist = async (uid) => {
	try {
		const result = await userAPI.checkUserExists(uid);
		return result.exists;
	} catch (error) {
		console.error('Error checking user existence:', error);
		return false;
	}
};

/**
 * Check if user exists by email
 * @param {string} email - Email address
 * @returns {Promise<boolean>} true if exists, false otherwise
 */
export const userExistByEmail = async (email) => {
	try {
		const result = await userAPI.checkEmailExists(email);
		return result.exists;
	} catch (error) {
		console.error('Error checking email existence:', error);
		return false;
	}
};

/**
 * Send email verification
 * @param {string} email - Email address
 * @returns {Promise<void>}
 */
export const verifyUser = async (email) => {
	try {
		await authAPI.resendVerification(email);
	} catch (error) {
		console.error('Error sending verification:', error);
		throw error;
	}
};

/**
 * Create a unique username from display name
 * @param {string} displayName - Display name
 * @returns {Promise<string>} Generated username
 */
export const createUsername = async (displayName) => {
	if (!displayName) return 'user' + Date.now();

	// Generate username from display name
	let username = displayName.toLowerCase()
		.replace(/[^a-z0-9]/g, '')
		.substring(0, 15);

	// Add random number if username is too short
	if (username.length < 3) {
		username += Math.floor(Math.random() * 1000);
	}

	return username;
};

/**
 * Get Gravatar URL
 * @param {string} email - Email address
 * @returns {string} Gravatar URL
 */
export const getGravatar = async (email) => {
	const { default: md5 } = await import('md5');
	const hash = md5(email.toLowerCase().trim());
	return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
};

// Token functions are now handled by ApiConfig.js - import them when needed
// This avoids circular dependencies and ensures consistency
/** @format */

import { getUser } from './app-utils.js';

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} True if authenticated
 */
export const isAuthenticated = async () => {
	const user = await getUser();
	return !!user;
};

/**
 * Get user ID
 * @returns {Promise<string|null>} User ID or null
 */
export const getUserId = async () => {
	const user = await getUser();
	return user?.uid || null;
};
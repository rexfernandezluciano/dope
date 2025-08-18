
/** @format */

import { getUser as getAppUser } from './app-utils';

/**
 * Get current authenticated user (alias for app-utils getUser)
 * @returns {Promise<Object|null>} User object or null
 */
export const getUser = getAppUser;

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

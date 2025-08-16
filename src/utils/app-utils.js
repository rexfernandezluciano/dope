
/** @format */

import { authAPI, userAPI } from '../config/ApiConfig';

/**
 * Get current authenticated user
 * @returns {Promise<Object|null>} User object or null
 */
export const getUser = async () => {
	try {
		const token = localStorage.getItem('authToken');
		if (!token) return null;
		
		const user = await authAPI.getCurrentUser();
		return user;
	} catch (error) {
		console.error('Error getting user:', error);
		localStorage.removeItem('authToken');
		return null;
	}
};

/**
 * Save user data
 * @param {Object} userData - User data to save
 * @returns {Promise<void>}
 */
export const saveUser = async (userData) => {
	try {
		await userAPI.updateUser(userData.uid, {
			uid: userData.uid,
			name: userData.displayName,
			email: userData.email,
			photoURL: userData.photoURL,
			role: {
				user: true,
				editor: false,
				moderator: false,
			},
			username: await createUsername(userData.displayName),
			status: "online",
			account: {
				verified: false,
				subscription: "free",
			},
			lastSeen: new Date().toISOString(),
			createdAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Error saving user:', error);
		throw error;
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
export const getGravatar = (email) => {
	const md5 = require('md5');
	const hash = md5(email.toLowerCase().trim());
	return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
};

/**
 * Store authentication token
 * @param {string} token - JWT token
 */
export const setAuthToken = (token) => {
	localStorage.setItem('authToken', token);
};

/**
 * Remove authentication token
 */
export const removeAuthToken = () => {
	localStorage.removeItem('authToken');
};

/**
 * Get authentication token
 * @returns {string|null} JWT token or null
 */
export const getAuthToken = () => {
	return localStorage.getItem('authToken');
};

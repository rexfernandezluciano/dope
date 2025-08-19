
/**
 * Secure storage utilities for sensitive data using js-cookie
 */

import Cookies from 'js-cookie';

// Encrypt data before storing (basic implementation)
const encryptData = (data) => {
	try {
		// In production, use a proper encryption library like crypto-js
		return btoa(JSON.stringify(data));
	} catch (e) {
		console.error('Encryption failed:', e);
		return null;
	}
};

// Decrypt stored data
const decryptData = (encryptedData) => {
	try {
		return JSON.parse(atob(encryptedData));
	} catch (e) {
		console.error('Decryption failed:', e);
		return null;
	}
};

// Secure cookie storage with encryption using js-cookie
export const setSecureData = (key, data, options = {}) => {
	try {
		const encryptedData = encryptData(data);
		if (!encryptedData) return false;

		const defaults = {
			path: '/',
			secure: window.location.protocol === 'https:',
			sameSite: 'Strict',
			expires: 1/24 // 1 hour default (in days)
		};
		
		const config = { ...defaults, ...options };
		
		// Convert maxAge to expires if provided
		if (config.maxAge) {
			config.expires = config.maxAge / (24 * 60 * 60); // Convert seconds to days
			delete config.maxAge;
		}
		
		Cookies.set(key, encryptedData, config);
		return true;
	} catch (e) {
		console.error('Failed to set secure data:', e);
		return false;
	}
};

// Get and decrypt secure data using js-cookie
export const getSecureData = (key) => {
	try {
		const encryptedData = Cookies.get(key);
		if (encryptedData) {
			return decryptData(encryptedData);
		}
		return null;
	} catch (e) {
		console.error('Failed to get secure data:', e);
		return null;
	}
};

// Remove secure data using js-cookie
export const removeSecureData = (key, options = {}) => {
	try {
		const config = {
			path: '/',
			secure: window.location.protocol === 'https:',
			sameSite: 'Strict',
			...options
		};
		
		Cookies.remove(key, config);
		return true;
	} catch (e) {
		console.error('Failed to remove secure data:', e);
		return false;
	}
};

// Clear all secure cookies (for logout) using js-cookie
export const clearAllSecureData = () => {
	try {
		// Get all cookie names
		const allCookies = Cookies.get();
		Object.keys(allCookies).forEach(cookieName => {
			removeSecureData(cookieName);
		});
		return true;
	} catch (e) {
		console.error('Failed to clear secure data:', e);
		return false;
	}
};

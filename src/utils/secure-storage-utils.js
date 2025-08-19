
/**
 * Secure storage utilities for sensitive data
 */

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

// Secure cookie storage with encryption
export const setSecureData = (key, data, options = {}) => {
	try {
		const encryptedData = encryptData(data);
		if (!encryptedData) return false;

		const defaults = {
			path: '/',
			secure: window.location.protocol === 'https:',
			sameSite: 'Strict',
			maxAge: 3600 // 1 hour default
		};
		
		const config = { ...defaults, ...options };
		let cookieString = `${key}=${encodeURIComponent(encryptedData)}`;
		
		if (config.path) cookieString += `; path=${config.path}`;
		if (config.secure) cookieString += `; secure`;
		if (config.sameSite) cookieString += `; samesite=${config.sameSite}`;
		if (config.maxAge) cookieString += `; max-age=${config.maxAge}`;
		
		document.cookie = cookieString;
		return true;
	} catch (e) {
		console.error('Failed to set secure data:', e);
		return false;
	}
};

// Get and decrypt secure data
export const getSecureData = (key) => {
	try {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${key}=`);
		if (parts.length === 2) {
			const encryptedData = decodeURIComponent(parts.pop().split(';').shift());
			return decryptData(encryptedData);
		}
		return null;
	} catch (e) {
		console.error('Failed to get secure data:', e);
		return null;
	}
};

// Remove secure data
export const removeSecureData = (key, path = '/') => {
	try {
		document.cookie = `${key}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=Strict`;
		return true;
	} catch (e) {
		console.error('Failed to remove secure data:', e);
		return false;
	}
};

// Clear all secure cookies (for logout)
export const clearAllSecureData = () => {
	try {
		const cookies = document.cookie.split(';');
		cookies.forEach(cookie => {
			const eqPos = cookie.indexOf('=');
			const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
			if (name) {
				removeSecureData(name);
			}
		});
		return true;
	} catch (e) {
		console.error('Failed to clear secure data:', e);
		return false;
	}
};

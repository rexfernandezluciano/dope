
/**
 * App Check utilities - disabled for compatibility
 */

/**
 * Setup service worker (placeholder for compatibility)
 * @returns {Promise<void>} Always resolves
 */
export const setupSW = async () => {
	// Service worker setup disabled for compatibility
	console.log('Service worker setup disabled');
	return Promise.resolve();
};

/**
 * Get App Check token for API requests (disabled)
 * @returns {Promise<null>} Always returns null
 */
export const getAppCheckToken = async () => {
	// App Check disabled for compatibility
	return null;
};

/**
 * Add App Check token to API request headers (disabled)
 * @param {Object} headers - Existing headers object
 * @returns {Promise<Object>} Headers without App Check token
 */
export const addAppCheckHeaders = async (headers = {}) => {
	// App Check disabled for compatibility
	return headers;
};

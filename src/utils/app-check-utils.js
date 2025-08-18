
import { getToken } from "firebase/app-check";
import { app } from "../config/FirebaseConfig";

/**
 * Get App Check token for API requests
 * @returns {Promise<string|null>} App Check token or null if failed
 */
export const getAppCheckToken = async () => {
	try {
		if (typeof window === 'undefined') return null;
		
		// Get the token directly - Firebase automatically uses the initialized App Check instance
		const appCheckTokenResponse = await getToken(app, false);
		return appCheckTokenResponse.token;
	} catch (error) {
		console.error('Error getting App Check token:', error);
		return null;
	}
};

/**
 * Add App Check token to API request headers
 * @param {Object} headers - Existing headers object
 * @returns {Promise<Object>} Headers with App Check token
 */
export const addAppCheckHeaders = async (headers = {}) => {
	const token = await getAppCheckToken();
	if (token) {
		headers['X-Firebase-AppCheck'] = token;
	}
	return headers;
};

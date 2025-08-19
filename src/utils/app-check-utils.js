
import { getToken } from "firebase/app-check";
import { appCheck } from "../config/FirebaseConfig";

/**
 * Get App Check token for API requests
 * @returns {Promise<string|null>} App Check token or null if failed
 */
export const getAppCheckToken = async () => {
	try {
		if (typeof window === 'undefined') return null;
		
		// Check if appCheck is available
		if (!appCheck) {
			console.warn('App Check not initialized');
			return null;
		}
		
		// Get the token using the App Check instance with forceRefresh false
		const appCheckTokenResponse = await getToken(appCheck, false);
		return appCheckTokenResponse.token;
	} catch (error) {
		console.error('Error getting App Check token:', error);
		
		// Try once more with force refresh if the first attempt failed
		try {
			if (appCheck) {
				const retryResponse = await getToken(appCheck, true);
				return retryResponse.token;
			}
		} catch (retryError) {
			console.error('App Check retry failed:', retryError);
		}
		
		return null;
	}
};

/**
 * Add App Check token to API request headers
 * @param {Object} headers - Existing headers object
 * @returns {Promise<Object>} Headers with App Check token
 */
export const addAppCheckHeaders = async (headers = {}) => {
	try {
		const token = await getAppCheckToken();
		if (token) {
			headers['X-Firebase-AppCheck'] = token;
			console.log('App Check token added to headers');
		} else {
			console.warn('No App Check token available - continuing without it');
		}
	} catch (error) {
		console.error('Failed to add App Check headers:', error);
		// Continue without App Check token to maintain functionality
	}
	return headers;
};

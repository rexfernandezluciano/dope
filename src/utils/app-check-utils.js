
import { getToken } from "firebase/app-check";
import { appCheck } from "../config/FirebaseConfig";

/**
 * Get App Check token for API requests
 * @returns {Promise<string|null>} App Check token or null if failed
 */
export const getAppCheckToken = async (timeout = 3000) => {
	try {
		if (typeof window === 'undefined') return null;
		
		// Check if appCheck is available
		if (!appCheck) {
			console.warn('App Check not initialized');
			return null;
		}
		
		// Add timeout to prevent hanging requests
		const tokenPromise = getToken(appCheck, false);
		const timeoutPromise = new Promise((_, reject) => 
			setTimeout(() => reject(new Error('App Check token timeout')), timeout)
		);
		
		const appCheckTokenResponse = await Promise.race([tokenPromise, timeoutPromise]);
		
		if (appCheckTokenResponse && appCheckTokenResponse.token) {
			console.log('App Check token retrieved successfully');
			return appCheckTokenResponse.token;
		} else {
			console.warn('App Check token response is empty');
			return null;
		}
	} catch (error) {
		console.error('Error getting App Check token:', error);
		
		// For network errors or fetch errors, don't retry to avoid hanging the app
		if (error.code === 'appCheck/fetch-network-error' || error.message === 'Failed to fetch') {
			console.warn('Network error fetching App Check token - continuing without it');
			return null;
		}
		
		// For timeout errors, also don't retry
		if (error.message === 'App Check token timeout') {
			console.warn('App Check token request timed out - continuing without it');
			return null;
		}
		
		// For other errors, try once more with force refresh
		try {
			if (appCheck) {
				console.log('Retrying App Check token with force refresh...');
				const retryResponse = await Promise.race([
					getToken(appCheck, true),
					new Promise((_, reject) => 
						setTimeout(() => reject(new Error('Retry timeout')), 2000)
					)
				]);
				
				if (retryResponse && retryResponse.token) {
					console.log('App Check token retrieved on retry');
					return retryResponse.token;
				}
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

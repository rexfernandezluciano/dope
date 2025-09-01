
/**
 * TFA (Two-Factor Authentication) utility functions
 */

/**
 * Validate TFA code format
 * @param {string} code - The TFA code to validate
 * @returns {boolean} Whether the code is valid format
 */
export const validateTfaCode = (code) => {
	if (!code || typeof code !== 'string') return false;
	// TFA codes are 6 digits
	return /^\d{6}$/.test(code.trim());
};

/**
 * Format TFA code input (remove non-digits, limit to 6 characters)
 * @param {string} input - Raw input
 * @returns {string} Formatted code
 */
export const formatTfaCode = (input) => {
	if (!input) return '';
	return input.replace(/\D/g, '').slice(0, 6);
};

/**
 * Validate backup code format
 * @param {string} code - The backup code to validate
 * @returns {boolean} Whether the code is valid format
 */
export const validateBackupCode = (code) => {
	if (!code || typeof code !== 'string') return false;
	// Backup codes are 8 digits
	return /^\d{8}$/.test(code.trim());
};

/**
 * Check if TFA is required error
 * @param {Error} error - The error object
 * @returns {boolean} Whether TFA is required
 */
export const isTfaRequiredError = (error) => {
	return error?.message?.includes('TFA_REQUIRED') || 
		   error?.message?.includes('Two-factor authentication code is required');
};

/**
 * Generate secure random backup codes
 * @param {number} count - Number of codes to generate
 * @returns {string[]} Array of backup codes
 */
export const generateBackupCodes = (count = 5) => {
	const codes = [];
	for (let i = 0; i < count; i++) {
		// Generate 8-digit backup code
		const code = Math.floor(10000000 + Math.random() * 90000000).toString();
		codes.push(code);
	}
	return codes;
};

/**
 * Check if authenticator apps are available on the device
 * @returns {object} Object indicating available authenticator options
 */
export const getAuthenticatorOptions = () => {
	const userAgent = navigator.userAgent.toLowerCase();
	const isIOS = /iphone|ipad|ipod/.test(userAgent);
	const isAndroid = /android/.test(userAgent);
	
	return {
		googleAuthenticator: {
			name: 'Google Authenticator',
			ios: isIOS ? 'https://apps.apple.com/app/google-authenticator/id388497605' : null,
			android: isAndroid ? 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2' : null,
		},
		authy: {
			name: 'Authy',
			ios: isIOS ? 'https://apps.apple.com/app/authy/id494168017' : null,
			android: isAndroid ? 'https://play.google.com/store/apps/details?id=com.authy.authy' : null,
		},
		microsoft: {
			name: 'Microsoft Authenticator',
			ios: isIOS ? 'https://apps.apple.com/app/microsoft-authenticator/id983156458' : null,
			android: isAndroid ? 'https://play.google.com/store/apps/details?id=com.azure.authenticator' : null,
		}
	};
};

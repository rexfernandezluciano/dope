
// Security utility functions

// Content Security Policy helper
export const setupCSP = () => {
	if (typeof document !== 'undefined') {
		const meta = document.createElement('meta');
		meta.httpEquiv = 'Content-Security-Policy';
		meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://natasha.dopp.eu.org;";
		document.head.appendChild(meta);
	}
};

// XSS prevention for user content
export const sanitizeHTML = (html) => {
	if (typeof html !== 'string') return '';
	
	// Basic HTML sanitization - remove potentially dangerous tags and attributes
	return html
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
		.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
		.replace(/on\w+\s*=/gi, '') // Remove event handlers
		.replace(/javascript:/gi, '') // Remove javascript: protocol
		.replace(/data:/gi, '') // Remove data: protocol
		.trim();
};

// Rate limiting helper
export const createRateLimiter = (maxRequests = 10, windowMs = 60000) => {
	const requests = new Map();
	
	return (key) => {
		const now = Date.now();
		const windowStart = now - windowMs;
		
		if (!requests.has(key)) {
			requests.set(key, []);
		}
		
		const userRequests = requests.get(key);
		
		// Remove old requests outside the window
		const validRequests = userRequests.filter(time => time > windowStart);
		
		if (validRequests.length >= maxRequests) {
			throw new Error('Rate limit exceeded. Please try again later.');
		}
		
		validRequests.push(now);
		requests.set(key, validRequests);
		
		return true;
	};
};

// CSRF token generator
export const generateCSRFToken = () => {
	const array = new Uint32Array(4);
	crypto.getRandomValues(array);
	return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
};

// Secure random string generator
export const generateSecureRandom = (length = 32) => {
	const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	const values = crypto.getRandomValues(new Uint32Array(length));
	
	for (let i = 0; i < length; i++) {
		result += charset[values[i] % charset.length];
	}
	
	return result;
};

// Input validation patterns
export const ValidationPatterns = {
	EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
	USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,
	PASSWORD: /^.{8,128}$/,
	URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
};

// Validate file uploads
export const validateFileUpload = (file, maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) => {
	if (!file) {
		throw new Error('No file provided');
	}
	
	if (file.size > maxSize) {
		throw new Error('File size too large');
	}
	
	if (!allowedTypes.includes(file.type)) {
		throw new Error('File type not allowed');
	}
	
	return true;
};

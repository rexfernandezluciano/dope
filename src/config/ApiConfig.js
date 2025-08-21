/** @format */

// Secure token storage helper
// Import js-cookie for secure cookie management
import Cookies from "js-cookie";
// Check if we're using proxy (in development)
const isUsingProxy = process.env.NODE_ENV === 'development' && 
	window.location.hostname.includes('replit');

// Multiple API endpoints for failover
const API_ENDPOINTS = isUsingProxy ? [
	"/v1",  // Use proxy in development
	"https://social.dopp.eu.org/v1"
] : [
	process.env.REACT_APP_API_URL || "https://api.dopp.eu.org/v1",
	"https://social.dopp.eu.org/v1"
];

// Current active API base URL
let API_BASE_URL = API_ENDPOINTS[0];

// Validate API URL is HTTPS
if (!API_BASE_URL.startsWith("https://")) {
	console.error("API URL must use HTTPS");
}

// Enhanced fetch-based HTTP client with better error handling and failover
class HttpClient {
	constructor(baseURL, timeout = 60000) {
		this.baseURL = baseURL;
		this.timeout = timeout;
		this.failedEndpoints = new Set();
		this.lastHealthCheck = 0;
		this.healthCheckInterval = 5 * 60 * 1000; // 5 minutes
	}

	// Check endpoint health
	async checkEndpointHealth(endpoint) {
		try {
			const response = await fetch(`${endpoint}/health`, {
				method: 'GET',
				signal: AbortSignal.timeout(5000),
				mode: 'cors'
			});
			return response.ok;
		} catch (error) {
			console.warn(`Health check failed for ${endpoint}:`, error.message);
			return false;
		}
	}

	// Find the best available endpoint
	async findWorkingEndpoint() {
		const now = Date.now();
		
		// Only check health if enough time has passed
		if (now - this.lastHealthCheck > this.healthCheckInterval) {
			this.lastHealthCheck = now;
			this.failedEndpoints.clear();
			
			console.log("🔍 Checking endpoint health...");
			
			for (const endpoint of API_ENDPOINTS) {
				const isHealthy = await this.checkEndpointHealth(endpoint);
				console.log(`🏥 Health check for ${endpoint}: ${isHealthy ? '✅ Healthy' : '❌ Failed'}`);
				
				if (isHealthy) {
					API_BASE_URL = endpoint;
					this.baseURL = endpoint;
					console.log(`🎯 Using endpoint: ${endpoint}`);
					return endpoint;
				} else {
					this.failedEndpoints.add(endpoint);
				}
			}
		}
		
		// Use current endpoint if no health check needed
		return this.baseURL;
	}

	// Try request with failover to other endpoints
	async requestWithFailover(url, options = {}) {
		let lastError = null;
		
		for (const endpoint of API_ENDPOINTS) {
			// Skip endpoints that recently failed (unless it's our last option)
			if (this.failedEndpoints.has(endpoint) && API_ENDPOINTS.indexOf(endpoint) < API_ENDPOINTS.length - 1) {
				continue;
			}
			
			try {
				const fullUrl = url.startsWith('http') ? url : `${endpoint}${url}`;
				console.log(`🔄 Trying endpoint: ${endpoint}`);
				
				const response = await this.makeRequest(fullUrl, options);
				
				// If successful, update our primary endpoint
				if (API_BASE_URL !== endpoint) {
					API_BASE_URL = endpoint;
					this.baseURL = endpoint;
					console.log(`✅ Switched to working endpoint: ${endpoint}`);
				}
				
				// Remove from failed endpoints
				this.failedEndpoints.delete(endpoint);
				
				return response;
				
			} catch (error) {
				console.warn(`❌ Request failed on ${endpoint}:`, error.message);
				this.failedEndpoints.add(endpoint);
				lastError = error;
				
				// If this is a network connectivity issue, don't try other endpoints
				if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
					// Quick test if it's a general connectivity issue
					try {
						await fetch('https://www.google.com/favicon.ico', { 
							method: 'HEAD', 
							mode: 'no-cors',
							signal: AbortSignal.timeout(3000)
						});
						// If Google works, continue trying other endpoints
						continue;
					} catch (connectTest) {
						// If Google fails, it's a general connectivity issue
						throw new Error(`Network connectivity issue detected. Please check your internet connection and try again.`);
					}
				}
			}
		}
		
		// If all endpoints failed
		throw lastError || new Error('All API endpoints are currently unavailable');
	}

	// Original request method renamed
	async makeRequest(fullUrl, options = {}) {
		console.log("🚀 Making HTTP request:", {
			url: fullUrl,
			method: options.method || 'GET',
			headers: options.headers,
			hasBody: !!options.body,
			timestamp: new Date().toISOString()
		});

		// Create AbortController for timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		try {
			// Prepare headers
			const headers = {
				'Content-Type': 'application/json; charset=utf8',
				'Accept': 'application/json',
				'User-Agent': 'DOPE-Network-Client/1.0',
				...options.headers
			};

			// Add security headers
			try {
				const { SecurityMiddleware } = await import("../utils/security-middleware");
				const secureOptions = await SecurityMiddleware.secureApiRequest(fullUrl, { headers });
				Object.assign(headers, secureOptions.headers);
			} catch (securityError) {
				console.warn("Security middleware failed:", securityError);
			}

			// Add auth token
			const token = getAuthToken();
			if (token && !fullUrl.includes('/auth/login') && !fullUrl.includes('/auth/register')) {
				headers['Authorization'] = `Bearer ${token}`;
			}

			const fetchOptions = {
				method: options.method || 'GET',
				headers,
				signal: controller.signal,
				credentials: 'omit', // Don't send cookies
				mode: 'cors',
				cache: 'no-cache'
			};

			if (options.body) {
				fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
			}

			console.log("📡 Fetch options:", {
				url: fullUrl,
				method: fetchOptions.method,
				headers: Object.keys(fetchOptions.headers),
				bodyLength: fetchOptions.body?.length || 0
			});

			const response = await fetch(fullUrl, fetchOptions);
			
			clearTimeout(timeoutId);

			console.log("📥 Response received:", {
				url: fullUrl,
				status: response.status,
				statusText: response.statusText,
				headers: Object.fromEntries(response.headers.entries()),
				ok: response.ok,
				type: response.type,
				redirected: response.redirected
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error("❌ HTTP Error Response:", {
					status: response.status,
					statusText: response.statusText,
					body: errorText,
					url: fullUrl
				});
				
				let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
				try {
					const errorData = JSON.parse(errorText);
					errorMessage = errorData.message || errorData.error || errorMessage;
				} catch (parseError) {
					if (errorText.length > 0 && errorText.length < 200) {
						errorMessage = errorText;
					}
				}
				
				throw new Error(errorMessage);
			}

			const contentType = response.headers.get('content-type');
			let data;
			
			if (contentType && contentType.includes('application/json')) {
				data = await response.json();
			} else {
				data = await response.text();
			}

			console.log("✅ Request successful:", {
				url: fullUrl,
				status: response.status,
				dataType: typeof data,
				dataPreview: typeof data === 'object' ? Object.keys(data) : data.substring?.(0, 100)
			});

			return data;

		} catch (error) {
			clearTimeout(timeoutId);
			
			console.error("💥 Request failed:", {
				url: fullUrl,
				error: error.name,
				message: error.message,
				stack: error.stack,
				cause: error.cause,
				isAbortError: error.name === 'AbortError',
				isNetworkError: error.message.includes('fetch') || error.message.includes('NetworkError'),
				isConnectivityIssue: error.message.includes('Failed to fetch'),
				timestamp: new Date().toISOString(),
				userAgent: navigator.userAgent,
				onlineStatus: navigator.onLine,
				connectionType: navigator.connection?.effectiveType || 'unknown'
			});

			// Enhanced error classification with network diagnostics
			if (error.name === 'AbortError') {
				throw new Error(`Request timeout after ${this.timeout}ms. The server took too long to respond.`);
			}
			
			// Check if user is offline
			if (!navigator.onLine) {
				throw new Error(`No internet connection detected. Please check your network connection and try again.`);
			}
			
			// Check for specific network errors
			if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
				// Run a quick connectivity test
				try {
					await fetch('https://www.google.com/favicon.ico', { 
						method: 'HEAD', 
						mode: 'no-cors',
						signal: AbortSignal.timeout(3000)
					});
					// If Google is reachable, it's likely an API server issue
					throw new Error(`API server unreachable at ${this.baseURL}. The server appears to be down, under maintenance, or there may be a firewall blocking the connection. Please try again later or contact support if the issue persists.`);
				} catch (connectTest) {
					// If Google is not reachable, it's a general connectivity issue
					throw new Error(`Network connectivity issue detected. Please check your internet connection and try again. If you're on a restricted network, the API endpoint may be blocked.`);
				}
			}

			throw error;
		}
	}

	async request(url, options = {}) {
		return this.requestWithFailover(url, options);
	}

	async get(url, options = {}) {
		return this.request(url, { ...options, method: 'GET' });
	}

	async post(url, data, options = {}) {
		return this.request(url, { ...options, method: 'POST', body: data });
	}

	async put(url, data, options = {}) {
		return this.request(url, { ...options, method: 'PUT', body: data });
	}

	async delete(url, options = {}) {
		return this.request(url, { ...options, method: 'DELETE' });
	}
}

// Create HTTP client instance
const apiClient = new HttpClient(API_BASE_URL, 60000);

// Test API connectivity
const testApiConnection = async () => {
	try {
		console.log("Testing API connectivity to:", API_BASE_URL);
		const testUrl = API_BASE_URL.startsWith('/') ? 
			`${API_BASE_URL}/health` : 
			`${API_BASE_URL}/health`;
			
		const response = await fetch(testUrl, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			signal: AbortSignal.timeout(10000), // 10 second timeout
		});

		if (response.ok) {
			console.log("API connection successful");
			return true;
		} else {
			console.error(
				"API connection failed:",
				response.status,
				response.statusText,
			);
			return false;
		}
	} catch (error) {
		console.error("API connectivity test failed:", error.message);
		return false;
	}
};

const apiRequest = async (endpoint, options = {}) => {
	try {
		const response = await apiClient.request(endpoint, {
			method: options.method || "GET",
			body: options.body,
			headers: options.headers,
			...options,
		});

		return response;
	} catch (error) {
		console.error("🚨 API request failed:", {
			endpoint,
			error: error.message,
			stack: error.stack
		});
		throw error;
	}
};

// Secure cookie utilities using js-cookie
const setCookie = (name, value, options = {}) => {
	try {
		const isProduction = process.env.NODE_ENV === "production";
		const isHttps = window.location.protocol === "https:";
		const isReplit =
			window.location.hostname.includes("replit") ||
			window.location.hostname.includes("repl.co");

		const defaults = {
			path: "/",
			secure: isProduction && isHttps && !isReplit, // Disable secure for Replit dev
			sameSite: isReplit ? "None" : isProduction ? "Strict" : "Lax", // Use None for Replit
			expires: 1, // 1 day default
		};

		const config = { ...defaults, ...options };

		// Convert maxAge to expires (days) for js-cookie
		if (config.maxAge) {
			config.expires = config.maxAge / (24 * 60 * 60); // Convert seconds to days
			delete config.maxAge;
		}

		// For Replit development, use minimal restrictions
		if (isReplit && !isProduction) {
			delete config.secure;
			delete config.sameSite;
		}

		Cookies.set(name, value, config);
		console.log(`Cookie '${name}' set successfully with config:`, config);
		console.log(`All cookies after setting:`, document.cookie);

		// Verify cookie was set
		const verification = Cookies.get(name);
		console.log(`Cookie verification - found:`, verification ? "YES" : "NO");
	} catch (e) {
		console.error("Failed to set secure cookie:", e);
	}
};

const getCookie = (name) => {
	try {
		const value = Cookies.get(name);
		return value || null;
	} catch (e) {
		console.error("Failed to get cookie:", e);
		return null;
	}
};

const deleteCookie = (name, options = {}) => {
	try {
		const isProduction = process.env.NODE_ENV === "production";
		const isHttps = window.location.protocol === "https:";
		const isReplit =
			window.location.hostname.includes("replit") ||
			window.location.hostname.includes("repl.co");

		const config = {
			path: "/",
			secure: isProduction && isHttps && !isReplit, // Disable secure for Replit dev
			sameSite: isReplit ? "None" : isProduction ? "Strict" : "Lax", // Use None for Replit
			...options,
		};

		// For Replit development, use minimal restrictions
		if (isReplit && !isProduction) {
			delete config.secure;
			delete config.sameSite;
		}

		Cookies.remove(name, config);
		console.log(`Cookie '${name}' removed successfully`);
	} catch (e) {
		console.error("Failed to delete cookie:", e);
	}
};

const getAuthToken = () => {
	try {
		const isProduction = process.env.NODE_ENV === "production";
		const isReplit =
			window.location.hostname.includes("replit") ||
			window.location.hostname.includes("repl.co");

		// In Replit development, prioritize sessionStorage
		if (isReplit && !isProduction) {
			const sessionToken = sessionStorage.getItem("authToken");
			if (sessionToken) {
				console.log("Auth token found in sessionStorage (Replit dev)");
				return sessionToken;
			}
		} else {
			// In production, try secure cookie first
			const cookieToken = getCookie("authToken");
			if (cookieToken) {
				console.log("Auth token found in secure cookie");
				return cookieToken;
			}
		}

		// Fallback to any available storage
		const sessionToken = sessionStorage.getItem("authToken");
		const localToken = localStorage.getItem("authToken");
		const storageToken = sessionToken || localToken;

		if (storageToken) {
			console.log("Auth token found in fallback storage");
			return storageToken;
		}

		console.warn("No auth token found in any storage");
		return null;
	} catch (e) {
		console.error("Failed to get auth token:", e);
		return null;
	}
};

const setAuthToken = (token, rememberMe = false) => {
	try {
		const isProduction = process.env.NODE_ENV === "production";
		const isReplit =
			window.location.hostname.includes("replit") ||
			window.location.hostname.includes("repl.co");

		console.log("Setting auth token - environment:", {
			isProduction,
			isReplit,
		});

		// For Replit development, use sessionStorage as primary
		if (isReplit && !isProduction) {
			sessionStorage.setItem("authToken", token);
			console.log("Auth token stored in sessionStorage (Replit development)");
			return;
		}

		// Try to set secure cookie for production
		const expires = rememberMe ? 30 : 1; // 30 days or 1 day
		const cookieOptions = {
			expires,
			secure: isProduction,
			sameSite: isProduction ? "Strict" : "Lax",
		};

		setCookie("authToken", token, cookieOptions);

		// Verify cookie was set, if not use sessionStorage as fallback
		setTimeout(() => {
			const verification = getCookie("authToken");
			if (!verification) {
				console.warn("Cookie storage failed, using sessionStorage as fallback");
				sessionStorage.setItem("authToken", token);
				console.log("Auth token stored in sessionStorage (cookie fallback)");
			} else {
				console.log("Auth token stored in secure cookie successfully");
				// Clean up any existing storage tokens only if cookie worked
				sessionStorage.removeItem("authToken");
				localStorage.removeItem("authToken");
			}
		}, 100);
	} catch (e) {
		console.error("Failed to store auth token:", e);
		// Always fallback to sessionStorage
		try {
			sessionStorage.setItem("authToken", token);
			console.log("Fallback: Auth token stored in sessionStorage");
		} catch (storageError) {
			console.error("All storage methods failed:", storageError);
		}
	}
};

const removeAuthToken = () => {
	try {
		const isProduction = process.env.NODE_ENV === "production";
		const isHttps = window.location.protocol === "https:";
		const isReplit =
			window.location.hostname.includes("replit") ||
			window.location.hostname.includes("repl.co");

		// Remove secure cookie with proper options
		const deleteOptions = {
			path: "/",
			secure: isProduction && isHttps && !isReplit, // Disable secure for Replit dev
			sameSite: isReplit ? "None" : isProduction ? "Strict" : "Lax", // Use None for Replit
		};

		// For Replit development, use minimal restrictions
		if (isReplit && !isProduction) {
			delete deleteOptions.secure;
			delete deleteOptions.sameSite;
		}

		deleteCookie("authToken", deleteOptions);

		// Clean up storage as well (for backward compatibility)
		sessionStorage.removeItem("authToken");
		localStorage.removeItem("authToken");

		console.log("Auth token removed from all storage");
	} catch (e) {
		console.error("Failed to remove auth token:", e);
	}
};

// Input validation helpers
const validateEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email) && email.length <= 254;
};

const validatePassword = (password) => {
	return (
		typeof password === "string" &&
		password.length >= 8 &&
		password.length <= 128
	);
};

const sanitizeInput = (input) => {
	if (typeof input !== "string") return input;
	return input.trim().replace(/[<>]/g, "");
};

const authAPI = {
	login: async (email, password) => {
		if (!validateEmail(email)) {
			throw new Error("Invalid email format");
		}
		if (!validatePassword(password)) {
			throw new Error("Invalid password");
		}

		const response = await apiRequest("/auth/login", {
			method: "POST",
			body: {
				email: sanitizeInput(email),
				password: password, // Don't sanitize password to preserve special chars
			},
		});

		if (response.token) {
			setAuthToken(response.token);
		}

		return response;
	},

	register: (userData) => {
		// Validate required fields
		if (!validateEmail(userData.email)) {
			throw new Error("Invalid email format");
		}
		if (!validatePassword(userData.password)) {
			throw new Error("Password must be 8-128 characters");
		}
		if (
			!userData.username ||
			userData.username.length < 3 ||
			userData.username.length > 30
		) {
			throw new Error("Username must be 3-30 characters");
		}

		// Sanitize user inputs
		const sanitizedData = {
			...userData,
			email: sanitizeInput(userData.email),
			username: sanitizeInput(userData.username),
			name: sanitizeInput(userData.name),
		};

		return apiRequest("/auth/register", {
			method: "POST",
			body: sanitizedData,
		});
	},

	verifyEmail: (email, code, verificationId) => {
		if (!validateEmail(email)) {
			throw new Error("Invalid email format");
		}
		if (!code || code.length !== 6) {
			throw new Error("Invalid verification code");
		}

		return apiRequest("/auth/verify-email", {
			method: "POST",
			body: {
				email: sanitizeInput(email),
				code: sanitizeInput(code),
				verificationId: sanitizeInput(verificationId),
			},
		});
	},

	resendVerification: (email) =>
		apiRequest("/auth/resend-code", {
			method: "POST",
			body: { email },
		}),

	validateVerificationId: (verificationId) => {
		if (!verificationId || typeof verificationId !== "string") {
			throw new Error("Invalid verification ID");
		}

		return apiRequest(
			`/auth/validate-verification-id/${encodeURIComponent(verificationId)}`,
			{
				method: "GET",
			},
		);
	},

	getCurrentUser: () =>
		apiRequest("/auth/me", {
			method: "GET",
		}),

	logout: () => {
		removeAuthToken();
		return Promise.resolve();
	},

	googleLogin: async (idToken) => {
		if (!idToken || typeof idToken !== "string") {
			throw new Error("Invalid Google ID token");
		}

		const response = await apiRequest("/auth/google", {
			method: "POST",
			body: { idToken },
		});

		if (response.token) {
			setAuthToken(response.token);
		}

		return response;
	},
};

const userAPI = {
	getUsers: () =>
		apiRequest("/users", {
			method: "GET",
		}),

	getUser: (username) =>
		apiRequest(`/users/${username}`, {
			method: "GET",
		}),

	updateUser: (username, userData) =>
		apiRequest(`/users/${username}`, {
			method: "PUT",
			body: userData,
		}),

	followUser: async (username) => {
		const response = await apiClient.post(`/users/${username}/follow`);
		return response; // Returns { message: "...", following: true/false }
	},

	getFollowers: (username) =>
		apiRequest(`/users/${username}/followers`, {
			method: "GET",
		}),

	getFollowing: (username) =>
		apiRequest(`/users/${username}/following`, {
			method: "GET",
		}),

	searchUsers: (searchQuery) => {
		if (
			!searchQuery ||
			typeof searchQuery !== "string" ||
			searchQuery.length < 1
		) {
			throw new Error("Invalid search query");
		}
		const sanitizedQuery = sanitizeInput(searchQuery).substring(0, 100); // Limit length
		return apiRequest(`/users?search=${encodeURIComponent(sanitizedQuery)}`, {
			method: "GET",
		});
	},

	getUserEarnings: async () =>
		apiRequest("/users/analytics/earnings", {
			method: "GET",
		}),
};

const postAPI = {
	getPosts: (params = {}) => {
		const searchParams = new URLSearchParams();
		Object.keys(params).forEach((key) => {
			if (params[key] !== undefined && params[key] !== null) {
				searchParams.append(key, params[key]);
			}
		});
		const queryString = searchParams.toString();
		return apiRequest(`/posts${queryString ? `?${queryString}` : ""}`, {
			method: "GET",
		});
	},

	getPost: (postId) =>
		apiRequest(`/posts/${postId}`, {
			method: "GET",
		}),

	createPost: (data) => {
		// Validate required fields for live stream posts
		if (data.postType === "live_video") {
			if (!data.liveVideoUrl) {
				throw new Error("Live video URL is required for live stream posts");
			}
			if (!data.streamTitle) {
				throw new Error("Stream title is required for live stream posts");
			}
		}

		// Sanitize content if present
		if (data.content) {
			data.content = sanitizeInput(data.content);
		}
		if (data.streamTitle) {
			data.streamTitle = sanitizeInput(data.streamTitle);
		}

		return apiRequest("/posts", {
			method: "POST",
			body: data,
		});
	},
	updatePost: (id, data) =>
		apiRequest(`/posts/${id}`, {
			method: "PUT",
			body: data,
		}),
	deletePost: (id) =>
		apiRequest(`/posts/${id}`, {
			method: "DELETE",
		}),
	likePost: (id) =>
		apiRequest(`/posts/${id}/like`, {
			method: "POST",
		}),
	sharePost: (id) =>
		apiRequest(`/posts/share/${id}`, {
			method: "POST",
		}),

	trackView: (id) =>
		apiRequest(`/posts/${id}/view`, {
			method: "POST",
		}),

	deletePostWithImages: async (postId) => {
		try {
			await apiClient.delete(`/posts/${postId}/with-images`);
			return { success: true };
		} catch (error) {
			throw error;
		}
	},

	getUserPosts: (userId, params = {}) => {
		const searchParams = new URLSearchParams();
		Object.keys(params).forEach((key) => {
			if (params[key] !== undefined && params[key] !== null) {
				searchParams.append(key, params[key]);
			}
		});
		const queryString = searchParams.toString();
		return apiRequest(`/posts${queryString ? `?${queryString}` : ""}`, {
			method: "GET",
		});
	},

	getFollowingFeed: (params = {}) => {
		const searchParams = new URLSearchParams();
		Object.keys(params).forEach((key) => {
			if (params[key] !== undefined && params[key] !== null) {
				searchParams.append(key, params[key]);
			}
		});
		const queryString = searchParams.toString();
		return apiRequest(
			`/posts/feed/following${queryString ? `?${queryString}` : ""}`,
			{
				method: "GET",
			},
		);
	},

	searchPosts: (query, params = {}) => {
		const searchParams = new URLSearchParams();
		searchParams.append("q", query);
		Object.keys(params).forEach((key) => {
			if (params[key] !== undefined && params[key] !== null) {
				searchParams.append(key, params[key]);
			}
		});
		const queryString = searchParams.toString();
		return apiRequest(`/posts/search?${queryString}`, {
			method: "GET",
		});
	},

	getPostsByHashtag: (params = {}) => {
		const searchParams = new URLSearchParams();
		Object.keys(params).forEach((key) => {
			if (params[key] !== undefined && params[key] !== null) {
				searchParams.append(key, params[key]);
			}
		});
		const queryString = searchParams.toString();
		return apiRequest(`/posts/hashtag${queryString ? `?${queryString}` : ""}`, {
			method: "GET",
		});
	},

	getCurrentUserPosts: () =>
		apiRequest("/posts/user/me", {
			method: "GET",
		}),
};



const commentAPI = {
	getComments: async (postId) => {
		try {
			if (!postId) {
				throw new Error("Post ID is required");
			}
			console.log("Fetching comments for post:", postId);
			const response = await apiClient.get(`/comments/post/${postId}`);

			console.log("Comments response for post", postId, ":", response);
			return response;
		} catch (error) {
			console.error("Failed to get comments for post", postId, ":", error);
			return { comments: [] }; // Return empty array on error
		}
	},

	createComment: async (postId, content) => {
		try {
			if (!postId || !content) {
				throw new Error("Post ID and content are required");
			}
			const response = await apiClient.post(`/comments/post/${postId}`, {
				content,
			});
			return response;
		} catch (error) {
			console.error("Failed to create comment:", error);
			throw error;
		}
	},

	deleteComment: async (commentId) => {
		try {
			if (!commentId) {
				throw new Error("Comment ID is required");
			}
			const response = await apiClient.delete(`/comments/${commentId}`);
			return response;
		} catch (error) {
			console.error("Failed to delete comment:", error);
			throw error;
		}
	},

	searchComments: async (query, limit = 20, cursor = null) => {
		try {
			if (!query) {
				throw new Error("Search query is required");
			}
			const params = new URLSearchParams({
				q: query,
				limit: limit.toString(),
			});

			if (cursor) {
				params.append("cursor", cursor);
			}

			const response = await apiClient.get(`/comments/search?${params}`);
			return response;
		} catch (error) {
			console.error("Failed to search comments:", error);
			return { comments: [], cursor: null }; // Return empty result on error
		}
	},
};

export {
	authAPI,
	postAPI,
	userAPI,
	commentAPI,
	setAuthToken,
	removeAuthToken,
	getAuthToken,
	validateEmail,
	sanitizeInput,
	testApiConnection,
};

export default apiRequest;

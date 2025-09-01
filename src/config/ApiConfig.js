/** @format */

import Cookies from "js-cookie";
import axios from "axios";

// Always use proxy for both development and production

// Define API endpoints based on environment
const API_ENDPOINTS =
	window.location.hostname.includes("replit.dev") ||
	window.location.hostname.includes("replit.co") ||
	window.location.hostname.includes("replit.app") ||
	window.location.hostname === "localhost"
		? ["", "https://api.dopp.eu.org"]
		: [""];

// Current active API base URL
let API_BASE_URL = "";

// Validate API URL is HTTPS (skip validation for proxy URLs and empty strings)
if (API_BASE_URL && API_BASE_URL !== "" && validateAPIUrl(API_BASE_URL)) {
	console.warn("⚠️ API URL should use HTTPS for security");
}

// Create axios instance with default config
const apiClient = axios.create({
	timeout: 30000,
	headers: {
		"Content-Type": "application/json; charset=UTF-8",
		Accept: "application/json",
		"User-Agent": "DOPE-Network-Client/1.0",
		"X-Requested-With": "XMLHttpRequest",
	},
	// Handle CORS and network issues better
	validateStatus: function (status) {
		return status >= 200 && status < 500; // Don't reject on 4xx errors
	},
	maxRedirects: 5,
	withCredentials: false, // Set to false for external APIs
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
	(config) => {
		// Get auth token from storage
		const token =
			sessionStorage.getItem("authToken") ||
			localStorage.getItem("authToken") ||
			Cookies.get("authToken");

		if (token) {
			console.log("Auth token found in storage");
			config.headers.Authorization = `Bearer ${token}`;
		} else {
			console.log("No auth token found in any storage");
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		if (error.response) {
			// Server responded with error status
			console.log("❌ HTTP Error Response:", {
				status: error.response.status,
				statusText: error.response.statusText,
				data: error.response.data,
				url: error.config.url,
			});
		} else if (error.request) {
			// Request was made but no response received
			console.log("❌ Network Error:", error.message);
		} else {
			// Something else happened
			console.log("❌ Request Error:", error.message);
		}
		return Promise.reject(error);
	},
);

// HTTP Client class using axios
class HttpClient {
	constructor() {
		this.currentEndpointIndex = 0;
		this.currentBaseURL = "";
	}

	async makeRequest(endpoint, options = {}) {
		// Add /v1 prefix if not already present, except for WebFinger and ActivityPub endpoints
		const isWebFingerOrActivityPub =
			endpoint.startsWith("/.well-known") ||
			endpoint.startsWith("/activitypub");

		const normalizedEndpoint =
			endpoint.startsWith("/v1") || isWebFingerOrActivityPub
				? endpoint
				: `/v1${endpoint}`;
		const url = `${this.currentBaseURL}${normalizedEndpoint}`;

		try {
			const response = await apiClient({
				url,
				method: options.method || "GET",
				data: options.data,
				headers: {
					"Content-Type": "application/json",
					...options.headers,
				},
				withCredentials: true,
				...options,
			});

			return {
				ok: response.status >= 200 && response.status < 300,
				status: response.status,
				statusText: response.statusText,
				data: response.data,
				headers: response.headers,
			};
		} catch (error) {
			if (error.response) {
				// Server error - API responded with error status
				let errorMsg;
				const status = error.response.status;
				const data = error.response.data;

				if (status === 405) {
					errorMsg = `Method ${options.method || "GET"} not allowed for ${endpoint}. Check if the endpoint supports this HTTP method.`;
					console.log("🚨 405 Method Not Allowed Details:", {
						requestedMethod: options.method || "GET",
						endpoint,
						allowedMethods: error.response.headers?.allow || "Not specified",
						url: error.config?.url,
					});
				} else if (status === 409) {
					// Handle conflict errors specifically
					errorMsg =
						data?.message || data?.error || `Conflict error (${status})`;
					console.log("🚨 409 Conflict Details:", {
						endpoint,
						message: data?.message,
						details: data?.details,
						url: error.config?.url,
					});
				} else if (status === 422) {
					// Handle validation errors
					errorMsg = data?.message || data?.error || "Validation failed";
					if (data?.details && Array.isArray(data.details)) {
						errorMsg += `: ${data.details.join(", ")}`;
					}
					console.log("🚨 422 Validation Error Details:", {
						endpoint,
						message: data?.message,
						details: data?.details,
						url: error.config?.url,
					});
				} else if (status === 429) {
					// Handle rate limiting
					const retryAfter =
						error.response.headers["retry-after"] || data?.retryAfter;
					errorMsg = data?.message || "Rate limit exceeded";

					console.log("🚨 429 Rate Limit Details:", {
						endpoint,
						message: data?.message,
						retryAfter: retryAfter,
						headers: error.response.headers,
						url: error.config?.url,
					});

					// Add retry information to error data for better handling
					if (retryAfter) {
						errorMsg += `. Please wait ${retryAfter} seconds before trying again.`;
					}
				} else if (status >= 500) {
					errorMsg =
						data?.message ||
						error.response.statusText ||
						`Server error (${status})`;
					console.log("🚨 Server Error Details:", {
						status,
						endpoint,
						message: data?.message,
						url: error.config?.url,
					});
				} else {
					errorMsg =
						data?.message ||
						error.response.statusText ||
						`Request failed (${status})`;
				}

				console.log("🚨 HTTP Error Response:", {
					status,
					statusText: error.response.statusText,
					data,
					url: error.config?.url,
				});

				// Create error with additional context
				const apiError = new Error(errorMsg);
				apiError.status = status;
				apiError.data = data;

				// Add retry-after header for rate limiting
				if (status === 429) {
					apiError.retryAfter =
						error.response.headers["retry-after"] || data?.retryAfter;
				}

				throw apiError;
			} else if (error.request) {
				// Network error - request was made but no response
				console.log("🌐 Network Error Details:", {
					request: error.request,
					readyState: error.request.readyState,
					status: error.request.status,
					responseURL: error.request.responseURL,
				});
				throw new Error(
					`Network connectivity issue: Unable to reach ${url}. Please check your internet connection and try again.`,
				);
			} else {
				// Other error
				console.log("❌ Request Setup Error:", error);
				throw new Error(error.message || "Request failed");
			}
		}
	}

	async requestWithFailover(endpoint, options = {}) {
		const endpoints = API_ENDPOINTS.filter((url) => url !== "");
		let lastError;

		// Helper function to determine if error should trigger failover
		const shouldFailover = (error) => {
			// Don't failover for HTTP status codes that indicate the API is working
			// Only failover for network/connectivity issues
			if (error.status >= 400 && error.status < 600) {
				return false; // API responded with an error, don't try other endpoints
			}
			return true; // Network error, try next endpoint
		};

		// If using proxy (empty string), use current base URL
		if (API_ENDPOINTS.includes("")) {
			this.currentBaseURL = "";
			try {
				return await this.makeRequest(endpoint, options);
			} catch (error) {
				lastError = error;
				if (!shouldFailover(error)) {
					// API responded with an error (like 401, 404, etc.), don't try other endpoints
					throw error;
				}
				console.log(
					"Proxy request failed due to network error, trying direct API...",
				);
			}
		}

		// Try direct API endpoints
		for (const baseUrl of endpoints) {
			try {
				this.currentBaseURL = baseUrl;
				return await this.makeRequest(endpoint, options);
			} catch (error) {
				lastError = error;
				if (!shouldFailover(error)) {
					// API responded with an error, don't try other endpoints
					throw error;
				}
				console.log(
					`Network error for ${baseUrl}, trying next endpoint:`,
					error.message,
				);
				continue;
			}
		}

		// All endpoints failed due to network issues
		throw lastError || new Error("All API endpoints failed");
	}
}

// Create HTTP client instance
const httpClient = new HttpClient();

// Mock apiCall function for demonstration purposes if it's not defined elsewhere
// In a real scenario, this would likely be imported or defined globally
const apiCall = async (endpoint, options = {}) => {
    // Ensure API_BASE_URL is set if it's empty and not using a proxy
    let baseUrl = API_BASE_URL;
    if (!baseUrl && !API_ENDPOINTS.includes("")) {
        baseUrl = API_ENDPOINTS.find(url => url !== "") || "";
    }
    // If using proxy (empty string in API_ENDPOINTS), then use "" as base URL
    if (API_ENDPOINTS.includes("")) {
        baseUrl = "";
    }


	const url = `${baseUrl}${endpoint}`;

	try {
		// Use the existing apiClient for actual requests
		const response = await apiClient({
			url,
			method: options.method || 'GET',
			data: options.body ? JSON.parse(options.body) : undefined, // Parse body if it's JSON string
			headers: {
				'Content-Type': 'application/json', // Default to JSON
				...options.headers,
			},
			withCredentials: true, // Assuming this is needed based on context
		});

		return {
			ok: response.status >= 200 && response.status < 300,
			status: response.status,
			statusText: response.statusText,
			data: response.data,
			headers: response.headers,
		};
	} catch (error) {
		// Re-throw the error to be handled by the caller or the existing interceptors
		throw error;
	}
};


// Main API request function
export const apiRequest = async (endpoint, options = {}) => {
	try {
		const response = await httpClient.requestWithFailover(endpoint, options);

		if (!response?.ok) {
			throw new Error(
				response?.data?.message ||
					`HTTP ${response?.status}: ${response?.statusText}`,
			);
		}

		return response?.data;
	} catch (error) {
		console.log("🚨 API request failed:", {
			endpoint,
			error: error.message,
			stack: error.stack,
		});
		throw error;
	}
};

// Token management functions
export const setAuthToken = (token, rememberMe = false) => {
	if (!token) {
		console.error("Cannot set empty token");
		return;
	}

	try {
		// Always store in sessionStorage for current session
		sessionStorage.setItem("authToken", token);

		// Store in localStorage only if rememberMe is true
		if (rememberMe) {
			localStorage.setItem("authToken", token);
		}

		// Also store in cookie as fallback
		Cookies.set("authToken", token, {
			expires: rememberMe ? 30 : 1, // 30 days if remember me, 1 day otherwise
			secure: true,
			sameSite: "strict",
		});

		console.log("Auth token stored successfully");
	} catch (error) {
		console.error("Error storing auth token:", error);
	}
};

export const getAuthToken = () => {
	try {
		// Check sessionStorage first (most recent)
		let token = sessionStorage.getItem("authToken");
		if (token) {
			return token;
		}

		// Check localStorage
		token = localStorage.getItem("authToken");
		if (token) {
			// Also store in sessionStorage for faster access
			sessionStorage.setItem("authToken", token);
			return token;
		}

		// Check cookies as fallback
		token = Cookies.get("authToken");
		if (token) {
			console.log("Auth token found in cookies (fallback)");
			// Store in sessionStorage for faster access
			sessionStorage.setItem("authToken", token);
			return token;
		}

		console.log("No auth token found in any storage");
		return null;
	} catch (error) {
		console.error("Error retrieving auth token:", error);
		return null;
	}
};

export const removeAuthToken = () => {
	try {
		// Remove from all storage locations
		sessionStorage.removeItem("authToken");
		localStorage.removeItem("authToken");
		Cookies.remove("authToken");
	} catch (error) {
		console.error("Error removing auth token:", error);
	}
};

// Utility functions
export const validateEmail = (email) => {
	if (!email || typeof email !== "string") return false;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email.toLowerCase().trim());
};

export const sanitizeInput = (input) => {
	if (typeof input !== "string") return "";
	return input.trim().replace(/[<>'"]/g, "");
};

function validateAPIUrl(url) {
	if (!url || url.trim() === "") {
		console.log("API URL cannot be empty");
		return false;
	}

	try {
		const urlObj = new URL(url);

		// Allow HTTPS or HTTP for localhost/development
		const isSecure =
			urlObj.protocol === "https:" ||
			(urlObj.protocol === "http:" &&
				(urlObj.hostname === "localhost" ||
					urlObj.hostname.includes("replit.dev") ||
					urlObj.hostname.includes("127.0.0.1")));

		const isValidDomain = urlObj.hostname && urlObj.hostname.length > 0;

		if (!isSecure || !isValidDomain) {
			console.log("API URL must use HTTPS (or HTTP for localhost/dev)");
			return false;
		}

		return true;
	} catch (error) {
		console.log("Invalid API URL format:", error.message);
		return false;
	}
}

export const testApiConnection = async () => {
	try {
		console.log("🔍 Testing API connection to:", API_BASE_URL);
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000);

		const response = await fetch(`${API_BASE_URL}/health`, {
			method: "GET",
			signal: controller.signal,
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		});

		clearTimeout(timeoutId);

		console.log("✅ API Health Check Response:", {
			ok: response.ok,
			status: response.status,
			statusText: response.statusText,
			url: response.url,
			headers: Object.fromEntries(response.headers.entries()),
		});

		return response.ok;
	} catch (error) {
		console.error("❌ API connection test failed:", {
			name: error.name,
			message: error.message,
			stack: error.stack,
		});

		// Test with a simple CORS preflight to diagnose CORS issues
		try {
			await fetch(`${API_BASE_URL}/health`, {
				method: "OPTIONS",
				headers: {
					"Access-Control-Request-Method": "GET",
					"Access-Control-Request-Headers": "Content-Type",
				},
			});
			console.log("✅ CORS preflight check passed");
		} catch (corsError) {
			console.error("❌ CORS preflight failed:", corsError);
		}

		return false;
	}
};

// Authentication API
export const authAPI = {
	register: async (userData) => {
		return await apiRequest("/auth/register", {
			method: "POST",
			data: userData,
		});
	},

	login: async (credentials) => {
		return await apiRequest("/auth/login", {
			method: "POST",
			data: credentials,
		});
	},

	loginWithGoogle: async (token) => {
		return await apiRequest("/auth/google", {
			method: "POST",
			data: { token },
		});
	},

	logout: async () => {
		return await apiRequest("/auth/logout", {
			method: "POST",
		});
	},

	verifyEmail: async (verificationData) => {
		return await apiRequest("/auth/verify-email", {
			method: "POST",
			data: verificationData,
		});
	},

	resendVerification: async (email) => {
		return await apiRequest("/auth/resend-code", {
			method: "POST",
			data: { email },
		});
	},

	validateVerificationId: async (verificationId) => {
		return await apiRequest(
			`/auth/validate-verification-id/${verificationId}`,
			{
				method: "GET",
			},
		);
	},

	forgotPassword: async (email) => {
		return await apiRequest("/auth/forgot-password", {
			method: "POST",
			data: { email },
		});
	},

	resetPassword: async (token, newPassword) => {
		return await apiRequest("/auth/reset-password", {
			method: "POST",
			data: { token, newPassword },
		});
	},

	me: async () => {
		return await apiRequest("/auth/me", {
			method: "GET",
		});
	},

	checkEmailExists: async (email) => {
		return await apiRequest(
			`/auth/check-email?email=${encodeURIComponent(email)}`,
			{
				method: "GET",
			},
		);
	},
};

// OAuth API
export const oauthAPI = {
	registerApp: async (appData) => {
		return await apiRequest("/oauth/register", {
			method: "POST",
			data: appData,
		});
	},

	authorize: async (params) => {
		const queryString = new URLSearchParams(params).toString();
		return await apiRequest(`/oauth/authorize?${queryString}`, {
			method: "GET",
		});
	},

	exchangeToken: async (tokenData) => {
		return await apiRequest("/oauth/token", {
			method: "POST",
			data: tokenData,
		});
	},

	revokeToken: async (tokenData) => {
		return await apiRequest("/oauth/revoke", {
			method: "POST",
			data: tokenData,
		});
	},

	getUserInfo: async () => {
		return await apiRequest("/oauth/userinfo", {
			method: "GET",
		});
	},

	// OAuth Apps Management
	getApps: async () => {
		return await apiRequest("/oauth/apps", { method: "GET" });
	},

	createApp: async (appData) => {
		return await apiRequest("/oauth/apps", {
			method: "POST",
			data: appData,
		});
	},

	deleteApp: async (appId) => {
		return await apiRequest(`/oauth/apps/${appId}`, {
			method: "DELETE",
		});
	},

	regenerateSecret: async (appId) => {
		return await apiRequest(`/oauth/apps/${appId}/regenerate-secret`, {
			method: "POST",
		});
	},

	// OAuth Authorizations
	getAuthorizations: async () => {
		return await apiRequest("/oauth/authorizations", { method: "GET" });
	},

	revokeAuthorization: async (authId) => {
		return await apiRequest(`/oauth/authorizations/${authId}`, {
			method: "DELETE",
		});
	},

	// API Keys
	getApiKeys: async () => {
		return await apiRequest("/oauth/api-keys", { method: "GET" });
	},

	generateApiKey: async (keyData) => {
		return await apiRequest("/oauth/api-keys", {
			method: "POST",
			data: keyData,
		});
	},

	// OAuth Authorization Flow
	getAppInfo: async (clientId) => {
		return await apiRequest(`/oauth/apps/info/${clientId}`, { method: "GET" });
	},

	// Helper function to get authorization URL
	getAuthorizationUrl: (
		clientId,
		redirectUri,
		scope = "read write",
		state = null,
	) => {
		const params = new URLSearchParams({
			response_type: "code",
			client_id: clientId,
			redirect_uri: redirectUri,
			scope: scope,
		});

		if (state) {
			params.append("state", state);
		}

		return `${API_BASE_URL}/v1/oauth/authorize?${params.toString()}`;
	},
};

// User API
export const userAPI = {
	getAllUsers: async (params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return await apiRequest(`/users${queryString ? `?${queryString}` : ""}`, {
			method: "GET",
		});
	},

	getUser: async (username) => {
		if (username) {
			return await apiRequest(`/users/find/${username}`, {
				method: "GET",
			});
		} else {
			// If no username provided, get current user
			return await apiRequest(`/auth/me`, {
				method: "GET",
			});
		}
	},

	getProfile: async (username) => {
		return await apiRequest(`/users/find/${username}`, {
			method: "GET",
		});
	},

	updateUser: async (username, userData) => {
		return await apiRequest(`/users/${username}`, {
			method: "PUT",
			data: userData,
		});
	},

	deleteUser: async (username) => {
		return await apiRequest(`/users/${username}`, {
			method: "DELETE",
		});
	},

	updateProfile: async (url) => {
		return await apiRequest("/users/profile-picture", {
			method: "POST",
			data: { photoURL: url },
		});
	},

	getUserById: async (userId) => {
		return await apiRequest(`/users/${userId}`, {
			method: "GET",
		});
	},

	followUser: async (username) => {
		return await apiRequest(`/users/${username}/follow`, {
			method: "POST",
		});
	},

	unfollowUser: async (username) => {
		return await apiRequest(`/users/${username}/unfollow`, {
			method: "POST",
		});
	},

	getFollowers: async (username) => {
		return await apiRequest(`/users/${username}/followers`, {
			method: "GET",
		});
	},

	getFollowing: async (username) => {
		return await apiRequest(`/users/${username}/following`, {
			method: "GET",
		});
	},

	blockUser: async (username) => {
		return await apiRequest(`/users/block/${username}`, {
			method: "POST",
		});
	},

	unblockUser: async (username) => {
		return await apiRequest(`/users/unblock/${username}`, {
			method: "DELETE",
		});
	},

	searchUsers: async (query, params = {}) => {
		const searchParams = new URLSearchParams({
			search: query,
			...params,
		});
		const response = await apiRequest(
			`/users/search?query=${encodeURIComponent(query)}&limit=5`,
		);
		return response.users || [];
	},

	updateSettings: async (settings) => {
		return await apiRequest("/users/settings", {
			method: "PUT",
			data: settings,
		});
	},

	getSettings: async () => {
		return await apiRequest("/users/settings", {
			method: "GET",
		});
	},

	getUserEarnings: async () => {
		return await apiRequest("/users/analytics/earnings");
	},

	getUserStats: async (userId) => {
		return await apiRequest(`/users/${userId}/stats`);
	},

	getWaitingList: async () => {
		return await apiRequest("/users/waiting-list");
	},

	joinWaitingList: async (userData) => {
		return await apiRequest("/users/waiting-list", {
			method: "POST",
			data: userData,
		});
	},

	checkUserExists: async (uid) => {
		return await apiRequest(`/users/exists/${uid}`);
	},

	getRecommendedUsers: (params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return apiRequest(
			`/users/recommended${queryString ? `?${queryString}` : ""}`,
		);
	},
};

// Post API
export const postAPI = {
	createPost: async (postData) => {
		return await apiRequest("/posts", {
			method: "POST",
			data: postData,
		});
	},

	getPosts: async (page = 1, limit = 20, params = {}) => {
		const queryParams = new URLSearchParams({
			page: page.toString(),
			limit: limit.toString(),
			...params,
		});
		return apiRequest(`/v1/posts?${queryParams.toString()}`);
	},

	getPost: async (postId) => {
		return await apiRequest(`/posts/${postId}`, {
			method: "GET",
		});
	},

	updatePost: async (postId, postData) => {
		return await apiRequest(`/posts/${postId}`, {
			method: "PUT",
			data: postData,
		});
	},

	deletePost: async (postId) => {
		return await apiRequest(`/posts/${postId}`, {
			method: "DELETE",
		});
	},

	likePost: async (postId) => {
		return await apiRequest(`/posts/${postId}/like`, {
			method: "POST",
		});
	},

	unlikePost: async (postId) => {
		return await apiRequest(`/posts/${postId}/unlike`, {
			method: "DELETE",
		});
	},

	getPostLikes: async (postId, params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return await apiRequest(
			`/posts/${postId}/likes${queryString ? `?${queryString}` : ""}`,
		);
	},

	sharePost: async (postId) => {
		return await apiRequest(`/posts/share/${postId}`, {
			method: "POST",
		});
	},

	repost: async (postId, content = "") => {
		return await apiRequest(`/posts/${postId}/repost`, {
			method: "POST",
			data: { content },
		});
	},

	// Get reposts for a post
	getPostReposts: async (postId) => {
		return await apiRequest(`/posts/${postId}/reposts`, {
			method: "GET",
		});
	},

	trackView: async (postId) => {
		return await apiRequest(`/posts/${postId}/view`, {
			method: "POST",
		});
	},

	updatePostEngagement: async (postId, action) => {
		return await apiRequest(`/posts/${postId}/engagement`, {
			method: "POST",
			data: { action },
		});
	},

	getUserPosts: async (username, params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return await apiRequest(
			`/posts?author=${username}${queryString ? `&${queryString}` : ""}`,
			{
				method: "GET",
			},
		);
	},

	searchPosts: async (query, params = {}) => {
		const searchParams = new URLSearchParams({
			search: query,
			...params,
		});
		return await apiRequest(`/posts?${searchParams.toString()}`, {
			method: "GET",
		});
	},

	reportPost: async (postId, reason) => {
		return await apiRequest(`/posts/${postId}/report`, {
			method: "POST",
			data: { reason },
		});
	},

	getTrendingPosts: async (timeframe = "24h") => {
		return await apiRequest(`/posts/trending?timeframe=${timeframe}`, {
			method: "GET",
		});
	},

	getFollowingFeed: async (params = {}) => {
		const queryParams = new URLSearchParams(params).toString();
		return await apiRequest(
			`/posts/feed/following${queryParams ? `?${queryParams}` : ""}`,
			{
				method: "GET",
			},
		);
	},

	getCurrentUserPosts: async (params = {}) => {
		const queryParams = new URLSearchParams(params).toString();
		return await apiRequest(
			`/posts/user/me${queryParams ? `?${queryParams}` : ""}`,
			{
				method: "GET",
			},
		);
	},
};

// Poll API
export const pollAPI = {
	vote: async (pollId, optionIds) => {
		return await apiRequest(`/polls/${pollId}/vote`, {
			method: "POST",
			data: { optionIds },
		});
	},

	getResults: async (pollId) => {
		return await apiRequest(`/polls/${pollId}/results`, {
			method: "GET",
		});
	},

	getUserVote: async (pollId) => {
		return await apiRequest(`/polls/${pollId}/user-vote`, {
			method: "GET",
		});
	},
};

// Image API
export const imageAPI = {
	uploadImages: async (formData) => {
		// FormData is already created and populated in PostComposer
		// Just pass it directly to the API
		return await apiRequest("/images/upload", {
			method: "POST",
			data: formData,
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
	},

	deleteImage: async (imageId) => {
		return await apiRequest(`/images/${imageId}`, {
			method: "DELETE",
		});
	},
};

// Sessions API
export const sessionAPI = {
	getSessions: async () => {
		return await apiRequest("/sessions", {
			method: "GET",
		});
	},

	revokeSession: async (sessionId) => {
		return await apiRequest(`/sessions/${sessionId}`, {
			method: "DELETE",
		});
	},

	revokeAllSessions: async () => {
		return await apiRequest("/sessions", {
			method: "DELETE",
		});
	},
};

// Comment API
export const commentAPI = {
	getComments: async (postId, params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return await apiRequest(
			`/comments/post/${postId}${queryString ? `?${queryString}` : ""}`,
		);
	},

	createComment: async (postId, commentData) => {
		return await apiRequest(`/comments/post/${postId}`, {
			method: "POST",
			data: commentData,
		});
	},

	updateComment: async (commentId, commentData) => {
		return await apiRequest(`/comments/${commentId}`, {
			method: "PUT",
			data: commentData,
		});
	},

	deleteComment: async (commentId) => {
		return await apiRequest(`/comments/${commentId}`, {
			method: "DELETE",
		});
	},

	searchComments: async (query, params = {}) => {
		const searchParams = new URLSearchParams({
			query,
			...params,
		});
		return await apiRequest(`/comments/search?${searchParams.toString()}`);
	},

	likeComment: async (commentId) => {
		return await apiRequest(`/comments/${commentId}/like`, {
			method: "POST",
		});
	},

	getCommentLikes: async (commentId, params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return await apiRequest(
			`/comments/${commentId}/likes${queryString ? `?${queryString}` : ""}`,
		);
	},
};

// Reply API
export const replyAPI = {
	createReply: async (commentId, replyData) => {
		return await apiRequest(`/replies/comment/${commentId}`, {
			method: "POST",
			data: replyData,
		});
	},

	getCommentReplies: async (commentId, params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return await apiRequest(
			`/replies/comment/${commentId}${queryString ? `?${queryString}` : ""}`,
		);
	},

	updateReply: async (replyId, replyData) => {
		return await apiRequest(`/replies/${replyId}`, {
			method: "PUT",
			data: replyData,
		});
	},

	deleteReply: async (replyId) => {
		return await apiRequest(`/replies/${replyId}`, {
			method: "DELETE",
		});
	},
};

// Like API
export const likeAPI = {
	likeReply: async (replyId) => {
		return await apiRequest(`/likes/reply/${replyId}`, {
			method: "POST",
		});
	},
};

// Content Moderation API
export const contentModerationAPI = {
	moderateContent: async (contentData) => {
		return await apiRequest("/content/moderate", {
			method: "POST",
			data: contentData,
		});
	},

	checkImageSensitivity: async (imageUrl) => {
		return await apiRequest("/content/check-image", {
			method: "POST",
			data: { imageUrl },
		});
	},
};

// Report API
export const reportAPI = {
	createReport: async (reportData) => {
		return await apiRequest("/reports", {
			method: "POST",
			data: reportData,
		});
	},

	getUserReports: async () => {
		return await apiRequest("/reports");
	},
};

// Block API
export const blockAPI = {
	blockUser: async (userId) => {
		return await apiRequest(`/blocks/user/${userId}`, {
			method: "POST",
		});
	},

	unblockUser: async (userId) => {
		return await apiRequest(`/blocks/user/${userId}`, {
			method: "DELETE",
		});
	},

	getBlockedUsers: async () => {
		return await apiRequest("/blocks");
	},

	restrictUser: async (userId, reason) => {
		return await apiRequest(`/blocks/restrict/${userId}`, {
			method: "POST",
			data: { reason },
		});
	},

	removeRestriction: async (userId) => {
		return await apiRequest(`/blocks/restrict/${userId}`, {
			method: "DELETE",
		});
	},
};

// Recommendation API
export const recommendationAPI = {
	getUserRecommendations: async (params = {}) => {
		const queryString = new URLSearchParams({
			type: "users",
			limit: 10,
			...params,
		}).toString();
		return await apiRequest(
			`/recommendations${queryString ? `?${queryString}` : ""}`,
		);
	},

	getPostRecommendations: async (params = {}) => {
		const queryString = new URLSearchParams({
			type: "posts",
			limit: 10,
			...params,
		}).toString();
		return await apiRequest(
			`/recommendations${queryString ? `?${queryString}` : ""}`,
		);
	},

	getTrendingHashtags: async (params = {}) => {
		const queryString = new URLSearchParams({
			limit: 10,
			...params,
		}).toString();
		return await apiRequest(
			`/recommendations/trending${queryString ? `?${queryString}` : ""}`,
		);
	},
};

// Analytics API
export const analyticsAPI = {
	getUserAnalytics: async (period = "30d") => {
		return await apiRequest(`/analytics/user?period=${period}`);
	},

	getPostAnalytics: async (postId) => {
		return await apiRequest(`/analytics/post/${postId}`);
	},

	getPlatformAnalytics: async () => {
		return await apiRequest("/analytics/platform");
	},

	getEarningsAnalytics: async (period = "month") => {
		return await apiRequest(`/analytics/earnings?period=${period}`);
	},
};

// Business/Advertising API
export const businessAPI = {
	// Dashboard
	getDashboard: async () => {
		return await apiRequest("/business/dashboard", { method: "GET" });
	},

	// Ad Campaigns
	getCampaigns: async () => {
		return await apiRequest("/business/campaigns", { method: "GET" });
	},

	createCampaign: async (data) => {
		return await apiRequest("/business/campaigns", {
			method: "POST",
			data: data,
		});
	},

	updateCampaign: async (id, data) => {
		return await apiRequest(`/business/campaigns/${id}`, {
			method: "PUT",
			data: data,
		});
	},

	deleteCampaign: async (id) => {
		return await apiRequest(`/business/campaigns/${id}`, {
			method: "DELETE",
		});
	},

	getCampaign: async (id) => {
		return await apiRequest(`/business/campaigns/${id}`, { method: "GET" });
	},

	pauseCampaign: async (id) => {
		return await apiRequest(`/business/campaigns/${id}/pause`, {
			method: "POST",
		});
	},

	resumeCampaign: async (id) => {
		return await apiRequest(`/business/campaigns/${id}/resume`, {
			method: "POST",
		});
	},

	// Analytics
	getCampaignAnalytics: async (id, params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return await apiRequest(
			`/business/campaigns/${id}/analytics${queryString ? `?${queryString}` : ""}`,
		);
	},

	getOverallAnalytics: async (params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return await apiRequest(
			`/business/analytics${queryString ? `?${queryString}` : ""}`,
			{ method: "GET" },
		);
	},

	// Ad Tracking
	trackAdInteraction: async (interactionData) => {
		return await apiRequest("/business/track", {
			method: "POST",
			data: interactionData,
		});
	},

	// Credits
	getCredits: async () => {
		return await apiRequest("/credits", { method: "GET" });
	},

	getCreditsPackages: async () => {
		return await apiRequest("/credits/packages", { method: "GET" });
	},

	purchaseCredits: async (data) => {
		return await apiRequest("/credits/purchase", {
			method: "POST",
			data: data,
		});
	},

	// Payment Methods for Business
	getPaymentMethods: async () => {
		return await apiRequest("/payments/methods", { method: "GET" });
	},
};

// Payment API
export const paymentAPI = {
	getProviders: async () => {
		return await apiRequest("/payments/providers", {
			method: "GET",
		});
	},

	addPaymentMethod: async (paymentData) => {
		return await apiRequest("/payments/methods", {
			method: "POST",
			data: paymentData,
		});
	},

	// Get payment methods
	getPaymentMethods: () => apiRequest("/payments/methods", { method: "GET" }),

	// Get payment providers and membership plans
	getPaymentProviders: () =>
		apiRequest("/payments/providers", { method: "GET" }),

	deletePaymentMethod: async (paymentMethodId) => {
		return await apiRequest(`/payments/methods/${paymentMethodId}`, {
			method: "DELETE",
		});
	},

	purchaseMembership: async (purchaseData) => {
		return await apiRequest("/payments/purchase-membership", {
			method: "POST",
			data: purchaseData,
		});
	},
};

// Search API
export const searchAPI = {
	globalSearch: async (query, filters = {}) => {
		const params = new URLSearchParams({
			query,
			...filters,
		});
		return await apiRequest(`/search/global?${params.toString()}`);
	},

	searchUsers: async (query, params = {}) => {
		const searchParams = new URLSearchParams({
			search: query,
			...params,
		});
		return await apiRequest(`/users?${searchParams.toString()}`);
	},

	searchPosts: async (query, params = {}) => {
		const queryParams = new URLSearchParams({
			search: query,
			limit: params.limit || 20,
			...params,
		});
		return await apiRequest(`/posts?${queryParams.toString()}`);
	},

	searchHashtags: async (query) => {
		return await apiRequest(
			`/search/hashtags?query=${encodeURIComponent(query)}`,
		);
	},
};

// TFA API
export const tfaAPI = {
	setup: async () => {
		return await apiRequest("/2fa/setup", {
			method: "POST",
		});
	},

	verifySetup: async (token) => {
		return await apiRequest("/2fa/verify-setup", {
			method: "POST",
			data: { token },
		});
	},

	disable: async (password) => {
		return await apiRequest("/2fa/disable", {
			method: "POST",
			data: { password },
		});
	},

	getStatus: async () => {
		return await apiRequest("/2fa/status", {
			method: "GET",
		});
	},

	regenerateBackupCodes: async (password) => {
		return await apiRequest("/2fa/regenerate-backup-codes", {
			method: "POST",
			data: { password },
		});
	},
};

// Notification API
export const notificationAPI = {
	// Get user notifications
	async getUserNotifications(limit = 20, unread = false, since = null) {
		const params = new URLSearchParams();
		if (limit) params.append('limit', limit);
		if (unread) params.append('unread', 'true');
		if (since) params.append('since', since);

		const response = await apiRequest(`/v1/notifications?${params.toString()}`, {
			method: 'GET'
		});
		return response;
	},

	// Send notification
	async sendNotification(notificationData) {
		const response = await apiRequest('/v1/notifications', {
			method: 'POST',
			body: JSON.stringify(notificationData)
		});
		return response;
	},

	// Mark notification as read
	async markAsRead(notificationId) {
		const response = await apiRequest(`/v1/notifications/${notificationId}/read`, {
			method: 'PUT'
		});
		return response;
	},

	// Mark all notifications as read
	async markAllAsRead() {
		const response = await apiRequest('/v1/notifications/read-all', {
			method: 'PUT'
		});
		return response;
	},

	// Delete notification
	async deleteNotification(notificationId) {
		const response = await apiRequest(`/v1/notifications/${notificationId}`, {
			method: 'DELETE'
		});
		return response;
	},

	// Get notification settings
	async getSettings() {
		const response = await apiRequest('/v1/notifications/settings', {
			method: 'GET'
		});
		return response;
	},

	// Update notification settings
	async updateSettings(settings) {
		const response = await apiRequest('/v1/notifications/settings', {
			method: 'PUT',
			body: JSON.stringify(settings)
		});
		return response;
	}
};


// Live Stream API
export const liveStreamAPI = {
	getLiveStreams: async (params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return await apiRequest(
			`/live-streams${queryString ? `?${queryString}` : ""}`,
		);
	},

	createStream: async (streamData) => {
		return await apiRequest("/live-streams", {
			method: "POST",
			data: streamData,
		});
	},

	endStream: async (streamId) => {
		return await apiRequest(`/live-streams/${streamId}/end`, {
			method: "POST",
		});
	},

	joinStream: async (streamId) => {
		return await apiRequest(`/live-streams/${streamId}/join`, {
			method: "POST",
		});
	},

	leaveStream: async (streamId) => {
		return await apiRequest(`/live-streams/${streamId}/leave`, {
			method: "POST",
		});
	},
};

// Hashtag API
export const hashtagAPI = {
	getTrendingHashtags: async () => {
		return await apiRequest("/hashtags/trending");
	},

	getHashtagPosts: async (hashtag, params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return await apiRequest(
			`/hashtags/${encodeURIComponent(hashtag)}/posts${queryString ? `?${queryString}` : ""}`,
		);
	},

	followHashtag: async (hashtag) => {
		return await apiRequest(`/hashtags/${encodeURIComponent(hashtag)}/follow`, {
			method: "POST",
		});
	},
};

// Subscription API
export const subscriptionAPI = {
	getSubscriptionInfo: async () => {
		return await apiRequest("/subscriptions/info");
	},

	upgradeSubscription: async (tier, paymentMethodId) => {
		return await apiRequest("/subscriptions/upgrade", {
			method: "POST",
			data: { tier, paymentMethodId },
		});
	},

	cancelSubscription: async () => {
		return await apiRequest("/subscriptions/cancel", {
			method: "POST",
		});
	},

	// Creator subscription methods
	subscribeToCreator: async (subscriptionData) => {
		return await apiRequest("/subscriptions/subscribe", {
			method: "POST",
			data: subscriptionData,
		});
	},

	unsubscribeFromCreator: async (creatorId) => {
		return await apiRequest(`/subscriptions/unsubscribe/${creatorId}`, {
			method: "POST",
		});
	},

	getCreatorSubscriptions: async () => {
		return await apiRequest("/subscriptions/my-subscriptions");
	},

	getSubscribers: async () => {
		return await apiRequest("/subscriptions/my-subscribers");
	},

	sendTip: async (tipData) => {
		return await apiRequest("/subscriptions/tip", {
			method: "POST",
			data: tipData,
		});
	},

	sendDonation: async (donationData) => {
		return await apiRequest("/subscriptions/donate", {
			method: "POST",
			data: donationData,
		});
	},

	// Get subscription tiers for a creator
	getSubscriptionTiers: async (creatorId) => {
		return await apiRequest(`/subscriptions/tiers/${creatorId}`);
	},

	// Get subscription status with a creator
	getSubscriptionStatus: async (creatorId) => {
		return await apiRequest(`/subscriptions/status/${creatorId}`);
	},

	// Get subscription history
	getSubscriptionHistory: async (params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return await apiRequest(
			`/subscriptions/history${queryString ? `?${queryString}` : ""}`,
		);
	},

	// Confirm payment after PayPal redirect
	confirmPayment: async (paymentData) => {
		return await apiRequest("/payments/confirm", {
			method: "POST",
			data: paymentData,
		});
	},
};

// Admin API
export const adminAPI = {
	getUsers: async (params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return await apiRequest(
			`/admin/users${queryString ? `?${queryString}` : ""}`,
		);
	},

	banUser: async (userId, reason) => {
		return await apiRequest(`/admin/users/${userId}/ban`, {
			method: "POST",
			data: { reason },
		});
	},

	unbanUser: async (userId) => {
		return await apiRequest(`/admin/users/${userId}/unban`, {
			method: "POST",
		});
	},

	moderatePost: async (postId, action, reason) => {
		return await apiRequest(`/admin/posts/${postId}/moderate`, {
			method: "POST",
			data: { action, reason },
		});
	},
};

// ActivityPub API
export const activityPubAPI = {
	getWebfinger: async (resource) => {
		return await apiRequest(
			`/.well-known/webfinger?resource=${encodeURIComponent(resource)}`,
		);
	},

	getUserActor: async (username) => {
		return await apiRequest(`/activitypub/users/${username}`, {
			headers: {
				Accept: "application/activity+json",
			},
		});
	},

	getUserOutbox: async (username, page = null) => {
		const url = `/activitypub/users/${username}/outbox${page ? `?page=${page}` : ""}`;
		return await apiRequest(url, {
			headers: {
				Accept: "application/activity+json",
			},
		});
	},

	getUserFollowers: async (username) => {
		return await apiRequest(`/activitypub/users/${username}/followers`, {
			headers: {
				Accept: "application/activity+json",
			},
		});
	},

	getUserFollowing: async (username) => {
		return await apiRequest(`/activitypub/users/${username}/following`, {
			headers: {
				Accept: "application/activity+json",
			},
		});
	},

	getPostActivity: async (postId) => {
		return await apiRequest(`/activitypub/posts/${postId}`, {
			headers: {
				Accept: "application/activity+json",
			},
		});
	},
};

// Backward compatibility - keeping the original api object
export const api = {
	// Authentication
	login: authAPI.login,
	register: authAPI.register,
	logout: authAPI.logout,
	me: authAPI.me,
	verifyEmail: authAPI.verifyEmail,
	forgotPassword: authAPI.forgotPassword,
	resetPassword: authAPI.resetPassword,

	// Google OAuth endpoints
	googleLogin: (googleData) =>
		apiRequest("/auth/google", { method: "POST", data: googleData }),
	googleSignup: (googleData) =>
		apiRequest("/auth/google", { method: "POST", data: googleData }),

	// Posts
	getPosts: postAPI.getPosts,
	createPost: postAPI.createPost,
	getPost: postAPI.getPost,
	updatePost: postAPI.updatePost,
	deletePost: postAPI.deletePost,
	likePost: postAPI.likePost,

	// Polls
	votePoll: (postId, optionIndex) =>
		apiRequest(`/posts/${postId}/vote`, "POST", { optionIndex }),

	// Users
	getUser: userAPI.getUser,
	updateUser: userAPI.updateUser,
	updateProfile: userAPI.updateProfile,
	getUserById: userAPI.getUserById,
	followUser: userAPI.followUser,
	getWaitingList: userAPI.getWaitingList,
	joinWaitingList: userAPI.joinWaitingList,

	// Search
	globalSearch: searchAPI.globalSearch,
	searchUsers: searchAPI.searchUsers,
	searchPosts: searchAPI.searchPosts,
	searchHashtags: searchAPI.searchHashtags,

	// Analytics
	getEarningsAnalytics: analyticsAPI.getEarningsAnalytics,
	getUserAnalytics: analyticsAPI.getUserAnalytics,
	getPostAnalytics: analyticsAPI.getPostAnalytics,

	// Notifications
	getNotifications: notificationAPI.getNotifications,
	markAsRead: notificationAPI.markAsRead,
	markAllAsRead: notificationAPI.markAllAsRead,
	deleteNotification: notificationAPI.deleteNotification,

	// Live Streams
	getLiveStreams: liveStreamAPI.getLiveStreams,
	createStream: liveStreamAPI.createStream,
	endStream: liveStreamAPI.endStream,
	joinStream: liveStreamAPI.joinStream,
	leaveStream: liveStreamAPI.leaveStream,

	// Hashtags
	getTrendingHashtags: hashtagAPI.getTrendingHashtags,
	getHashtagPosts: hashtagAPI.getHashtagPosts,
	followHashtag: hashtagAPI.followHashtag,

	// Subscriptions
	getSubscriptionInfo: subscriptionAPI.getSubscriptionInfo,
	upgradeSubscription: subscriptionAPI.upgradeSubscription,
	cancelSubscription: subscriptionAPI.cancelSubscription,

	// Admin
	getAdminUsers: adminAPI.getUsers,
	banUser: adminAPI.banUser,
	unbanUser: adminAPI.unbanUser,
	moderatePost: adminAPI.moderatePost,

	// TFA
	setupTfa: tfaAPI.setup,
	verifyTfaSetup: tfaAPI.verifySetup,
	disableTfa: tfaAPI.disable,
	getTfaStatus: tfaAPI.getStatus,
	regenerateBackupCodes: tfaAPI.regenerateBackupCodes,
};

// Placeholder for createRateLimiter if it's defined elsewhere
function createRateLimiter(limit, interval) {
	const requests = [];
	return async (callback) => {
		const now = Date.now();
		// Remove old requests
		while (requests.length > 0 && requests[0] <= now - interval) {
			requests.shift();
		}
		// If limit is reached, wait for the next available slot
		if (requests.length >= limit) {
			const waitUntil = requests[0] + interval;
			await new Promise((resolve) => setTimeout(resolve, waitUntil - now));
		}
		// Add current request and execute callback
		requests.push(Date.now());
		return callback();
	};
}

// Export commonly used rate limiters
export const searchRateLimiter = createRateLimiter(10, 60000); // 10 requests per minute
export const postRateLimiter = createRateLimiter(5, 60000); // 5 posts per minute
export const commentRateLimiter = createRateLimiter(20, 60000); // 20 comments per minute
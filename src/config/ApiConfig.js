/** @format */

import Cookies from "js-cookie";
import axios from "axios";

// Always use proxy for both development and production
const isUsingProxy = true;

// Determine API endpoints based on environment
const API_ENDPOINTS = (() => {
	if (process.env.NODE_ENV === "production") {
		// In production, use HTTPS URLs only
		const currentDomain = window.location.origin;
		const hostname = window.location.hostname;
		
		// For Replit environments, use the current domain as-is since SSR handles routing
		if (hostname.includes('replit.dev') || hostname.includes('replit.app')) {
			return [
				currentDomain, // Use current domain as-is for Replit
				"https://api.dopp.eu.org"
			];
		}
		
		// For other production environments, check if port 5000 is needed
		if (currentDomain.includes(':5000')) {
			return [
				currentDomain, // Use current domain as-is if it already has port 5000
				"https://api.dopp.eu.org"
			];
		} else {
			return [
				currentDomain + ":5000", // Add port 5000 if not present
				"https://api.dopp.eu.org"
			];
		}
	} else {
		// In development, prefer local proxy, fallback to external
		return [
			`${window.location.protocol}//${window.location.hostname}:5000`,
			"https://api.dopp.eu.org"
		];
	}
})();

// Current active API base URL
let API_BASE_URL = API_ENDPOINTS[0];

// Debug logging for production network issues
console.log("🔍 API Configuration Debug:", {
	NODE_ENV: process.env.NODE_ENV,
	hostname: window.location.hostname,
	isUsingProxy,
	API_ENDPOINTS,
	currentAPIUrl: API_ENDPOINTS[0]
});

// Validate API URL is HTTPS (skip validation for proxy URLs and empty strings)
if (API_BASE_URL && API_BASE_URL !== "" && !API_BASE_URL.startsWith("https://") && !API_BASE_URL.startsWith("/")) {
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
		this.currentBaseURL = API_ENDPOINTS[this.currentEndpointIndex];
	}

	async makeRequest(endpoint, options = {}) {
		// Add /v1 prefix if not already present
		const normalizedEndpoint = endpoint.startsWith('/v1') ? endpoint : `/v1${endpoint}`;
		const url = `${this.currentBaseURL}${normalizedEndpoint}`;

		console.log('🚀 Making axios request:', {
			url,
			method: options.method || 'GET',
			hasData: !!options.data,
			timestamp: new Date().toISOString()
		});

		try {
			const response = await apiClient({
				url,
				method: options.method || 'GET',
				data: options.data,
				headers: {
					'Content-Type': 'application/json',
					...options.headers,
				},
				withCredentials: true,
				...options,
			});

			console.log("📥 Axios response received:", {
				status: response.status,
				statusText: response.statusText,
				url: response.config.url,
				method: response.config.method,
			});

			return {
				ok: response.status >= 200 && response.status < 300,
				status: response.status,
				statusText: response.statusText,
				data: response.data,
				headers: response.headers,
			};
		} catch (error) {
			console.log("💥 Axios request failed:", {
				url,
				method: options.method || 'GET',
				error: error.name,
				message: error.message,
				status: error.response?.status,
				statusText: error.response?.statusText,
				data: error.response?.data,
				code: error.code,
				config: {
					baseURL: error.config?.baseURL,
					url: error.config?.url,
					method: error.config?.method,
					headers: error.config?.headers
				}
			});

			if (error.response) {
				// Server error - API responded with error status
				let errorMsg;

				if (error.response.status === 405) {
					errorMsg = `Method ${options.method || 'GET'} not allowed for ${endpoint}. Check if the endpoint supports this HTTP method.`;
					console.log("🚨 405 Method Not Allowed Details:", {
						requestedMethod: options.method || 'GET',
						endpoint,
						allowedMethods: error.response.headers?.allow || 'Not specified',
						url: error.config?.url
					});
				} else {
					errorMsg = error.response.data?.message ||
						error.response.statusText ||
						`Server error (${error.response.status})`;
				}

				console.log("🚨 Server Error Details:", {
					status: error.response.status,
					headers: error.response.headers,
					data: error.response.data
				});
				throw new Error(errorMsg);
			} else if (error.request) {
				// Network error - request was made but no response
				console.log("🌐 Network Error Details:", {
					request: error.request,
					readyState: error.request.readyState,
					status: error.request.status,
					responseURL: error.request.responseURL
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
		let lastError;

		for (let i = 0; i < API_ENDPOINTS.length; i++) {
			const currentEndpoint = API_ENDPOINTS[i];
			this.currentBaseURL = currentEndpoint; // Update the base URL

			console.log(`🔄 Trying endpoint: ${currentEndpoint}`);

			try {
				const response = await this.makeRequest(endpoint, options);
				this.currentEndpointIndex = i;
				return response;
			} catch (error) {
				lastError = error;
				console.log(`❌ Request failed on ${currentEndpoint}:`, error.message);

				// Continue to next endpoint
				continue;
			}
		}

		// All endpoints failed
		console.log("🚨 All API endpoints failed");
		throw lastError;
	}
}

// Create HTTP client instance
const httpClient = new HttpClient();

// Main API request function
export const apiRequest = async (endpoint, options = {}) => {
	try {
		const response = await httpClient.requestWithFailover(endpoint, options);

		if (!response.ok) {
			throw new Error(
				response.data?.message ||
					`HTTP ${response.status}: ${response.statusText}`,
			);
		}

		return response.data;
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
			console.log("Auth token found in sessionStorage (current session)");
			return token;
		}

		// Check localStorage
		token = localStorage.getItem("authToken");
		if (token) {
			console.log("Auth token found in localStorage (persistent)");
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

		console.log("Auth token removed from all storage locations");
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
		const isSecure = urlObj.protocol === "https:" ||
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
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}
		});

		clearTimeout(timeoutId);

		console.log("✅ API Health Check Response:", {
			ok: response.ok,
			status: response.status,
			statusText: response.statusText,
			url: response.url,
			headers: Object.fromEntries(response.headers.entries())
		});

		return response.ok;
	} catch (error) {
		console.error("❌ API connection test failed:", {
			name: error.name,
			message: error.message,
			stack: error.stack
		});

		// Test with a simple CORS preflight to diagnose CORS issues
		try {
			await fetch(`${API_BASE_URL}/health`, {
				method: 'OPTIONS',
				headers: {
					'Access-Control-Request-Method': 'GET',
					'Access-Control-Request-Headers': 'Content-Type'
				}
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

	loginWithGoogle: async (idToken) => {
		return await apiRequest("/auth/google", {
			method: "POST",
			data: { idToken },
		});
	},

	logout: async () => {
		return await apiRequest("/auth/logout", {
			method: "POST",
		});
	},

	verifyEmail: async (verificationData) => {
		return await apiRequest("/auth/verify", {
			method: "POST",
			data: verificationData,
		});
	},

	resendVerification: async (email) => {
		return await apiRequest("/auth/resend-verification", {
			method: "POST",
			data: { email },
		});
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
};

// User API
export const userAPI = {
	getProfile: async (username) => {
		return await apiRequest(`/users/profile/${username}`, {
			method: "GET",
		});
	},

	updateProfile: async (userData) => {
		return await apiRequest("/users/profile", {
			method: "PUT",
			data: userData,
		});
	},

	getUser: async () => {
		return await apiRequest("/users/me", {
			method: "GET",
		});
	},

	getUserById: async (userId) => {
		return await apiRequest(`/users/${userId}`, {
			method: "GET",
		});
	},

	followUser: async (username) => {
		return await apiRequest(`/users/follow/${username}`, {
			method: "POST",
		});
	},

	unfollowUser: async (username) => {
		return await apiRequest(`/users/unfollow/${username}`, {
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
			q: query, // Use 'q' parameter instead of 'query'
			...params,
		});
		return await apiRequest(`/search/users?${searchParams.toString()}`);
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

	getAllUsers: async () => {
		return await apiRequest("/users");
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

	// New endpoints from API documentation
	checkUserExists: async (uid) => {
		return await apiRequest(`/users/exists/${uid}`);
	},

	checkEmailExists: async (email) => {
		return await apiRequest(`/users/email-exists`, {
			method: "POST",
			data: { email },
		});
	},

	isAdmin: async (uid) => {
		return await apiRequest(`/users/${uid}/admin`);
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

	getPosts: async (page = 1, limit = 10) => {
		return await apiRequest(`/posts?page=${page}&limit=${limit}`, {
			method: "GET",
		});
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

	getUserPosts: async (username, page = 1, limit = 10) => {
		return await apiRequest(
			`/posts/user/${username}?page=${page}&limit=${limit}`,
			{
				method: "GET",
			},
		);
	},

	searchPosts: async (query) => {
		return await apiRequest(`/posts/search?q=${encodeURIComponent(query)}`, {
			method: "GET",
		});
	},

	sharePost: async (postId) => {
		return await apiRequest(`/posts/${postId}/share`, {
			method: "POST",
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
		return await apiRequest(`/posts/feed/following${queryParams ? `?${queryParams}` : ""}`, {
			method: "GET",
		});
	},

	getCurrentUserPosts: async (params = {}) => {
		const queryParams = new URLSearchParams(params).toString();
		return await apiRequest(`/posts/user/me${queryParams ? `?${queryParams}` : ""}`, {
			method: "GET",
		});
	},

	// New endpoints from API documentation
	getPostLikes: async (postId, params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return await apiRequest(
			`/posts/${postId}/likes${queryString ? `?${queryString}` : ""}`,
		);
	},

	updatePostEngagement: async (postId, action) => {
		return await apiRequest(`/posts/${postId}/engagement`, {
			method: "POST",
			data: { action },
		});
	},
};

export const imageAPI = {
	uploadImage: async (imageFile) => {
		const formData = new FormData();
		formData.append("image", imageFile);

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

	// Comment likes
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

// Like API
export const likeAPI = {
	likeReply: async (replyId) => {
		return await apiRequest(`/likes/reply/${replyId}`, {
			method: "POST",
		});
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

	getPaymentMethods: async () => {
		return await apiRequest("/payments/methods", {
			method: "GET",
		});
	},

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
			q: query, // Use 'q' parameter instead of 'query'
			...params,
		});
		return await apiRequest(`/search/users?${searchParams.toString()}`);
	},

	searchPosts: async (query, params = {}) => {
		const searchParams = new URLSearchParams({
			search: query,
			limit: params.limit || 20,
			...params,
		});
		return await apiRequest(`/posts?${searchParams.toString()}`);
	},

	searchHashtags: async (query) => {
		return await apiRequest(
			`/search/hashtags?query=${encodeURIComponent(query)}`,
		);
	},
};

// Analytics API
export const analyticsAPI = {
	getEarningsAnalytics: async (period = "month") => {
		return await apiRequest(`/analytics/earnings?period=${period}`);
	},

	getUserAnalytics: async (userId, period = "month") => {
		return await apiRequest(`/analytics/user/${userId}?period=${period}`);
	},

	getPostAnalytics: async (postId) => {
		return await apiRequest(`/analytics/post/${postId}`);
	},
};

// Notification API
export const notificationAPI = {
	getNotifications: async (params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return await apiRequest(
			`/notifications${queryString ? `?${queryString}` : ""}`,
		);
	},

	markAsRead: async (notificationId) => {
		return await apiRequest(`/notifications/${notificationId}/read`, {
			method: "PUT",
		});
	},

	markAllAsRead: async () => {
		return await apiRequest("/notifications/mark-all-read", {
			method: "PUT",
		});
	},

	deleteNotification: async (notificationId) => {
		return await apiRequest(`/notifications/${notificationId}`, {
			method: "DELETE",
		});
	},
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
	googleLogin: (googleData) => apiRequest('/auth/google', { method: 'POST', data: googleData }),
	googleSignup: (googleData) => apiRequest('/auth/google', { method: 'POST', data: googleData }),

	// Posts
	getPosts: postAPI.getPosts,
	createPost: postAPI.createPost,
	getPost: postAPI.getPost,
	updatePost: postAPI.updatePost,
	deletePost: postAPI.deletePost,
	likePost: postAPI.likePost,

	// Users
	getUser: userAPI.getUser,
	updateProfile: userAPI.updateProfile,
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
};

// Placeholder for createRateLimiter if it's defined elsewhere
// If createRateLimiter is not globally available, you might need to import it
// or define it here. For now, assuming it's available.
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
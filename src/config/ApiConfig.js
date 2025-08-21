/** @format */

import Cookies from "js-cookie";
import axios from "axios";

// Check if we're using proxy (in development)
const isUsingProxy =
	process.env.NODE_ENV === "development" &&
	(window.location.hostname.includes("replit") ||
		window.location.hostname.includes("repl.co"));

// Multiple API endpoints for failover
const API_ENDPOINTS = isUsingProxy
	? [
			"/v1", // Use proxy in development
			"https://social.dopp.eu.org/v1",
		]
	: [
			process.env.REACT_APP_API_URL || "https://social.dopp.eu.org/v1",
			"https://social.dopp.eu.org/v1",
		];

// Current active API base URL
let API_BASE_URL = API_ENDPOINTS[0];

// Validate API URL is HTTPS (skip validation for proxy URLs)
if (!API_BASE_URL.startsWith("https://") && !API_BASE_URL.startsWith("/")) {
	console.error("API URL must use HTTPS");
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
	}

	async makeRequest(endpoint, options = {}) {
		const url = `${API_BASE_URL}${endpoint}`;

		try {
			console.log("🚀 Making axios request:", {
				url,
				method: options.method || "GET",
				hasData: !!options.data,
				timestamp: new Date().toISOString(),
			});

			const response = await apiClient({
				url,
				method: options.method || "GET",
				data: options.data,
				headers: options.headers,
				...options,
			});

			console.log("📥 Axios response received:", {
				status: response.status,
				statusText: response.statusText,
				url: response.config.url,
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
				error: error.name,
				message: error.message,
				status: error.response?.status,
				data: error.response?.data,
			});

			if (error.response) {
				// Server error
				throw new Error(
					error.response.data?.message ||
						error.response.statusText ||
						"Server error",
				);
			} else if (error.request) {
				// Network error
				throw new Error(
					"Network connectivity issue detected. Please check your internet connection and try again.",
				);
			} else {
				// Other error
				throw new Error(error.message || "Request failed");
			}
		}
	}

	async requestWithFailover(endpoint, options = {}) {
		let lastError;

		for (let i = 0; i < API_ENDPOINTS.length; i++) {
			const currentEndpoint = API_ENDPOINTS[i];
			API_BASE_URL = currentEndpoint;

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

export const testApiConnection = async () => {
	try {
		const response = await fetch(`${API_BASE_URL}/health`, {
			method: "GET",
			timeout: 5000,
		});
		return response.ok;
	} catch (error) {
		console.error("API connection test failed:", error);
		return false;
	}
};

// Authentication API
export const authAPI = {
	login: async (credentials) => {
		return await apiRequest("/auth/login", {
			method: "POST",
			data: credentials,
		});
	},

	register: async (userData) => {
		return await apiRequest("/auth/register", {
			method: "POST",
			data: userData,
		});
	},

	logout: async () => {
		return await apiRequest("/auth/logout", {
			method: "POST",
		});
	},

	me: async () => {
		return await apiRequest("/auth/me");
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

	googleAuth: async (token) => {
		return await apiRequest("/auth/google", {
			method: "POST",
			data: { token },
		});
	},

	validateVerificationId: async (verificationId) => {
		return await apiRequest(`/auth/validate-verification-id/${verificationId}`);
	},
};

// User API
export const userAPI = {
	getAllUsers: async () => {
		return await apiRequest("/users");
	},

	getUser: async (username) => {
		return await apiRequest(`/users/${username}`);
	},

	updateProfile: async (username, userData) => {
		return await apiRequest(`/users/${username}`, {
			method: "PUT",
			data: userData,
		});
	},

	followUser: async (username) => {
		return await apiRequest(`/users/${username}/follow`, {
			method: "POST",
		});
	},

	getFollowers: async (username) => {
		return await apiRequest(`/users/${username}/followers`);
	},

	getFollowing: async (username) => {
		return await apiRequest(`/users/${username}/following`);
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
	getPosts: async (page = 1, limit = 20, additionalParams = {}) => {
		const params = new URLSearchParams({
			...additionalParams,
		});

		// Add limit to params if provided
		if (limit) {
			params.set("limit", limit.toString());
		}

		if (page) {
			params.set("page", page.toString());
		}

		// Add cursor for pagination instead of page
		if (additionalParams.cursor) {
			params.set("cursor", additionalParams.cursor);
		}

		return await apiRequest(
			`/posts${params.toString() ? `?${params.toString()}` : ""}`,
		);
	},

	getPost: async (postId) => {
		return await apiRequest(`/posts/${postId}`);
	},

	createPost: async (postData) => {
		return await apiRequest("/posts", {
			method: "POST",
			data: postData,
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

	trackView: async (postId) => {
		return await apiRequest(`/posts/${postId}/view`, {
			method: "POST",
		});
	},

	likePost: async (postId) => {
		return await apiRequest(`/posts/${postId}/like`, {
			method: "POST",
		});
	},

	sharePost: async (postId) => {
		return await apiRequest(`/posts/share/${postId}`, {
			method: "POST",
		});
	},

	getFollowingFeed: async (params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return await apiRequest(
			`/posts/feed/following${queryString ? `?${queryString}` : ""}`,
		);
	},

	getCurrentUserPosts: async () => {
		return await apiRequest("/posts/user/me");
	},

	searchPosts: async (query, page = 1) => {
		return await apiRequest(
			`/posts?search=${encodeURIComponent(query)}&page=${page}`,
		);
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
	uploadImages: async (formData) => {
		return await apiRequest("/images/upload", {
			method: "POST",
			data: formData,
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
	},
};

// Sessions API
export const sessionAPI = {
	getSessions: async () => {
		return await apiRequest("/sessions");
	},

	revokeSession: async (sessionId) => {
		return await apiRequest(`/sessions/${sessionId}`, {
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
		return await apiRequest(`/search/comments?${searchParams.toString()}`);
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
	addPaymentMethod: async (paymentData) => {
		return await apiRequest("/payments/methods", {
			method: "POST",
			data: paymentData,
		});
	},

	getPaymentMethods: async () => {
		return await apiRequest("/payments/methods");
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
			query,
			...params,
		});
		return await apiRequest(`/search/users?${searchParams.toString()}`);
	},

	searchPosts: async (query, params = {}) => {
		const searchParams = new URLSearchParams({
			query,
			...params,
		});
		return await apiRequest(`/search/posts?${searchParams.toString()}`);
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

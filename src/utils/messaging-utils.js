import { initializeOneSignal, getOneSignalPlayerId, setOneSignalExternalUserId, requestNotificationPermission as requestOneSignalPermission } from "../config/OneSignalConfig";
// Firestore imports removed since notifications are handled by API

/**
 * Initialize OneSignal and set user ID
 * @param {string} uid - User's unique identifier
 * @returns {Promise<boolean>} Success status
 */
export const initializeNotifications = async (uid) => {
	try {
		if (typeof window === "undefined") return false;

		// Initialize OneSignal
		await initializeOneSignal();

		// Set external user ID for targeting
		await setOneSignalExternalUserId(uid);

		// Get player ID and save to Firestore
		const playerId = await getOneSignalPlayerId();
		if (playerId) {
			await savePlayerIdToFirestore(playerId, uid);
			return true;
		}

		return false;
	} catch (error) {
		console.error("Error initializing notifications:", error);
		return false;
	}
};

/**
 * Request notification permission
 * @returns {Promise<boolean>} Permission granted status
 */
export const requestNotificationPermission = async () => {
	try {
		if (typeof window === "undefined") return false;

		const permission = await requestOneSignalPermission();
		console.log("Notification permission:", permission);
		return permission;
	} catch (error) {
		console.error("Error requesting notification permission:", error);
		return false;
	}
};

/**
 * Save OneSignal player ID via API
 * @param {string} playerId - OneSignal player ID
 * @param {string} uid - User's unique identifier
 */
const savePlayerIdToFirestore = async (playerId, uid) => {
	try {
		// This would typically be handled by the API when setting up notifications
		console.log("OneSignal player ID would be saved via API:", playerId);
	} catch (error) {
		console.error("Error saving player ID:", error);
	}
};

/**
 * Send like notification to post author
 * @param {string} postId - Post ID
 * @param {Object} post - Post object
 * @param {Object} currentUser - Current user object
 */
export const sendLikeNotification = async (postId, post, currentUser) => {
	try {
		if (!post?.author?.uid || !currentUser?.uid) {
			console.warn('Missing required user data for like notification');
			return;
		}

		// Don't send notification if user likes their own post
		if (post.author.uid === currentUser.uid) return;

		console.log('Like notification will be handled automatically by the API');

	} catch (error) {
		console.error('Error in like notification handler:', error);
	}
};

/**
 * Send follow notification
 * @param {string} followedUserId - ID of user being followed
 * @param {Object} currentUser - Current user object
 */
export const sendFollowNotification = async (followedUserId, currentUser) => {
	try {
		if (followedUserId === currentUser.uid) return;

		console.log('Follow notification will be handled automatically by the API');
	} catch (error) {
		console.error("Error in follow notification handler:", error);
	}
};

/**
 * Send comment notification
 * @param {string} postId - Post ID
 * @param {Object} post - Post object
 * @param {Object} currentUser - Current user object
 * @param {string} commentText - Comment text
 */
export const sendCommentNotification = async (postId, post, currentUser, commentText) => {
	try {
		if (!post?.author?.uid || post.author.uid === currentUser.uid) return;

		console.log('Comment notification will be handled automatically by the API');
	} catch (error) {
		console.error("Error in comment notification handler:", error);
	}
};

/**
 * Notify followers of new post
 * @param {string} postId - Post ID
 * @param {Object} postData - Post data including author info
 */
export const notifyFollowersOfNewPost = async (postId, postData) => {
	try {
		// In a real implementation, you would query followers from Firestore
		console.log("Notifying followers of new post:", postId);
		// This is a placeholder - implement based on your followers collection structure
	} catch (error) {
		console.error("Error notifying followers:", error);
	}
};

/**
 * Get user notifications from API
 * @param {string} userId - User ID
 * @param {number} limitCount - Number of notifications to fetch
 * @returns {Promise<Array>} Array of notifications
 */
export const getUserNotifications = async (userId, limitCount = 20) => {
	try {
		const { notificationAPI } = await import('../config/ApiConfig.js');
		const response = await notificationAPI.getUserNotifications(limitCount);
		return response.data?.notifications || response.notifications || [];
	} catch (error) {
		console.error("Error getting user notifications from API:", error);
		return [];
	}
};

/**
 * Mark notification as read using API
 * @param {string} notificationId - Notification ID
 */
export const markNotificationAsRead = async (notificationId) => {
	try {
		const { notificationAPI } = await import('../config/ApiConfig.js');
		return await notificationAPI.markAsRead(notificationId);
	} catch (error) {
		console.error("Error marking notification as read:", error);
		throw error;
	}
};

/**
 * Get unread notification count from API
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of unread notifications
 */
export const getUnreadNotificationCount = async (userId) => {
	try {
		const { notificationAPI } = await import('../config/ApiConfig.js');
		const response = await notificationAPI.getUserNotifications(1, true); // Get 1 unread notification
		return response.data?.unreadCount || response.unreadCount || 0;
	} catch (error) {
		console.error("Error getting unread notification count from API:", error);
		return 0;
	}
};

/**
 * Setup notification listener using API polling
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function for new notifications
 * @returns {Function} Unsubscribe function
 */
export const setupNotificationListener = (userId, callback) => {
	try {
		let intervalId;
		let lastCheck = new Date().toISOString();

		const checkForNewNotifications = async () => {
			try {
				const { notificationAPI } = await import('../config/ApiConfig.js');
				const response = await notificationAPI.getUserNotifications(20, true, lastCheck);
				const notifications = response.data?.notifications || response.notifications || [];
				
				if (notifications.length > 0) {
					callback(notifications);
					lastCheck = new Date().toISOString();
				}
			} catch (error) {
				console.error("Error checking for new notifications:", error);
			}
		};

		// Poll every 30 seconds for new notifications
		intervalId = setInterval(checkForNewNotifications, 30000);
		
		// Initial check
		checkForNewNotifications();

		// Return unsubscribe function
		return () => {
			if (intervalId) {
				clearInterval(intervalId);
			}
		};
	} catch (error) {
		console.error("Error setting up notification listener:", error);
		return () => {}; // Return empty function as fallback
	}
};

/**
 * Setup message listener (placeholder for compatibility)
 */
export const setupMessageListener = () => {
	console.log("Message listener setup");
	// Placeholder implementation
};

// Push notifications are now handled automatically by the API
// This function is kept for backward compatibility but does nothing
export const sendPushNotification = async (userId, title, message, data = {}) => {
	console.log('Push notifications are handled automatically by the API');
	return { success: true, message: 'Handled by API' };
};
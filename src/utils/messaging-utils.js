import { initializeOneSignal, getOneSignalPlayerId, setOneSignalExternalUserId, requestNotificationPermission as requestOneSignalPermission } from "../config/OneSignalConfig";
import { postAPI } from "../config/ApiConfig";

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

		// Get player ID and save to server
		const playerId = await getOneSignalPlayerId();
		if (playerId) {
			await savePlayerIdToServer(playerId, uid);
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
 * Save OneSignal player ID to server
 * @param {string} playerId - OneSignal player ID
 * @param {string} uid - User's unique identifier
 */
const savePlayerIdToServer = async (playerId, uid) => {
	try {
		await postAPI.saveOneSignalPlayerId({ playerId, uid });
		console.log("OneSignal player ID saved to server");
	} catch (error) {
		console.error("Error saving OneSignal player ID:", error);
	}
};

/**
 * Send notification to followers when a post is created
 * @param {string} postId - Post ID
 * @param {Object} postData - Post data
 */
export const notifyFollowersOfNewPost = async (postId, postData) => {
	try {
		const notificationData = {
			postId,
			authorUid: postData.author.uid,
			title: `${postData.author.name} shared a new post`,
			message: postData.content
				? postData.content.substring(0, 100) + "..."
				: "New post from someone you follow",
			url: `/post/${postId}`,
			authorName: postData.author.name,
			authorPhoto: postData.author.photoURL,
		};

		await postAPI.sendPostNotificationToFollowers(notificationData);
		console.log("Notification sent to followers");
	} catch (error) {
		console.error("Error sending post notification:", error);
	}
};

/**
 * Send notification to specific user
 * @param {string} targetUid - Target user's UID
 * @param {Object} notificationData - Notification content
 */
export const sendNotificationToUser = async (targetUid, notificationData) => {
	try {
		await postAPI.sendNotificationToUser({
			targetUid,
			...notificationData,
		});
		console.log("Notification sent to user:", targetUid);
	} catch (error) {
		console.error("Error sending notification to user:", error);
	}
};

/**
 * Setup foreground message listener (OneSignal handles this automatically)
 * @param {Function} callback - Callback function to handle messages
 */
export const setupMessageListener = (callback) => {
	// OneSignal handles foreground notifications automatically
	// This function is kept for compatibility
	if (callback) {
		console.log("OneSignal message listener setup (handled automatically)");
	}
};
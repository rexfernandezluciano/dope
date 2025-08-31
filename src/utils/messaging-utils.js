import { initializeOneSignal, getOneSignalPlayerId, setOneSignalExternalUserId, requestNotificationPermission as requestOneSignalPermission } from "../config/OneSignalConfig";
import { db } from "../config/FirebaseConfig";
import { collection, addDoc, doc, setDoc, query, where, onSnapshot, orderBy, limit, getDocs, updateDoc, serverTimestamp } from "firebase/firestore";
// Removed unused getUser import

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
 * Save OneSignal player ID to Firestore
 * @param {string} playerId - OneSignal player ID
 * @param {string} uid - User's unique identifier
 */
const savePlayerIdToFirestore = async (playerId, uid) => {
	try {
		await setDoc(doc(db, "users", uid), {
			oneSignalPlayerId: playerId,
			updatedAt: serverTimestamp()
		}, { merge: true });

		console.log("OneSignal player ID saved to Firestore");
	} catch (error) {
		console.error("Error saving player ID to Firestore:", error);
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

		console.log('Preparing like notification for:', post.author.uid);

		const notificationData = {
			type: 'like',
			title: 'New Like',
			message: `${currentUser.displayName || currentUser.username} liked your post`,
			recipientId: post.author.uid,
			senderId: currentUser.uid,
			postId: postId,
			url: `/post/${postId}`,
			read: false,
			createdAt: new Date()
		};

		// Save to Firestore
		const docRef = await addDoc(collection(db, 'notifications'), notificationData);
		console.log('Notification saved to Firestore:', docRef.id);

		// Send push notification via OneSignal
		const pushResult = await sendPushNotification(
			post.author.uid,
			notificationData.title,
			notificationData.message,
			{ postId, type: 'like' }
		);

		console.log('Push notification result:', pushResult);

	} catch (error) {
		console.error('Error sending like notification:', error);
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

		const notification = {
			userId: followedUserId,
			type: 'follow',
			title: 'New Follower',
			message: `${currentUser.name} started following you`,
			url: `/${currentUser.username}`,
			read: false,
			createdAt: serverTimestamp(),
			data: {
				followerId: currentUser.uid,
				followerName: currentUser.name
			}
		};

		await addDoc(collection(db, "notifications"), notification);
	} catch (error) {
		console.error("Error sending follow notification:", error);
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

		const notification = {
			userId: post.author.uid,
			type: 'comment',
			title: 'New Comment',
			message: `${currentUser.name} commented on your post: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
			url: `/posts/${postId}`,
			read: false,
			createdAt: serverTimestamp(),
			data: {
				postId,
				commenterId: currentUser.uid,
				commenterName: currentUser.name,
				commentText
			}
		};

		await addDoc(collection(db, "notifications"), notification);
	} catch (error) {
		console.error("Error sending comment notification:", error);
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
 * Get user notifications
 * @param {string} userId - User ID
 * @param {number} limitCount - Number of notifications to fetch
 * @returns {Promise<Array>} Array of notifications
 */
export const getUserNotifications = async (userId, limitCount = 20) => {
	try {
		const q = query(
			collection(db, "notifications"),
			where("userId", "==", userId),
			orderBy("createdAt", "desc"),
			limit(limitCount)
		);

		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map(doc => ({
			id: doc.id,
			...doc.data()
		}));
	} catch (error) {
		console.error("Error getting user notifications:", error);
		return [];
	}
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
export const markNotificationAsRead = async (notificationId) => {
	try {
		await updateDoc(doc(db, "notifications", notificationId), {
			read: true,
			readAt: serverTimestamp()
		});
	} catch (error) {
		console.error("Error marking notification as read:", error);
	}
};

/**
 * Get unread notification count
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of unread notifications
 */
export const getUnreadNotificationCount = async (userId) => {
	try {
		if (!db) {
			console.warn("Firestore not available, returning 0 notifications");
			return 0;
		}

		const q = query(
			collection(db, "notifications"),
			where("userId", "==", userId),
			where("read", "==", false)
		);

		const querySnapshot = await getDocs(q);
		return querySnapshot.size;
	} catch (error) {
		console.error("Error getting unread notification count:", error);
		return 0;
	}
};

/**
 * Setup notification listener
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function for new notifications
 * @returns {Function} Unsubscribe function
 */
export const setupNotificationListener = (userId, callback) => {
	try {
		if (!db) {
			console.warn("Firestore not available, notification listener disabled");
			return () => {}; // Return empty function as fallback
		}

		const q = query(
			collection(db, "notifications"),
			where("userId", "==", userId),
			where("read", "==", false),
			orderBy("createdAt", "desc")
		);

		return onSnapshot(q, (querySnapshot) => {
			const notifications = querySnapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data()
			}));
			callback(notifications);
		});
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

/**
 * Send a push notification via OneSignal
 * @param {string} userId - The external user ID to send the notification to
 * @param {string} title - The title of the notification
 * @param {string} message - The body of the notification
 * @param {Object} data - Optional data to include with the notification
 * @returns {Promise<Object|null>} The result from the OneSignal API or null if an error occurred
 */
export const sendPushNotification = async (userId, title, message, data = {}) => {
	try {
		if (!title || !message) {
			console.warn('Missing title or message for push notification');
			return;
		}

		console.log('Attempting to send push notification:', { userId, title, message });

		// Check if OneSignal credentials are configured
		const appId = process.env.REACT_APP_ONESIGNAL_APP_ID;
		const restApiKey = process.env.REACT_APP_ONESIGNAL_REST_API_KEY;

		if (!appId || appId === 'your-onesignal-app-id') {
			console.error('OneSignal App ID not configured');
			return;
		}

		if (!restApiKey) {
			console.error('OneSignal REST API Key not configured');
			return;
		}

		// Use OneSignal REST API to send notification
		const notification = {
			app_id: appId,
			include_external_user_ids: [userId],
			headings: { en: title },
			contents: { en: message },
			data: data,
			web_url: data.url || window.location.origin
		};

		console.log('Sending notification payload:', notification);

		const response = await fetch('https://onesignal.com/api/v1/notifications', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Basic ${restApiKey}`
			},
			body: JSON.stringify(notification)
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error('OneSignal API error response:', errorData);
			throw new Error(`OneSignal API error: ${response.status} - ${JSON.stringify(errorData)}`);
		}

		const result = await response.json();
		console.log('Push notification sent successfully:', result.id);
		return result;

	} catch (error) {
		console.error('Error sending push notification:', error);
		throw error;
	}
};
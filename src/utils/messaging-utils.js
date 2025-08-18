
import { initializeOneSignal, getOneSignalPlayerId, setOneSignalExternalUserId, requestNotificationPermission as requestOneSignalPermission } from "../config/OneSignalConfig";
import { db } from "../config/FirebaseConfig";
import { collection, addDoc, doc, setDoc, query, where, onSnapshot, orderBy, limit, getDocs, updateDoc, serverTimestamp } from "firebase/firestore";

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
		if (!db) {
			console.error("Firestore not initialized");
			return;
		}

		await setDoc(doc(db, "userNotificationTokens", uid), {
			playerId,
			uid,
			updatedAt: serverTimestamp(),
			createdAt: serverTimestamp()
		}, { merge: true });

		console.log("OneSignal player ID saved to Firestore");
	} catch (error) {
		console.error("Error saving OneSignal player ID to Firestore:", error);
	}
};

/**
 * Send OneSignal notification using REST API
 * @param {Array} playerIds - Array of OneSignal player IDs
 * @param {Object} notificationData - Notification content
 */
const sendOneSignalNotification = async (playerIds, notificationData) => {
	try {
		if (!playerIds || playerIds.length === 0) {
			console.log("No player IDs provided for OneSignal notification");
			return;
		}

		const payload = {
			app_id: process.env.REACT_APP_ONESIGNAL_APP_ID,
			include_player_ids: playerIds,
			headings: { en: notificationData.title },
			contents: { en: notificationData.message },
			data: notificationData.data || {},
			url: notificationData.url ? `${window.location.origin}${notificationData.url}` : undefined,
			chrome_web_icon: `${window.location.origin}/logo192.png`,
			firefox_icon: `${window.location.origin}/logo192.png`,
		};

		const response = await fetch('https://onesignal.com/api/v1/notifications', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Basic ${process.env.REACT_APP_ONESIGNAL_REST_API_KEY}`
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			const errorData = await response.text();
			console.error("OneSignal API error:", response.status, errorData);
			return false;
		}

		const result = await response.json();
		console.log("OneSignal notification sent successfully:", result);
		return true;

	} catch (error) {
		console.error("Error sending OneSignal notification:", error);
		return false;
	}
};

/**
 * Send OneSignal notification to specific external user IDs
 * @param {Array} externalUserIds - Array of external user IDs
 * @param {Object} notificationData - Notification content
 */
const sendOneSignalNotificationToUsers = async (externalUserIds, notificationData) => {
	try {
		if (!externalUserIds || externalUserIds.length === 0) {
			console.log("No external user IDs provided for OneSignal notification");
			return;
		}

		const payload = {
			app_id: process.env.REACT_APP_ONESIGNAL_APP_ID,
			include_external_user_ids: externalUserIds,
			headings: { en: notificationData.title },
			contents: { en: notificationData.message },
			data: notificationData.data || {},
			url: notificationData.url ? `${window.location.origin}${notificationData.url}` : undefined,
			chrome_web_icon: `${window.location.origin}/logo192.png`,
			firefox_icon: `${window.location.origin}/logo192.png`,
		};

		const response = await fetch('https://onesignal.com/api/v1/notifications', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Basic ${process.env.REACT_APP_ONESIGNAL_REST_API_KEY}`
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			const errorData = await response.text();
			console.error("OneSignal API error:", response.status, errorData);
			return false;
		}

		const result = await response.json();
		console.log("OneSignal notification sent successfully to external users:", result);
		return true;

	} catch (error) {
		console.error("Error sending OneSignal notification to external users:", error);
		return false;
	}
};

/**
 * Save notification to Firestore for followers when a post is created
 * @param {string} postId - Post ID
 * @param {Object} postData - Post data
 */
export const notifyFollowersOfNewPost = async (postId, postData) => {
	try {
		if (!db) {
			console.error("Firestore not initialized");
			return;
		}

		// Get followers of the post author
		const followersQuery = query(
			collection(db, "followers"),
			where("followingUid", "==", postData.author.uid)
		);

		const followersSnapshot = await getDocs(followersQuery);
		const followerUids = followersSnapshot.docs.map(doc => doc.data().followerUid);

		if (followerUids.length === 0) {
			console.log("No followers to notify");
			return;
		}

		// Create notification document for each follower
		const notificationPromises = followerUids.map(async (followerUid) => {
			const notificationData = {
				type: "new_post",
				postId,
				authorUid: postData.author.uid,
				targetUid: followerUid,
				title: `${postData.author.name} shared a new post`,
				message: postData.content
					? postData.content.substring(0, 100) + "..."
					: "New post from someone you follow",
				url: `/post/${postId}`,
				authorName: postData.author.name,
				authorPhoto: postData.author.photoURL,
				read: false,
				createdAt: serverTimestamp()
			};

			return addDoc(collection(db, "notifications"), notificationData);
		});

		await Promise.all(notificationPromises);
		console.log(`Notifications saved to Firestore for ${followerUids.length} followers`);

		// Send OneSignal notifications to followers
		await sendOneSignalNotificationToUsers(followerUids, {
			title: `${postData.author.name} shared a new post`,
			message: postData.content
				? postData.content.substring(0, 100) + "..."
				: "New post from someone you follow",
			url: `/post/${postId}`,
			data: { 
				postId, 
				type: "new_post",
				authorUid: postData.author.uid,
				authorName: postData.author.name
			}
		});

	} catch (error) {
		console.error("Error saving post notification to Firestore:", error);
	}
};

/**
 * Send OneSignal notifications to users with player IDs
 * @param {Array} targetUids - Array of target user UIDs
 * @param {Object} notificationData - Notification content
 */
const sendOneSignalNotificationsToFollowers = async (targetUids, notificationData) => {
	try {
		if (!db || targetUids.length === 0) return;

		// Get player IDs for target users in batches (Firestore 'in' query limit is 10)
		const batches = [];
		for (let i = 0; i < targetUids.length; i += 10) {
			batches.push(targetUids.slice(i, i + 10));
		}

		const allPlayerIds = [];
		
		for (const batch of batches) {
			const tokenQuery = query(
				collection(db, "userNotificationTokens"),
				where("uid", "in", batch)
			);

			const tokenSnapshot = await getDocs(tokenQuery);
			const playerIds = tokenSnapshot.docs.map(doc => doc.data().playerId).filter(Boolean);
			allPlayerIds.push(...playerIds);
		}

		if (allPlayerIds.length === 0) {
			console.log("No OneSignal player IDs found for followers");
			return;
		}

		// Send notification using OneSignal REST API
		await sendOneSignalNotification(allPlayerIds, notificationData);

	} catch (error) {
		console.error("Error sending OneSignal notifications:", error);
	}
};

/**
 * Send notification to specific user and save to Firestore
 * @param {string} targetUid - Target user's UID
 * @param {Object} notificationData - Notification content
 */
export const sendNotificationToUser = async (targetUid, notificationData) => {
	try {
		if (!db) {
			console.error("Firestore not initialized");
			return;
		}

		// Save notification to Firestore
		const notification = {
			...notificationData,
			targetUid,
			read: false,
			createdAt: serverTimestamp()
		};

		await addDoc(collection(db, "notifications"), notification);
		console.log("Notification saved to Firestore for user:", targetUid);

		// Send OneSignal notification using external user ID
		await sendOneSignalNotificationToUsers([targetUid], notificationData);

	} catch (error) {
		console.error("Error sending notification to user:", error);
	}
};

/**
 * Send like notification
 * @param {string} postId - Post ID
 * @param {Object} postData - Post data
 * @param {Object} liker - User who liked the post
 */
export const sendLikeNotification = async (postId, postData, liker) => {
	try {
		// Don't notify if user likes their own post
		if (postData.author.uid === liker.uid) return;

		const notificationData = {
			type: "like",
			postId,
			authorUid: liker.uid,
			title: `${liker.name} liked your post`,
			message: postData.content
				? postData.content.substring(0, 100) + "..."
				: "Someone liked your post",
			url: `/post/${postId}`,
			data: {
				postId,
				type: "like",
				likerUid: liker.uid,
				likerName: liker.name
			}
		};

		await sendNotificationToUser(postData.author.uid, notificationData);
	} catch (error) {
		console.error("Error sending like notification:", error);
	}
};

/**
 * Send follow notification
 * @param {string} followedUid - UID of user being followed
 * @param {Object} follower - User who followed
 */
export const sendFollowNotification = async (followedUid, follower) => {
	try {
		const notificationData = {
			type: "follow",
			authorUid: follower.uid,
			title: `${follower.name} started following you`,
			message: "Check out their profile!",
			url: `/profile/${follower.uid}`,
			data: {
				type: "follow",
				followerUid: follower.uid,
				followerName: follower.name
			}
		};

		await sendNotificationToUser(followedUid, notificationData);
	} catch (error) {
		console.error("Error sending follow notification:", error);
	}
};

/**
 * Send comment notification
 * @param {string} postId - Post ID
 * @param {Object} postData - Post data
 * @param {Object} commenter - User who commented
 * @param {string} commentText - Comment text
 */
export const sendCommentNotification = async (postId, postData, commenter, commentText) => {
	try {
		// Don't notify if user comments on their own post
		if (postData.author.uid === commenter.uid) return;

		const notificationData = {
			type: "comment",
			postId,
			authorUid: commenter.uid,
			title: `${commenter.name} commented on your post`,
			message: commentText.substring(0, 100) + (commentText.length > 100 ? "..." : ""),
			url: `/post/${postId}`,
			data: {
				postId,
				type: "comment",
				commenterUid: commenter.uid,
				commenterName: commenter.name
			}
		};

		await sendNotificationToUser(postData.author.uid, notificationData);
	} catch (error) {
		console.error("Error sending comment notification:", error);
	}
};

/**
 * Get user notifications from Firestore
 * @param {string} uid - User's unique identifier
 * @param {number} limitCount - Number of notifications to fetch
 * @returns {Promise<Array>} Array of notifications
 */
export const getUserNotifications = async (uid, limitCount = 20) => {
	try {
		if (!db) {
			console.error("Firestore not initialized");
			return [];
		}

		const notificationsQuery = query(
			collection(db, "notifications"),
			where("targetUid", "==", uid),
			orderBy("createdAt", "desc"),
			limit(limitCount)
		);

		const snapshot = await getDocs(notificationsQuery);
		return snapshot.docs.map(doc => ({
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
 * @param {string} notificationId - Notification document ID
 */
export const markNotificationAsRead = async (notificationId) => {
	try {
		if (!db) {
			console.error("Firestore not initialized");
			return;
		}

		await updateDoc(doc(db, "notifications", notificationId), {
			read: true,
			readAt: serverTimestamp()
		});

		console.log("Notification marked as read:", notificationId);
	} catch (error) {
		console.error("Error marking notification as read:", error);
	}
};

/**
 * Setup real-time notification listener
 * @param {string} uid - User's unique identifier
 * @param {Function} callback - Callback function to handle new notifications
 * @returns {Function} Unsubscribe function
 */
export const setupNotificationListener = (uid, callback) => {
	if (!db) {
		console.error("Firestore not initialized");
		return () => {};
	}

	const notificationsQuery = query(
		collection(db, "notifications"),
		where("targetUid", "==", uid),
		where("read", "==", false),
		orderBy("createdAt", "desc")
	);

	return onSnapshot(notificationsQuery, (snapshot) => {
		const notifications = snapshot.docs.map(doc => ({
			id: doc.id,
			...doc.data()
		}));

		if (callback) {
			callback(notifications);
		}
	}, (error) => {
		console.error("Error listening to notifications:", error);
	});
};

/**
 * Get unread notification count
 * @param {string} uid - User's unique identifier
 * @returns {Promise<number>} Number of unread notifications
 */
export const getUnreadNotificationCount = async (uid) => {
	try {
		if (!db) {
			console.error("Firestore not initialized");
			return 0;
		}

		const unreadQuery = query(
			collection(db, "notifications"),
			where("targetUid", "==", uid),
			where("read", "==", false)
		);

		const snapshot = await getDocs(unreadQuery);
		return snapshot.docs.length;

	} catch (error) {
		console.error("Error getting unread notification count:", error);
		return 0;
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

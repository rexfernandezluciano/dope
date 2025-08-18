
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

		// Send OneSignal notifications to followers who have player IDs
		await sendOneSignalNotificationsToFollowers(followerUids, {
			title: `${postData.author.name} shared a new post`,
			message: postData.content
				? postData.content.substring(0, 100) + "..."
				: "New post from someone you follow",
			url: `/post/${postId}`,
			data: { postId, type: "new_post" }
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

		// Get player IDs for target users
		const tokenQuery = query(
			collection(db, "userNotificationTokens"),
			where("uid", "in", targetUids.slice(0, 10)) // Firestore limit for 'in' queries
		);

		const tokenSnapshot = await getDocs(tokenQuery);
		const playerIds = tokenSnapshot.docs.map(doc => doc.data().playerId).filter(Boolean);

		if (playerIds.length === 0) {
			console.log("No OneSignal player IDs found for followers");
			return;
		}

		// Here you would typically call OneSignal's REST API to send notifications
		// For now, we'll log the notification details
		console.log("Would send OneSignal notification to players:", playerIds);
		console.log("Notification data:", notificationData);

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

		// Get user's OneSignal player ID and send notification
		const userTokenDoc = await getDocs(query(
			collection(db, "userNotificationTokens"),
			where("uid", "==", targetUid),
			limit(1)
		));

		if (!userTokenDoc.empty) {
			const playerId = userTokenDoc.docs[0].data().playerId;
			if (playerId) {
				console.log("Would send OneSignal notification to player:", playerId);
				console.log("Notification data:", notificationData);
			}
		}

	} catch (error) {
		console.error("Error sending notification to user:", error);
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

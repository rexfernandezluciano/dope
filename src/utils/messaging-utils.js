
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../config/FirebaseConfig";
import { postAPI } from "../config/ApiConfig";

/**
 * Request notification permission and get FCM token
 * @returns {Promise<string|null>} FCM token or null if failed
 */
export const requestNotificationPermission = async () => {
	try {
		if (!messaging || typeof window === 'undefined') return null;

		// Check if notifications are supported
		if (!('Notification' in window)) {
			console.log('This browser does not support notifications');
			return null;
		}

		// Request permission
		const permission = await Notification.requestPermission();
		
		if (permission === 'granted') {
			// Get FCM token
			const token = await getToken(messaging, {
				vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY || 'your-vapid-key'
			});
			
			if (token) {
				console.log('FCM Token:', token);
				// Save token to user's profile
				await saveTokenToServer(token);
				return token;
			} else {
				console.log('No registration token available.');
				return null;
			}
		} else {
			console.log('Notification permission denied');
			return null;
		}
	} catch (error) {
		console.error('Error getting FCM token:', error);
		return null;
	}
};

/**
 * Save FCM token to server
 * @param {string} token - FCM token
 */
const saveTokenToServer = async (token) => {
	try {
		// Send token to your backend API
		await postAPI.saveFCMToken({ token });
	} catch (error) {
		console.error('Error saving FCM token:', error);
	}
};

/**
 * Setup foreground message listener
 * @param {Function} callback - Callback function to handle messages
 */
export const setupMessageListener = (callback) => {
	if (!messaging || typeof window === 'undefined') return;

	return onMessage(messaging, (payload) => {
		console.log('Message received in foreground:', payload);
		
		// Show notification
		if (payload.notification) {
			showNotification(payload.notification);
		}
		
		// Call callback with payload
		if (callback) {
			callback(payload);
		}
	});
};

/**
 * Show browser notification
 * @param {Object} notification - Notification payload
 */
const showNotification = (notification) => {
	if ('Notification' in window && Notification.permission === 'granted') {
		const options = {
			body: notification.body,
			icon: notification.icon || '/logo192.png',
			image: notification.image,
			badge: '/logo192.png',
			tag: notification.tag || 'dope-network',
			requireInteraction: false,
			actions: [
				{
					action: 'view',
					title: 'View Post'
				},
				{
					action: 'close',
					title: 'Close'
				}
			]
		};

		const notif = new Notification(notification.title, options);
		
		// Auto close after 5 seconds
		setTimeout(() => {
			notif.close();
		}, 5000);

		// Handle notification click
		notif.onclick = () => {
			window.focus();
			// Navigate to the post if URL is provided in data
			if (notification.click_action) {
				window.location.href = notification.click_action;
			}
			notif.close();
		};
	}
};

/**
 * Send notification to followers when a post is created
 * @param {string} postId - Post ID
 * @param {Object} postData - Post data
 */
export const notifyFollowersOfNewPost = async (postId, postData) => {
	try {
		await postAPI.sendPostNotification({
			postId,
			title: `${postData.author.name} shared a new post`,
			body: postData.content ? postData.content.substring(0, 100) + '...' : 'New post from someone you follow',
			clickAction: `/post/${postId}`,
			authorId: postData.author.uid,
			authorName: postData.author.name,
			authorPhoto: postData.author.photoURL
		});
	} catch (error) {
		console.error('Error sending post notification:', error);
	}
};

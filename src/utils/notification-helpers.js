
import { 
	sendLikeNotification, 
	sendFollowNotification, 
	sendCommentNotification, 
	notifyFollowersOfNewPost 
} from './messaging-utils';

/**
 * Helper function to handle post like notifications
 * @param {string} postId - Post ID
 * @param {Object} post - Post object
 * @param {Object} currentUser - Current user object
 */
export const handleLikeNotification = async (postId, post, currentUser) => {
	try {
		if (!post || !currentUser) return;
		
		await sendLikeNotification(postId, post, currentUser);
	} catch (error) {
		console.error('Error sending like notification:', error);
	}
};

/**
 * Helper function to handle follow notifications
 * @param {string} followedUserId - ID of user being followed
 * @param {Object} currentUser - Current user object
 */
export const handleFollowNotification = async (followedUserId, currentUser) => {
	try {
		if (!followedUserId || !currentUser) return;
		
		await sendFollowNotification(followedUserId, currentUser);
	} catch (error) {
		console.error('Error sending follow notification:', error);
	}
};

/**
 * Helper function to handle comment notifications
 * @param {string} postId - Post ID
 * @param {Object} post - Post object
 * @param {Object} currentUser - Current user object
 * @param {string} commentText - Comment text
 */
export const handleCommentNotification = async (postId, post, currentUser, commentText) => {
	try {
		if (!post || !currentUser || !commentText) return;
		
		await sendCommentNotification(postId, post, currentUser, commentText);
	} catch (error) {
		console.error('Error sending comment notification:', error);
	}
};

/**
 * Helper function to handle new post notifications to followers
 * @param {string} postId - Post ID
 * @param {Object} postData - Post data including author info
 */
export const handleNewPostNotification = async (postId, postData) => {
	try {
		if (!postId || !postData) return;
		
		await notifyFollowersOfNewPost(postId, postData);
	} catch (error) {
		console.error('Error sending new post notification:', error);
	}
};

/**
 * Helper function to format notification data for OneSignal
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} url - Target URL
 * @param {Object} data - Additional data
 * @returns {Object} Formatted notification data
 */
export const formatNotificationData = (title, message, url = null, data = {}) => {
	return {
		title,
		message,
		url,
		data: {
			...data,
			timestamp: Date.now()
		}
	};
};

/**
 * Helper function to check if notifications are enabled for the user
 * @param {Object} userSettings - User notification settings
 * @param {string} notificationType - Type of notification
 * @returns {boolean} Whether notifications are enabled
 */
export const shouldSendNotification = (userSettings, notificationType) => {
	if (!userSettings || !userSettings.notifications) return true;
	
	switch (notificationType) {
		case 'like':
			return userSettings.notifications.likes !== false;
		case 'comment':
			return userSettings.notifications.comments !== false;
		case 'follow':
			return userSettings.notifications.follows !== false;
		case 'new_post':
			return userSettings.notifications.posts !== false;
		case 'mention':
			return userSettings.notifications.mentions !== false;
		default:
			return true;
	}
};

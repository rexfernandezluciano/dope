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
		if (!post || !currentUser || !postId) {
			console.warn('Missing required data for like notification');
			return;
		}

		// Don't notify if user likes their own post
		if (post.author?.uid === currentUser.uid) return;

		// Check if user has like notifications enabled
		if (post.author?.notificationSettings && !shouldSendNotification(post.author.notificationSettings, 'like')) {
			return;
		}

		// Send notification in background without blocking main operation
		setTimeout(async () => {
			try {
				await sendLikeNotification(postId, post, currentUser);
			} catch (notificationError) {
				console.error('Background like notification failed:', notificationError);
			}
		}, 0);
	} catch (error) {
		console.error('Error preparing like notification:', error);
	}
};

/**
 * Helper function to handle follow notifications
 * @param {string} followedUserId - ID of user being followed
 * @param {Object} currentUser - Current user object
 * @param {Object} followedUser - User being followed (optional, for settings check)
 */
export const handleFollowNotification = async (followedUserId, currentUser, followedUser = null) => {
	try {
		if (!followedUserId || !currentUser) return;

		// Check if user has follow notifications enabled
		if (followedUser?.notificationSettings && !shouldSendNotification(followedUser.notificationSettings, 'follow')) {
			return;
		}

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
		if (!post || !currentUser || !commentText || !postId) {
			console.warn('Missing required data for comment notification');
			return;
		}

		// Don't notify if user comments on their own post
		if (post.author?.uid === currentUser.uid) return;

		// Check if user has comment notifications enabled
		if (post.author?.notificationSettings && !shouldSendNotification(post.author.notificationSettings, 'comment')) {
			return;
		}

		// Send notification in background without blocking main operation
		setTimeout(async () => {
			try {
				await sendCommentNotification(postId, post, currentUser, commentText);
			} catch (notificationError) {
				console.error('Background comment notification failed:', notificationError);
			}
		}, 0);
	} catch (error) {
		console.error('Error preparing comment notification:', error);
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
	if (!userSettings) return true;

	switch (notificationType) {
		case 'like':
			return userSettings.likeNotifications !== false;
		case 'comment':
			return userSettings.commentNotifications !== false;
		case 'follow':
			return userSettings.followNotifications !== false;
		case 'mention':
			return userSettings.mentionNotifications !== false;
		case 'security':
			return userSettings.securityAlerts !== false;
		case 'marketing':
			return userSettings.marketingEmails !== false;
		default:
			return true;
	}
};
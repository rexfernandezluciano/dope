
import OneSignal from 'react-onesignal';

let oneSignalInitialized = false;

export const initializeOneSignal = async () => {
	if (oneSignalInitialized || typeof window === 'undefined') {
		return;
	}

	try {
		await OneSignal.init({
			appId: process.env.REACT_APP_ONESIGNAL_APP_ID || 'your-onesignal-app-id',
			safari_web_id: process.env.REACT_APP_ONESIGNAL_SAFARI_WEB_ID,
			notifyButton: {
				enable: false, // We'll handle permission requests manually
			},
			allowLocalhostAsSecureOrigin: true, // For development
			autoResubscribe: true,
			promptOptions: {
				slidedown: {
					prompts: [
						{
							type: "push",
							autoPrompt: false,
							text: {
								actionMessage: "We'd like to show you notifications for new posts and interactions.",
								acceptButton: "Allow",
								cancelButton: "No Thanks"
							}
						}
					]
				}
			}
		});

		// Set up notification click handler
		OneSignal.on('notificationClick', function(event) {
			console.log('OneSignal notification clicked:', event);
			
			// Get the notification data
			const data = event.data;
			
			// Handle navigation based on notification type
			if (data && data.url) {
				// Navigate to the specified URL
				window.location.href = data.url;
			} else if (data && data.postId) {
				// Navigate to post detail page
				window.location.href = `/post/${data.postId}`;
			}
		});

		// Set up notification display handler for foreground notifications
		OneSignal.on('notificationDisplay', function(event) {
			console.log('OneSignal notification displayed:', event);
		});

		oneSignalInitialized = true;
		console.log('OneSignal initialized successfully');
	} catch (error) {
		console.error('Error initializing OneSignal:', error);
	}
};

export const getOneSignalPlayerId = async () => {
	try {
		if (!oneSignalInitialized) {
			await initializeOneSignal();
		}
		
		const playerId = await OneSignal.getPlayerId();
		return playerId;
	} catch (error) {
		console.error('Error getting OneSignal player ID:', error);
		return null;
	}
};

export const setOneSignalExternalUserId = async (uid) => {
	try {
		if (!oneSignalInitialized) {
			await initializeOneSignal();
		}
		
		await OneSignal.setExternalUserId(uid);
		console.log('OneSignal external user ID set:', uid);
	} catch (error) {
		console.error('Error setting OneSignal external user ID:', error);
	}
};

export const requestNotificationPermission = async () => {
	try {
		if (!oneSignalInitialized) {
			await initializeOneSignal();
		}
		
		const permission = await OneSignal.requestPermission();
		return permission;
	} catch (error) {
		console.error('Error requesting notification permission:', error);
		return false;
	}
};

export default OneSignal;

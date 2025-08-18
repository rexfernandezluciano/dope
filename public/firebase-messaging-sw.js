
// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
	apiKey: "your-api-key",
	authDomain: "your-project.firebaseapp.com",
	projectId: "your-project-id",
	storageBucket: "your-project.appspot.com",
	messagingSenderId: "123456789",
	appId: "your-app-id"
});

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
	console.log('Background message received:', payload);

	const notificationTitle = payload.notification?.title || 'DOPE Network';
	const notificationOptions = {
		body: payload.notification?.body || 'You have a new notification',
		icon: payload.notification?.icon || '/logo192.png',
		image: payload.notification?.image,
		badge: '/logo192.png',
		tag: 'dope-network-notification',
		data: {
			click_action: payload.notification?.click_action || payload.data?.click_action,
			postId: payload.data?.postId,
			authorId: payload.data?.authorId
		},
		actions: [
			{
				action: 'view',
				title: 'View'
			},
			{
				action: 'close',
				title: 'Close'
			}
		]
	};

	return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click in service worker
self.addEventListener('notificationclick', (event) => {
	console.log('Notification clicked:', event);
	
	event.notification.close();

	if (event.action === 'view' || !event.action) {
		const clickAction = event.notification.data?.click_action;
		if (clickAction) {
			event.waitUntil(
				clients.openWindow(clickAction)
			);
		} else {
			event.waitUntil(
				clients.openWindow('/')
			);
		}
	}
});

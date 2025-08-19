/* @format */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
	apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
	authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
	projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "your-project-id",
	storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
	messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
	appId: process.env.REACT_APP_FIREBASE_APP_ID || "your-app-id",
};

// Initialize Firebase
let app;
let db;
let appCheck; // Declare appCheck
let messaging; // Declare messaging

try {
	app = initializeApp(firebaseConfig);

	// Initialize App Check
	if (typeof window !== 'undefined') {
		try {
			// For development, use debug token
			if (process.env.NODE_ENV === 'development') {
				// Debug token for development - replace with your debug token
				window.FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.REACT_APP_FIREBASE_APPCHECK_DEBUG_TOKEN || 'BDE92789-B377-47C0-A021-C3CBD7A24A48';
			}

			appCheck = initializeAppCheck(app, { // Assign to appCheck
				provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeXsKkrAAAAAIZ_HaIAbxmU6XIrxVlLguh78xx_'),
				isTokenAutoRefreshEnabled: true
			});
			
			console.log('App Check initialized successfully');
		} catch (error) {
			console.warn('App Check initialization failed:', error);
			appCheck = null; // Set to null if initialization fails
		}
	}

	db = getFirestore(app);
	
	// Initialize Firebase Cloud Messaging
	if (typeof window !== 'undefined') {
		messaging = getMessaging(app);
	}
} catch (error) {
	console.error("Firebase initialization error:", error);
	// Create a mock database object to prevent crashes
	db = null;
	appCheck = null; // Ensure appCheck is also null in case of error
	messaging = null; // Ensure messaging is also null in case of error
}

export { db, app, appCheck, messaging };
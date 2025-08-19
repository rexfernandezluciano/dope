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
			// Set debug token for development and mobile environments
			const isDevelopment = window.location.hostname === 'localhost' || 
			                     window.location.hostname === '127.0.0.1' ||
			                     window.location.hostname.includes('replit.dev');
			
			if (isDevelopment || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				window.FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.REACT_APP_FIREBASE_APPCHECK_DEBUG_TOKEN || 'BDE92789-B377-47C0-A021-C3CBD7A48';
				console.log('Using App Check debug token for development/mobile environment');
			}

			// Try ReCAPTCHA provider first, fallback to debug in mobile environments
			let provider;
			const isDebugMode = isDevelopment || window.FIREBASE_APPCHECK_DEBUG_TOKEN;
			
			if (isDebugMode) {
				// In debug mode, we still initialize with ReCAPTCHA but it will use debug tokens
				provider = new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeXsKkrAAAAAIZ_HaIAbxmU6XIrxVlLguh78xx_');
			} else {
				provider = new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeXsKkrAAAAAIZ_HaIAbxmU6XIrxVlLguh78xx_');
			}

			appCheck = initializeAppCheck(app, {
				provider: provider,
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
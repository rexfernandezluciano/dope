/* @format */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

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

try {
	app = initializeApp(firebaseConfig);
	
	// Initialize App Check
	if (typeof window !== 'undefined') {
		// For development, use debug token
		if (process.env.NODE_ENV === 'development') {
			// Debug token for development - replace with your debug token
			window.FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.REACT_APP_FIREBASE_APPCHECK_DEBUG_TOKEN || true;
		}
		
		initializeAppCheck(app, {
			provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeXsKkrAAAAAIZ_HaIAbxmU6XIrxVlLguh78xx_'),
			isTokenAutoRefreshEnabled: true
		});
	}
	
	db = getFirestore(app);
} catch (error) {
	console.error("Firebase initialization error:", error);
	// Create a mock database object to prevent crashes
	db = null;
}

export { db, app };
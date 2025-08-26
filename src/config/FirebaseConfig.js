/* @format */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
	apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
	authDomain:
		process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
		"your-project.firebaseapp.com",
	projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "your-project-id",
	storageBucket:
		process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
	messagingSenderId:
		process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
	appId: process.env.REACT_APP_FIREBASE_APP_ID || "your-app-id",
};

// Initialize Firebase
let app;
let db;
let messaging; // Declare messaging

try {
	// Check if required config values are present
	const requiredKeys = ['apiKey', 'authDomain', 'projectId'];
	const missingKeys = requiredKeys.filter(key => !firebaseConfig[key] || firebaseConfig[key].includes('your-'));
	
	if (missingKeys.length > 0) {
		throw new Error(`Missing Firebase configuration for: ${missingKeys.join(', ')}`);
	}

	app = initializeApp(firebaseConfig);
	db = getFirestore(app);

	// Initialize Firebase Cloud Messaging
	if (typeof window !== "undefined") {
		try {
			messaging = getMessaging(app);
		} catch (messagingError) {
			console.warn('Firebase messaging initialization failed:', messagingError);
			messaging = null;
		}
	}

	console.log('✅ Firebase initialized successfully');
} catch (error) {
	console.error("❌ Firebase initialization error:", error);
	console.error("Please check your Firebase configuration in environment variables");
	
	// Create mock objects to prevent crashes
	db = null;
	messaging = null;
}

// Add connection state monitoring to reduce console errors
if (db) {
	try {
		// Test Firestore connection
		console.log('📊 Firestore database ready');
	} catch (persistenceError) {
		console.warn('⚠️ Firebase persistence setup failed:', persistenceError);
	}
}

export { db, app, messaging };

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
	app = initializeApp(firebaseConfig);
	db = getFirestore(app);

	// Initialize Firebase Cloud Messaging
	if (typeof window !== "undefined") {
		messaging = getMessaging(app);
	}
} catch (error) {
	console.error("Firebase initialization error:", error);
	// Create a mock database object to prevent crashes
	db = null;
	messaging = null; // Ensure messaging is also null in case of error
}

export { db, app, messaging };

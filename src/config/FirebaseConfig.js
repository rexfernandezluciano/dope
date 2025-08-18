/* @format */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
	apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "your-api-key",
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
	db = getFirestore(app);
} catch (error) {
	console.error("Firebase initialization error:", error);
	// Create a mock database object to prevent crashes
	db = null;
}

export { db };
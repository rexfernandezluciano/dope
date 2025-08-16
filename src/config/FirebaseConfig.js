/** @format */

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
	apiKey: "AIzaSyCvyvKXJh7mQTTyXJGZGEjKOi6AYikOB94",
	authDomain: "tambayannetwork.web.app",
	databaseURL: "https://tambayannetwork-default-rtdb.asia-southeast1.firebasedatabase.app",
	projectId: "tambayannetwork",
	storageBucket: "tambayannetwork.firebasestorage.app",
	messagingSenderId: "376210324564",
	appId: "1:376210324564:web:3d3c9c9511ff3ccdc3c1c1",
	measurementId: "G-7MRJR9NCFP",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleAuthProvider = new GoogleAuthProvider();

const database = getDatabase(app);

export { database, auth, analytics, googleAuthProvider };

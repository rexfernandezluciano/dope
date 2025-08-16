/* @format */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
	apiKey: "AIzaSyAxfinYGLdR1lQIdAExFkBrsjgA6rkmFBE",
	authDomain: "www.dopp.eu.org",
	projectId: "dope-international",
	storageBucket: "dope-international.firebasestorage.app",
	messagingSenderId: "171033182022",
	appId: "1:171033182022:web:b5e61cc870771dc41daf47",
	measurementId: "G-XV15BJFNYK",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

const database = getDatabase(app);

export { database, auth, analytics };

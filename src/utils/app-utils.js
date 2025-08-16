/** @format */

import { auth, database } from "../config/FirebaseConfig";
import { ref, get, set } from "firebase/database";
import { sendEmailVerification } from "firebase/auth";
import md5 from "md5";

/**
 * Sends a verification email to the currently signed-in user.
 * @returns {Promise<void>} Resolves when the email is sent, rejects on failure.
 */
const verifyUser = () => {
	if (!auth.currentUser) {
		return Promise.reject(new Error("No user is currently signed in."));
	}

	return sendEmailVerification(auth.currentUser);
};

/**
 * Reloads the current user and checks if their email is verified.
 * @returns {Promise<boolean>} True if email is verified, false otherwise.
 */
const userIsVerified = async () => {
	if (!auth.currentUser) return false;

	try {
		await auth.currentUser.reload();
		return auth.currentUser.emailVerified;
	} catch (error) {
		return false;
	}
};

/**
 * Save User Data to the database.
 * @returns {Promise<void>} It save user data if not existed, not otherwise.
 */
const saveUser = async user => {
	const userRef = ref(database, `users/${user.uid}`);

	const snapshot = await get(userRef);
	if (!snapshot.exists()) {
		await set(userRef, {
			uid: user.uid,
			name: user.displayName,
			email: user.email,
			photoURL: user.photoURL,
			role: {
				user: true,
				editor: false,
				moderator: false,
			},
			username: await createUsername(user.displayName),
			status: "online",
			account: {
				verified: false,
				subscription: "free",
			},
			lastSeen: new Date().toISOString(),
			createdAt: new Date().toISOString(),
		});
	}
};

/**
 * Check if user is admin or not.
 * @returns {Promise<boolean>} true if admin, false otherwise.
 */

const isAdmin = async () => {
	const user = auth.currentUser;
	if (!user) return false;

	const snapshot = await get(ref(database, `admins/${user.uid}`));
	return snapshot.exists();
};

/**
 * To check if user is logged in.
 * @returns {auth<Boolean|Object>} true if user is valid object, false if not.
 */

const getUser = async () => {
	const user = auth.currentUser;
	if (!user) return null;

	const snapshot = await get(ref(database, `users/${user.uid}`));
	return snapshot.exists() ? snapshot.val() : null;
};

const userExist = async uid => {
	const snapshot = await get(ref(database, `users/${uid}`));
	return snapshot.exists();
};

const userExistByEmail = async email => {
	try {
		const snapshot = await get(ref(database, "users"));
		if (!snapshot.exists()) return false;

		let exists = false;
		snapshot.forEach(child => {
			if (child.val().email?.toLowerCase() === email.toLowerCase()) {
				exists = true;
			}
		});

		return exists;
	} catch (error) {
		console.error("Error checking user by email:", error);
		return false;
	}
};

const checkUsername = async username => {
	try {
		const snapshot = await get(ref(database, "users"));
		if (!snapshot.exists()) return false;

		let exists = false;
		snapshot.forEach(child => {
			if (child.val().username?.toLowerCase() === username.toLowerCase()) {
				exists = true;
			}
		});

		return exists;
	} catch (error) {
		console.error("Error checking user by email:", error);
		return false;
	}
};

const isUserAllowed = async email => {
	const snapshot = await get(ref(database, "allowlists"));
	if (!snapshot.exists()) return false;

	const allowlist = snapshot.val();
	return allowlist.includes(email);
};

const getGravatar = email => {
	const hash = md5(email.trim().toLowerCase());
	return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
};

const createUsername = async (displayName) => {
	const base = displayName.replace(/\s+/g, "").toLowerCase();
	const number = Math.floor(Math.random() * 9000) + 100;

	return await checkUsername(base) ? `${base}${number}` : base;
};

export { verifyUser, userIsVerified, saveUser, isAdmin, getUser, isUserAllowed, userExist, userExistByEmail, getGravatar, createUsername };

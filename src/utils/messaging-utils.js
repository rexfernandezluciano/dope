import { initializeOneSignal, getOneSignalPlayerId, setOneSignalExternalUserId, requestNotificationPermission as requestOneSignalPermission } from "../config/OneSignalConfig";
import { db } from "../config/FirebaseConfig";
import { collection, addDoc, doc, setDoc, query, where, onSnapshot, orderBy, limit, getDocs, updateDoc, serverTimestamp } from "firebase/firestore";

/**
 * Initialize OneSignal and set user ID
 * @param {string} uid - User's unique identifier
 * @returns {Promise<boolean>} Success status
 */
export const initializeNotifications = async (uid) => {
	try {
		if (typeof window === "undefined") return false;

		// Initialize OneSignal
		await initializeOneSignal();

		// Set external user ID for targeting
		await setOneSignalExternalUserId(uid);

		// Get player ID and save to Firestore
		const playerId = await getOneSignalPlayerId();
		if (playerId) {
			await savePlayerIdToFirestore(playerId, uid);
			return true;
		}

		return false;
	} catch (error) {
		console.error("Error initializing notifications:", error);
		return false;
	}
};

/**
 * Request notification permission
 * @returns {Promise<boolean>} Permission granted status
 */
export const requestNotificationPermission = async () => {
	try {
		if (typeof window === "undefined") return false;

		const permission = await requestOneSignalPermission();
		console.log("Notification permission:", permission);
		return permission;
	} catch (error) {
		console.error("Error requesting notification permission:", error);
		return false;
	}
};

/**
 * Save OneSignal player ID to Firestore
 * @param {string} playerId - OneSignal player ID
 * @param {string} uid - User's unique identifier
 */
const savePlayerIdToFirestore = async (playerId, uid) => {
	try {
		await setDoc(doc(db, "users", uid), {
			oneSignalPlayerId: playerId,
			updatedAt: serverTimestamp()
		}, { merge: true });

		console.log("OneSignal player ID saved to Firestore");
	} catch (error) {
		console.error("Error saving player ID to Firestore:", error);
	}
};
/** @format */

import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from "../config/FirebaseConfig";


/**
 * Check if email already exists in waiting list
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} true if email exists, false otherwise
 */
export const isEmailInWaitingList = async (email) => {
	try {
		const waitingListRef = collection(db, 'waitingList');
		const q = query(waitingListRef, where('email', '==', email.toLowerCase().trim()));
		const querySnapshot = await getDocs(q);

		return !querySnapshot.empty;
	} catch (error) {
		console.error('Error checking email in waiting list:', error);
		throw new Error('Failed to check email status');
	}
};

/**
 * Add user to waiting list
 * @param {Object} userData - User data to save
 * @param {string} userData.name - User's name
 * @param {string} userData.email - User's email
 * @returns {Promise<string>} Document ID of the created entry
 */
export const addToWaitingList = async (userData) => {
	try {
		const { name, email } = userData;

		// Check if email already exists
		const emailExists = await isEmailInWaitingList(email);
		if (emailExists) {
			throw new Error('This email is already on the waiting list');
		}

		const waitingListRef = collection(db, 'waitingList');
		const docRef = await addDoc(waitingListRef, {
			name: name.trim(),
			email: email.toLowerCase().trim(),
			createdAt: serverTimestamp(),
			status: 'pending',
			source: 'website'
		});

		return docRef.id;
	} catch (error) {
		console.error('Error adding to waiting list:', error);
		throw error;
	}
};

/**
 * Get waiting list statistics
 * @returns {Promise<Object>} Statistics object with count and other metrics
 */
export const getWaitingListStats = async () => {
	try {
		const waitingListRef = collection(db, 'waitingList');
		const querySnapshot = await getDocs(waitingListRef);

		return {
			totalCount: querySnapshot.size,
			timestamp: new Date().toISOString()
		};
	} catch (error) {
		console.error('Error getting waiting list stats:', error);
		throw new Error('Failed to get waiting list statistics');
	}
};

/**
 * Get all waiting list entries (admin function)
 * @returns {Promise<Array>} Array of waiting list entries
 */
export const getAllWaitingListEntries = async () => {
	try {
		const waitingListRef = collection(db, 'waitingList');
		const querySnapshot = await getDocs(waitingListRef);

		const entries = [];
		querySnapshot.forEach((doc) => {
			entries.push({
				id: doc.id,
				...doc.data()
			});
		});

		return entries.sort((a, b) => {
			// Sort by creation date, newest first
			if (a.createdAt && b.createdAt) {
				return b.createdAt.toDate() - a.createdAt.toDate();
			}
			return 0;
		});
	} catch (error) {
		console.error('Error getting waiting list entries:', error);
		throw new Error('Failed to get waiting list entries');
	}
};
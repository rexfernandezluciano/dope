
/** @format */

import { getAllWaitingListEntries, getWaitingListStats } from './firestore-utils';
import { isAdmin } from './app-utils';

/**
 * Export waiting list to CSV format (admin only)
 * @returns {Promise<string>} CSV content
 */
export const exportWaitingListCSV = async () => {
	try {
		const isUserAdmin = await isAdmin();
		if (!isUserAdmin) {
			throw new Error('Unauthorized: Admin access required');
		}

		const entries = await getAllWaitingListEntries();
		
		// CSV headers
		const headers = ['Name', 'Email', 'Created At', 'Status', 'Source'];
		
		// Convert entries to CSV rows
		const rows = entries.map(entry => [
			entry.name || '',
			entry.email || '',
			entry.createdAt ? entry.createdAt.toDate().toLocaleString() : '',
			entry.status || 'pending',
			entry.source || 'website'
		]);

		// Combine headers and rows
		const csvContent = [headers, ...rows]
			.map(row => row.map(field => `"${field}"`).join(','))
			.join('\n');

		return csvContent;
	} catch (error) {
		console.error('Error exporting waiting list:', error);
		throw error;
	}
};

/**
 * Download waiting list as CSV file (admin only)
 */
export const downloadWaitingListCSV = async () => {
	try {
		const csvContent = await exportWaitingListCSV();
		
		// Create blob and download
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		
		if (link.download !== undefined) {
			const url = URL.createObjectURL(blob);
			link.setAttribute('href', url);
			link.setAttribute('download', `waiting-list-${new Date().toISOString().split('T')[0]}.csv`);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	} catch (error) {
		console.error('Error downloading waiting list:', error);
		throw error;
	}
};

/**
 * Get waiting list dashboard data (admin only)
 * @returns {Promise<Object>} Dashboard data with stats and recent entries
 */
export const getWaitingListDashboard = async () => {
	try {
		const isUserAdmin = await isAdmin();
		if (!isUserAdmin) {
			throw new Error('Unauthorized: Admin access required');
		}

		const [stats, entries] = await Promise.all([
			getWaitingListStats(),
			getAllWaitingListEntries()
		]);

		// Get recent entries (last 10)
		const recentEntries = entries.slice(0, 10);

		// Calculate daily signups for the last 7 days
		const last7Days = [];
		const now = new Date();
		for (let i = 6; i >= 0; i--) {
			const date = new Date(now);
			date.setDate(date.getDate() - i);
			date.setHours(0, 0, 0, 0);
			
			const nextDate = new Date(date);
			nextDate.setDate(nextDate.getDate() + 1);
			
			const dayEntries = entries.filter(entry => {
				if (!entry.createdAt) return false;
				const entryDate = entry.createdAt.toDate();
				return entryDate >= date && entryDate < nextDate;
			});

			last7Days.push({
				date: date.toISOString().split('T')[0],
				count: dayEntries.length
			});
		}

		return {
			stats: {
				...stats,
				recentSignups: last7Days
			},
			recentEntries
		};
	} catch (error) {
		console.error('Error getting waiting list dashboard:', error);
		throw error;
	}
};

/** @format */

import { postAPI } from "../config/ApiConfig";

/**
 * Format time ago string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted time ago string
 */
export const formatTimeAgo = (dateString) => {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now - date;
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return "now";
	if (diffMins < 60) return `${diffMins}m`;
	if (diffHours < 24) return `${diffHours}h`;
	return `${diffDays}d`;
};

/**
 * Format join date for profile display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted join date
 */
export const formatJoinDate = (dateString) => {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
	});
};

/**
 * Delete a post with error handling
 * @param {string} postId - Post ID to delete
 * @param {Function} onSuccess - Callback for successful deletion
 * @param {Function} onError - Callback for error handling
 * @returns {Promise<void>}
 */
export const deletePost = async (postId, onSuccess, onError) => {
	try {
		await postAPI.deletePost(postId);
		if (onSuccess) onSuccess(postId);
	} catch (error) {
		console.error("Error deleting post:", error.message || error);
		if (onError) onError(error.message || "Failed to delete post");
	}
};

/**
 * Handle post sharing with fallback to clipboard
 * @param {string} postId - Post ID to share
 * @returns {Promise<void>}
 */
export const sharePost = async (postId) => {
	try {
		await postAPI.sharePost(postId);

		const postUrl = `${window.location.origin}/post/${postId}`;

		if (navigator.share) {
			try {
				await navigator.share({
					title: "Check out this post! #DOPESocial",
					url: postUrl,
				});
			} catch (err) {
				// Fallback to clipboard if sharing fails
				navigator.clipboard.writeText(postUrl);
			}
		} else {
			// Fallback to clipboard for browsers that don't support Web Share API
			try {
				await navigator.clipboard.writeText(postUrl);
			} catch (err) {
				console.error("Failed to copy to clipboard:", err);
			}
		}
	} catch (error) {}
};

/**
 * Copy post link to clipboard
 * @param {string} postId - Post ID
 * @returns {Promise<void>}
 */
export const copyPostLink = async (postId) => {
	try {
		await navigator.clipboard.writeText(
			`${window.location.origin}/post/${postId}`,
		);
	} catch (err) {
		console.error("Failed to copy to clipboard:", err);
	}
};

/**
 * Handle post click navigation with exclusions for interactive elements
 * @param {string} postId - Post ID
 * @param {useNavigate} navigate - React Router navigate function
 */
export const handlePostClick = (postId, navigate) => {
	if (!postId) return;
	navigate(`/post/${postId}`);
};

/**
 * Handle post option actions
 * @param {string} action - Action type (copyLink, repost, report, delete)
 * @param {string} postId - Post ID
 * @param {Object} callbacks - Callbacks for different actions
 * @param {Function} callbacks.copyLink - Callback for copying link
 * @param {Function} callbacks.delete - Callback for deleting post
 */
export const handlePostOption = (action, postId, callbacks) => {
	switch (action) {
		case "copyLink":
			if (callbacks.copyLink) callbacks.copyLink();
			break;
		case "delete":
			if (callbacks.delete) callbacks.delete();
			break;
		case "repost":
			// Handle repost logic
			console.log("Repost:", postId);
			break;
		case "report":
			// Handle report logic
			console.log("Report:", postId);
			break;
		default:
			console.log("Unknown action:", action);
	}
};

// Analytics utility functions
export const calculateEngagementRate = (likes, comments, shares, views) => {
	if (!views || views === 0) return 0;
	const totalEngagements = (likes || 0) + (comments || 0) + (shares || 0);
	return ((totalEngagements / views) * 100).toFixed(1);
};

export const formatCurrency = (amount, currency = "USD") => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: currency,
		minimumFractionDigits: 2,
	}).format(amount);
};

export const formatNumber = (number) => {
	if (number >= 1000000) {
		return (number / 1000000).toFixed(1) + "M";
	} else if (number >= 1000) {
		return (number / 1000).toFixed(1) + "K";
	}
	return number.toString();
};

/**
 * Track post view
 * @param {string} postId - Post ID to track view for
 * @returns {Promise} Promise that resolves when view is tracked
 */
export const trackPostView = async (postId) => {
	try {
		const { postAPI } = await import("../config/ApiConfig");
		await postAPI.trackView(postId);
	} catch (error) {
		console.error("Failed to track post view:", error);
		// Don't throw to avoid breaking user experience
	}
};

export const getGrowthPercentage = (current, previous) => {
	if (!previous || previous === 0) return 0;
	return (((current - previous) / previous) * 100).toFixed(1);
};

/**
 * Get privacy icon based on privacy setting
 * @param {string} privacy - Privacy setting
 * @returns {JSX.Element} Privacy icon component
 */
export const getPrivacyIcon = (privacy) => {
	// This would need to be imported from react-bootstrap-icons in the component
	// Return null here as the icon selection should be done in the component
	return null;
};

/**
 * Format currency values
 * @param {number} amount - Amount in dollars
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency
	}).format(amount || 0);
};

/**
 * Format large numbers with K, M, B suffixes
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export const formatLargeNumber = (num) => {
	if (num >= 1000000000) {
		return (num / 1000000000).toFixed(1) + 'B';
	}
	if (num >= 1000000) {
		return (num / 1000000).toFixed(1) + 'M';
	}
	if (num >= 1000) {
		return (num / 1000).toFixed(1) + 'K';
	}
	return num?.toString() || '0';
};

/**
 * Calculate engagement rate
 * @param {Object} stats - Post stats object
 * @returns {number} Engagement rate percentage
 */
export const calculateEngagementRate = (stats) => {
	if (!stats || !stats.views || stats.views === 0) return 0;
	
	const totalEngagements = (stats.likes || 0) + (stats.comments || 0) + (stats.shares || 0);
	return ((totalEngagements / stats.views) * 100).toFixed(2);
};

/**
 * Track business metric (wrapper for business API)
 * @param {string} metric - Metric name
 * @param {Object} data - Metric data
 */
export const trackBusinessMetric = async (metric, data) => {
	try {
		// This would integrate with your analytics service
		console.log('Business metric tracked:', metric, data);
		
		// If you have a business API endpoint for custom tracking
		// await businessAPI.trackCustomMetric(metric, data);
	} catch (error) {
		console.error('Failed to track business metric:', error);
	}
};
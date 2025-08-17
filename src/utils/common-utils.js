
/** @format */

import { postAPI } from '../config/ApiConfig';

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
	const postUrl = `${window.location.origin}/post/${postId}`;

	if (navigator.share) {
		try {
			await navigator.share({
				title: "Check out this post",
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
};

/**
 * Copy post link to clipboard
 * @param {string} postId - Post ID
 * @returns {Promise<void>}
 */
export const copyPostLink = async (postId) => {
	try {
		await navigator.clipboard.writeText(
			`${window.location.origin}/post/${postId}`
		);
	} catch (err) {
		console.error("Failed to copy to clipboard:", err);
	}
};

/**
 * Handle post click navigation with exclusions for interactive elements
 * @param {string} postId - Post ID
 * @param {Event} e - Click event
 */
export const handlePostClick = (postId, e) => {
	// Don't navigate if clicking on buttons, links, dropdowns, or images
	if (
		e.target.closest("button") ||
		e.target.closest("a") ||
		e.target.closest(".dropdown") ||
		e.target.closest("img") ||
		e.target.tagName === "IMG"
	) {
		return;
	}
	window.location.href = `/post/${postId}`;
};

/**
 * Handle post option actions
 * @param {string} action - Action type (copyLink, repost, report, delete)
 * @param {string} postId - Post ID
 * @param {Object} options - Additional options
 * @param {Function} options.onDelete - Delete callback
 * @param {Function} options.onReport - Report callback
 * @param {Function} options.onRepost - Repost callback
 */
export const handlePostOption = (action, postId, options = {}) => {
	if (!postId) return;
	
	switch (action) {
		case "copyLink":
			copyPostLink(postId);
			break;
		case "repost":
			if (options.onRepost) options.onRepost(postId);
			console.log("Reposting post:", postId);
			break;
		case "report":
			if (options.onReport) options.onReport(postId);
			console.log("Reporting post:", postId);
			break;
		case "delete":
			if (options.onDelete) options.onDelete(postId);
			break;
		default:
			break;
	}
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

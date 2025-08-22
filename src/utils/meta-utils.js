/** @format */

/**
 * Updates the document title and meta tags dynamically
 * @param {Object} metaData - The meta data to update
 * @param {string} metaData.title - Page title
 * @param {string} metaData.description - Page description
 * @param {string} metaData.keywords - Page keywords
 * @param {string} metaData.ogTitle - Open Graph title
 * @param {string} metaData.ogDescription - Open Graph description
 * @param {string} metaData.ogImage - Open Graph image URL
 */
export const updatePageMeta = (metaData) => {
	const {
		title = "DOPE Network - Social Media Platform",
		description = "DOPE Network - A modern social media platform connecting communities worldwide. Share, discover, and engage with friends and communities.",
		keywords = "DOPE Network, social media, community, social networking, microblogging, posts, friends",
		ogTitle,
		ogDescription,
		ogImage = "/logo512.png"
	} = metaData;

	// Update document title
	document.title = title;

	// Update or create meta tags
	updateMetaTag('name', 'description', description);
	updateMetaTag('name', 'keywords', keywords);

	// Update Open Graph meta tags
	updateMetaTag('property', 'og:title', ogTitle || title);
	updateMetaTag('property', 'og:description', ogDescription || description);
	updateMetaTag('property', 'og:image', ogImage);
	updateMetaTag('property', 'og:url', window.location.href);

	// Update Twitter meta tags
	updateMetaTag('name', 'twitter:title', ogTitle || title);
	updateMetaTag('name', 'twitter:description', ogDescription || description);
	updateMetaTag('name', 'twitter:image', ogImage);
};

/**
 * Helper function to update or create a meta tag
 * @param {string} attributeName - The attribute name (name, property, etc.)
 * @param {string} attributeValue - The attribute value
 * @param {string} content - The content value
 */
const updateMetaTag = (attributeName, attributeValue, content) => {
	let metaTag = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);

	if (metaTag) {
		metaTag.setAttribute('content', content);
	} else {
		metaTag = document.createElement('meta');
		metaTag.setAttribute(attributeName, attributeValue);
		metaTag.setAttribute('content', content);
		document.head.appendChild(metaTag);
	}
};

/**
 * Predefined meta data for different pages
 */
export const pageMetaData = {
	home: {
		title: "Home - DOPE Network",
		description: "Stay connected with your community on DOPE Network. See the latest posts and updates from people you follow.",
		keywords: "DOPE Network, home, feed, social media, posts"
	},
	profile: (username, displayName) => ({
		title: `${displayName || username} (@${username}) - DOPE Network`,
		description: `View ${displayName || username}'s profile on DOPE Network. See their posts, followers, and more.`,
		keywords: `${username}, ${displayName}, profile, DOPE Network, social media`,
		ogTitle: `${displayName || username} on DOPE Network`
	}),
	settings: {
		title: "Settings - DOPE Network",
		description: "Manage your DOPE Network account settings, privacy preferences, and notifications.",
		keywords: "settings, account, privacy, notifications, DOPE Network"
	},
	accountSettings: {
		title: "Account Settings - DOPE Network",
		description: "Manage your account information, username, and basic profile settings.",
		keywords: "account settings, username, profile, DOPE Network"
	},
	profileSettings: {
		title: "Profile Settings - DOPE Network",
		description: "Update your profile information, bio, and profile picture.",
		keywords: "profile settings, bio, profile picture, DOPE Network"
	},
	privacySettings: {
		title: "Privacy Settings - DOPE Network",
		description: "Control your privacy settings and who can see your content.",
		keywords: "privacy settings, security, visibility, DOPE Network"
	},
	notificationSettings: {
		title: "Notification Settings - DOPE Network",
		description: "Manage your notification preferences and how you receive updates.",
		keywords: "notification settings, alerts, updates, DOPE Network"
	},
	subscription: {
		title: "Subscription - DOPE Network",
		description: "Manage your DOPE Network subscription and premium features.",
		keywords: "subscription, premium, features, billing, DOPE Network"
	},
	postDetail: (postContent) => ({
		title: `Post - DOPE Network`,
		description: postContent ? `${postContent.substring(0, 160)}...` : "View post on DOPE Network",
		keywords: "post, content, DOPE Network, social media"
	}),
	login: {
		title: "Sign In - DOPE Network",
		description: "Sign in to your DOPE Network account to connect with your community.",
		keywords: "login, sign in, authentication, DOPE Network"
	},
	signup: {
		title: "Sign Up - DOPE Network",
		description: "Join DOPE Network today and start connecting with communities worldwide.",
		keywords: "sign up, register, join, create account, DOPE Network"
	},
	liveStream: (streamTitle) => ({
		title: streamTitle ? `${streamTitle} - Live Stream - DOPE Network` : "Live Stream - DOPE Network",
		description: "Watch live streams on DOPE Network and interact with creators in real-time.",
		keywords: "live stream, streaming, video, DOPE Network"
	}),
	waitingList: {
		title: "Join the Waiting List - DOPE Social Network",
		description: "Be among the first to experience the next generation of social networking. Join our exclusive waiting list.",
		keywords: "waiting list, early access, beta, social network, DOPE"
	},
	networkTest: {
		title: "Network Diagnostics - DOPE Social Network",
		description: "Comprehensive network connectivity testing and API diagnostics tools for troubleshooting connection issues.",
		keywords: "network test, diagnostics, connectivity, API health, troubleshooting"
	},
	analytics: {
		title: "Analytics - DOPE Network",
		description: "View comprehensive analytics and insights for your DOPE Network account and content performance.",
		keywords: "analytics, insights, statistics, performance, DOPE Network"
	},
	search: {
		title: "Search - DOPE Network",
		description: "Search for posts, users, and content on DOPE Network.",
		keywords: "search, find, posts, users, content, DOPE Network"
	}
};
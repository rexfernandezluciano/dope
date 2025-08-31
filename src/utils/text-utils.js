/** @format */

import React, { useState, useEffect } from 'react';
import { userAPI } from '../config/ApiConfig';

// Component to resolve mention UIDs to display names
export const MentionComponent = ({ identifier, onMentionClick, displayName }) => {
	const [userData, setUserData] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const response = await userAPI.getUser(identifier);
				if (response && response.user) {
					setUserData(response.user);
				}
			} catch (error) {
				console.error('Error fetching user data:', error);
			} finally {
				setLoading(false);
			}
		};

		if (identifier) {
			fetchUserData();
		}
	}, [identifier]);

	if (loading) {
		return (
			<span 
				className="text-primary fw-bold mention-loading"
				style={{
					cursor: 'pointer',
					textDecoration: 'none',
					borderRadius: '4px',
					padding: '2px 4px',
					backgroundColor: 'rgba(13, 110, 253, 0.1)',
				}}
			>
				{displayName ? `@${displayName}` : `@${identifier}`}
			</span>
		);
	}

	if (!userData) {
		return (
			<span 
				className="text-primary fw-bold mention-error"
				style={{
					cursor: 'pointer',
					textDecoration: 'none',
					borderRadius: '4px',
					padding: '2px 4px',
					backgroundColor: 'rgba(13, 110, 253, 0.1)',
				}}
			>
				{displayName ? `@${displayName}` : `@${identifier}`}
			</span>
		);
	}

	return (
		<span
			className="text-primary fw-bold mention-link"
			style={{
				cursor: 'pointer',
				textDecoration: 'none',
				borderRadius: '4px',
				padding: '2px 4px',
				backgroundColor: 'rgba(13, 110, 253, 0.1)',
				transition: 'all 0.2s ease'
			}}
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				if (onMentionClick) {
					// Always navigate using username, not uid
					onMentionClick(userData.username);
				}
			}}
			onMouseEnter={(e) => {
				e.target.style.backgroundColor = 'rgba(13, 110, 253, 0.2)';
			}}
			onMouseLeave={(e) => {
				e.target.style.backgroundColor = 'rgba(13, 110, 253, 0.1)';
			}}
			title={`${userData.name} (@${userData.username})`}
		>
			{displayName || userData.name}
		</span>
	);
};

/**
 * Parse text content to handle line breaks, hashtags, mentions, and links
 * @param {string} text - The text content to parse
 * @param {Object} options - Parsing options
 * @returns {JSX.Element} Parsed text with interactive elements
 */
export const parseTextContent = (text, options = {}) => {
	if (!text) return null;

	const {
		onHashtagClick = (hashtag) => console.log('Hashtag clicked:', hashtag),
		onMentionClick = (mention) => console.log('Mention clicked:', mention),
		onLinkClick = (url) => window.open(url, '_blank'),
		className = ''
	} = options;

	// Split by line breaks first
	const lines = text.split('\n');

	return (
		<div className={className}>
			{lines.map((line, lineIndex) => (
				<div key={lineIndex}>
					{parseLineContent(line, { onHashtagClick, onMentionClick, onLinkClick })}
					{lineIndex < lines.length - 1 && <br />}
				</div>
			))}
		</div>
	);
};

/**
 * Parse a single line of text for hashtags, mentions, and links
 * @param {string} line - The line of text to parse
 * @param {Object} handlers - Event handlers for different elements
 * @returns {JSX.Element[]} Array of parsed elements
 */
const parseLineContent = (line, handlers) => {
	if (!line.trim()) return [<span key="empty"> </span>];

	// Regular expressions for different content types
	const patterns = {
		hashtag: /#[\w\u00c0-\u024f\u1e00-\u1eff]+/g,
		mention: /@\[([^\]]+)\]\(([^)]+)\)|@[\w\u00c0-\u024f\u1e00-\u1eff]+/g,
		url: /(https?:\/\/[^\s]+)/g,
		email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
	};

	// Create a combined pattern to find all matches
	const combinedPattern = new RegExp(
		`(${patterns.hashtag.source})|(${patterns.mention.source})|(${patterns.url.source})|(${patterns.email.source})`,
		'g'
	);

	const elements = [];
	let lastIndex = 0;
	let match;

	while ((match = combinedPattern.exec(line)) !== null) {
		// Add text before the match
		if (match.index > lastIndex) {
			elements.push(
				<span key={`text-${lastIndex}`}>
					{line.substring(lastIndex, match.index)}
				</span>
			);
		}

		const matchedText = match[0];

		// Determine the type of match and create appropriate element
		if (matchedText.startsWith('#')) {
			// Hashtag
			elements.push(
				<span
					key={`hashtag-${match.index}`}
					className="text-primary fw-bold"
					style={{ cursor: 'pointer' }}
					onClick={(e) => {
						e.stopPropagation();
						handlers.onHashtagClick(matchedText.substring(1));
					}}
				>
					{matchedText}
				</span>
			);
		} else if (matchedText.startsWith('@')) {
			// Check if it's a formatted mention @[Name](uid) or simple @username
			const formattedMentionMatch = matchedText.match(/@\[([^\]]+)\]\(([^)]+)\)/);

			if (formattedMentionMatch) {
				// Formatted mention: @[Display Name](uid)
				const [, displayName, uid] = formattedMentionMatch;
				elements.push(
					<MentionComponent
						key={`mention-${match.index}`}
						identifier={uid}
						onMentionClick={handlers.onMentionClick}
						displayName={displayName}
					/>
				);
			} else {
				// Simple mention: @username or @uid - resolve to display name
				const identifier = matchedText.substring(1);
				elements.push(
					<MentionComponent
						key={`mention-${match.index}`}
						identifier={identifier}
						onMentionClick={handlers.onMentionClick}
					/>
				);
			}
		} else if (matchedText.startsWith('http')) {
			// URL
			elements.push(
				<a
					key={`url-${match.index}`}
					href={matchedText}
					target="_blank"
					rel="noopener noreferrer"
					className="text-decoration-none"
					onClick={(e) => {
						e.stopPropagation();
						handlers.onLinkClick(matchedText);
					}}
				>
					{matchedText}
				</a>
			);
		} else if (matchedText.includes('@') && matchedText.includes('.')) {
			// Email
			elements.push(
				<a
					key={`email-${match.index}`}
					href={`mailto:${matchedText}`}
					className="text-decoration-none"
					onClick={(e) => {
						e.stopPropagation();
					}}
				>
					{matchedText}
				</a>
			);
		}

		lastIndex = match.index + matchedText.length;
	}

	// Add remaining text
	if (lastIndex < line.length) {
		elements.push(
			<span key={`text-${lastIndex}`}>
				{line.substring(lastIndex)}
			</span>
		);
	}

	return elements.length > 0 ? elements : [<span key="empty">{line}</span>];
};

/**
 * Extract hashtags from text
 * @param {string} text - The text to extract hashtags from
 * @returns {string[]} Array of hashtags (without #)
 */
export const extractHashtags = (text) => {
	if (!text) return [];
	const matches = text.match(/#[\w\u00c0-\u024f\u1e00-\u1eff]+/g);
	return matches ? matches.map(tag => tag.substring(1)) : [];
};

/**
 * Extract mentions from text
 * @param {string} text - The text to extract mentions from
 * @returns {string[]} Array of mentions (without @)
 */
export const extractMentions = (text) => {
	if (!text) return [];

	// Extract formatted mentions @[Name](uid)
	const formattedMentions = [];
	const formattedMatches = text.match(/@\[([^\]]+)\]\(([^)]+)\)/g);
	if (formattedMatches) {
		formattedMentions.push(...formattedMatches.map(match => {
			const uidMatch = match.match(/@\[([^\]]+)\]\(([^)]+)\)/);
			return uidMatch ? uidMatch[2] : match.substring(1);
		}));
	}

	// Extract simple mentions @username
	const simpleMentions = [];
	const simpleMatches = text.match(/@[\w\u00c0-\u024f\u1e00-\u1eff]+/g);
	if (simpleMatches) {
		simpleMentions.push(...simpleMatches.map(mention => mention.substring(1)));
	}

	return [...formattedMentions, ...simpleMentions];
};

/**
 * Extract URLs from text
 * @param {string} text - The text to extract URLs from
 * @returns {string[]} Array of URLs
 */
export const extractUrls = (text) => {
	if (!text) return [];
	const matches = text.match(/(https?:\/\/[^\s]+)/g);
	return matches || [];
};

/**
 * Validate and clean text content
 * @param {string} text - The text to clean
 * @returns {string} Cleaned text
 */
export const cleanTextContent = (text) => {
	if (!text) return '';
	return text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
};
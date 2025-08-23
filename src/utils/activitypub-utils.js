
import { activityPubAPI } from '../config/ApiConfig';

/**
 * Discover ActivityPub actor via WebFinger
 * @param {string} handle - User handle in format @username@domain
 * @returns {Promise<Object>} WebFinger response
 */
export const discoverActor = async (handle) => {
  try {
    // Remove @ symbol if present
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
    const resource = `acct:${cleanHandle}`;
    
    // Check if this is a federated user (contains @)
    const parts = cleanHandle.split('@');
    if (parts.length === 2) {
      // This is a federated user, use the federated proxy
      const [username, domain] = parts;
      const proxyUrl = `/federated?domain=${encodeURIComponent(domain)}&path=${encodeURIComponent('/.well-known/webfinger')}&resource=${encodeURIComponent(resource)}`;
      
      console.log(`🔍 Discovering federated actor: ${cleanHandle} via proxy: ${proxyUrl}`);
      
      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'application/jrd+json, application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Federated WebFinger lookup failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } else {
      // Local user, use the API
      const response = await activityPubAPI.getWebfinger(resource);
      return response;
    }
  } catch (error) {
    console.error('Failed to discover ActivityPub actor:', error);
    throw error;
  }
};

/**
 * Get user's ActivityPub actor profile
 * @param {string} username - Username
 * @returns {Promise<Object>} Actor profile
 */
export const getUserActor = async (username) => {
  try {
    const response = await activityPubAPI.getUserActor(username);
    return response;
  } catch (error) {
    console.error('Failed to get user actor:', error);
    throw error;
  }
};

/**
 * Get user's outbox (public posts)
 * @param {string} username - Username
 * @param {number} page - Page number (optional)
 * @returns {Promise<Object>} Outbox collection
 */
export const getUserOutbox = async (username, page = null) => {
  try {
    const response = await activityPubAPI.getUserOutbox(username, page);
    return response;
  } catch (error) {
    console.error('Failed to get user outbox:', error);
    throw error;
  }
};

/**
 * Check if a handle is from a federated instance
 * @param {string} handle - User handle
 * @returns {boolean} True if federated
 */
export const isFederatedHandle = (handle) => {
  return handle.includes('@') && handle.split('@').length === 3; // @username@domain.com
};

/**
 * Format ActivityPub handle for display
 * @param {string} handle - Raw handle
 * @returns {string} Formatted handle
 */
export const formatActivityPubHandle = (handle) => {
  if (!handle) return '';
  
  // If it's a federated handle, return as-is
  if (isFederatedHandle(handle)) {
    return handle;
  }
  
  // If it's a local user, just show @username
  return handle.startsWith('@') ? handle : `@${handle}`;
};

/**
 * Parse ActivityPub Note content
 * @param {Object} note - ActivityPub Note object
 * @returns {Object} Parsed content
 */
export const parseActivityPubNote = (note) => {
  return {
    id: note.id,
    content: note.content,
    published: note.published,
    author: note.attributedTo,
    attachments: note.attachment || [],
    inReplyTo: note.inReplyTo,
    tags: note.tag || [],
    mentions: (note.tag || [])
      .filter(tag => tag.type === 'Mention')
      .map(mention => mention.name),
    hashtags: (note.tag || [])
      .filter(tag => tag.type === 'Hashtag')
      .map(tag => tag.name)
  };
};

/**
 * Convert local post to ActivityPub Note format
 * @param {Object} post - Local post object
 * @param {string} baseUrl - Base URL of the instance
 * @returns {Object} ActivityPub Note
 */
export const convertPostToNote = (post, baseUrl) => {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `${baseUrl}/posts/${post.id}`,
    type: 'Note',
    content: post.content,
    attributedTo: `${baseUrl}/activitypub/users/${post.author.username}`,
    published: post.createdAt,
    to: post.privacy === 'public' ? ['https://www.w3.org/ns/activitystreams#Public'] : [],
    cc: post.privacy === 'followers' ? [`${baseUrl}/activitypub/users/${post.author.username}/followers`] : [],
    tag: [
      ...(post.hashtags || []).map(tag => ({
        type: 'Hashtag',
        href: `${baseUrl}/hashtag/${tag}`,
        name: `#${tag}`
      })),
      ...(post.mentions || []).map(mention => ({
        type: 'Mention',
        href: `${baseUrl}/${mention}`,
        name: `@${mention}`
      }))
    ],
    attachment: (post.imageUrls || []).map(url => ({
      type: 'Document',
      mediaType: 'image/jpeg', // Assume JPEG, could be more sophisticated
      url: url
    }))
  };
};

export default {
  discoverActor,
  getUserActor,
  getUserOutbox,
  isFederatedHandle,
  formatActivityPubHandle,
  parseActivityPubNote,
  convertPostToNote
};

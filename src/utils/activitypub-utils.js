import { activityPubAPI } from '../config/ApiConfig';

/**
 * Discover ActivityPub actor via WebFinger
 * @param {string} handle - User handle in format @username@domain
 * @param {boolean} checkDiscoverable - Whether to check the federatedDiscoverable flag
 * @returns {Promise<Object>} WebFinger response
 */
export const discoverActor = async (handle, checkDiscoverable = true) => {
  try {
    if (!handle || typeof handle !== 'string') {
      throw new Error('Invalid handle provided');
    }

    const cleanHandle = handle.replace(/^@/, '');
    console.log(`🔍 Discovering ActivityPub actor: ${cleanHandle}`);

    // Parse the handle
    const parts = cleanHandle.split('@');
    const resource = `acct:${cleanHandle}`;

    if (parts.length === 1) {
      // This is a local user, use local webfinger endpoint
      console.log(`🔍 Discovering local actor: ${cleanHandle}`);

      // If checking discoverability, verify the user has federated discovery enabled
      if (checkDiscoverable) {
        try {
          const userResponse = await fetch(`/v1/users/${parts[0]}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (!userData.user?.federatedDiscoverable) {
              throw new Error('User has disabled federated discovery');
            }
          }
        } catch (err) {
          console.warn('Could not verify federated discoverability:', err.message);
        }
      }

      const response = await activityPubAPI.getWebfinger(resource);
      return response;
    } else if (parts.length === 2) {
      // This is a federated user, use the federated proxy
      const [username, domain] = parts;
      const webfingerPath = `/.well-known/webfinger?resource=${encodeURIComponent(resource)}`;
      const proxyUrl = `/federated?domain=${encodeURIComponent(domain)}&path=${encodeURIComponent(webfingerPath)}`;

      console.log(`🔍 Discovering federated actor: ${cleanHandle} via proxy: ${proxyUrl}`);

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

const activityPubUtils = {
  discoverActor,
  getUserActor,
  getUserOutbox,
  isFederatedHandle,
  formatActivityPubHandle,
  parseActivityPubNote,
  convertPostToNote
};

export default activityPubUtils;
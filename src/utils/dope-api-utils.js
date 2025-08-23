import {
  searchAPI,
  analyticsAPI,
  subscriptionAPI,
  contentModerationAPI,
  blockAPI,
  reportAPI,
  sessionAPI
} from '../config/ApiConfig';

// Content moderation utilities
export const moderateText = async (text, contentType = 'post') => {
  try {
    const response = await contentModerationAPI.moderateContent({
      content: text,
      type: contentType
    });
    return response;
  } catch (error) {
    console.error('Content moderation failed:', error);
    return { flagged: false, severity: 'low' };
  }
};

export const checkImageSensitivity = async (imageUrl) => {
  try {
    const response = await contentModerationAPI.checkImageSensitivity(imageUrl);
    return response;
  } catch (error) {
    console.error('Image sensitivity check failed:', error);
    return { sensitive: false, confidence: 0 };
  }
};

// Hashtag utilities
export const extractHashtags = (text) => {
  if (!text) return [];
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.slice(1)) : [];
};

export const extractMentions = (text) => {
  if (!text) return [];
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const matches = text.match(mentionRegex);
  return matches ? matches.map(mention => mention.slice(1)) : [];
};

export const formatTextWithLinks = (text) => {
  if (!text) return '';

  // Replace hashtags with links
  text = text.replace(/#([a-zA-Z0-9_]+)/g, '<a href="/hashtag/$1" class="hashtag-link">#$1</a>');

  // Replace mentions with links
  text = text.replace(/@([a-zA-Z0-9_]+)/g, '<a href="/profile/$1" class="mention-link">@$1</a>');

  // Replace URLs with links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  text = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

  return text;
};

// Search utilities
export const performAdvancedSearch = async (query, filters = {}) => {
  try {
    const results = await searchAPI.globalSearch(query, {
      ...filters,
      includeHashtags: true,
      includeMentions: true,
      sortBy: filters.sortBy || 'relevance'
    });

    return {
      ...results,
      totalResults: (results.posts?.length || 0) +
                   (results.users?.length || 0) +
                   (results.comments?.length || 0)
    };
  } catch (error) {
    console.error('Advanced search failed:', error);
    return {
      posts: [],
      users: [],
      comments: [],
      hashtags: [],
      totalResults: 0
    };
  }
};

export const searchWithAutocomplete = async (query, type = 'all') => {
  try {
    if (type === 'users') {
      return await searchAPI.searchUsers(query, { limit: 5 });
    } else if (type === 'hashtags') {
      return await searchAPI.searchHashtags(query);
    } else {
      return await searchAPI.globalSearch(query, { limit: 10 });
    }
  } catch (error) {
    console.error('Autocomplete search failed:', error);
    return { results: [] };
  }
};

// Analytics utilities
export const formatAnalyticsData = (data) => {
  if (!data) return null;

  return {
    ...data,
    engagementRate: data.totalEngagements && data.totalViews
      ? ((data.totalEngagements / data.totalViews) * 100).toFixed(2)
      : '0.00',
    averageLikesPerPost: data.totalLikes && data.totalPosts
      ? (data.totalLikes / data.totalPosts).toFixed(1)
      : '0.0',
    growthRate: data.previousPeriod && data.currentPeriod
      ? (((data.currentPeriod - data.previousPeriod) / data.previousPeriod) * 100).toFixed(1)
      : '0.0'
  };
};

export const getEarningsReport = async (period = 'month') => {
  try {
    const data = await analyticsAPI.getEarningsAnalytics(period);
    return {
      ...data,
      formattedEarnings: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(data.totalEarnings || 0)
    };
  } catch (error) {
    console.error('Failed to get earnings report:', error);
    return { totalEarnings: 0, formattedEarnings: '$0.00' };
  }
};

// Subscription utilities
export const getSubscriptionStatus = async () => {
  try {
    const subscription = await subscriptionAPI.getSubscriptionInfo();
    return {
      ...subscription,
      isActive: subscription.status === 'active',
      isPremium: subscription.tier === 'premium' || subscription.tier === 'pro',
      isPro: subscription.tier === 'pro',
      daysUntilRenewal: subscription.nextBillingDate
        ? Math.ceil((new Date(subscription.nextBillingDate) - new Date()) / (1000 * 60 * 60 * 24))
        : null,
      formattedNextBilling: subscription.nextBillingDate
        ? new Date(subscription.nextBillingDate).toLocaleDateString()
        : null
    };
  } catch (error) {
    console.error('Failed to get subscription status:', error);
    return {
      isActive: false,
      isPremium: false,
      isPro: false,
      tier: 'free'
    };
  }
};

export const formatSubscriptionTier = (tier) => {
  const tiers = {
    free: { name: 'Free', color: 'secondary', features: ['Basic posting', 'Limited uploads'] },
    premium: { name: 'Premium', color: 'primary', features: ['HD uploads', 'Priority support', 'Advanced analytics'] },
    pro: { name: 'Pro', color: 'warning', features: ['4K uploads', 'Live streaming', 'Pro analytics', 'Blue checkmark'] }
  };

  return tiers[tier] || tiers.free;
};

// Payment utilities
export const formatPaymentMethod = (paymentMethod) => {
  if (!paymentMethod) return null;

  return {
    ...paymentMethod,
    maskedNumber: paymentMethod.last4 ? `****-****-****-${paymentMethod.last4}` : null,
    isExpired: paymentMethod.expiryDate
      ? new Date(paymentMethod.expiryDate) < new Date()
      : false,
    formattedExpiry: paymentMethod.expiryDate
      ? new Date(paymentMethod.expiryDate).toLocaleDateString()
      : null
  };
};

// Session management utilities
export const formatSessionInfo = (session) => {
  if (!session) return null;

  return {
    ...session,
    isCurrentSession: session.isCurrent,
    lastActiveFormatted: session.lastActive
      ? new Date(session.lastActive).toLocaleString()
      : null,
    createdAtFormatted: session.createdAt
      ? new Date(session.createdAt).toLocaleString()
      : null,
    deviceInfo: `${session.device || 'Unknown Device'} - ${session.browser || 'Unknown Browser'}`,
    locationInfo: session.location || 'Unknown Location'
  };
};

export const revokeAllOtherSessions = async () => {
  try {
    const sessions = await sessionAPI.getSessions();
    const otherSessions = sessions.filter(session => !session.isCurrent);

    const revokePromises = otherSessions.map(session =>
      sessionAPI.revokeSession(session._id)
    );

    await Promise.all(revokePromises);
    return { success: true, revokedCount: otherSessions.length };
  } catch (error) {
    console.error('Failed to revoke sessions:', error);
    return { success: false, error: error.message };
  }
};

// Block and report utilities
export const getBlockStatus = async (userId) => {
  try {
    const blockedUsers = await blockAPI.getBlockedUsers();
    return {
      isBlocked: blockedUsers.some(user => user._id === userId),
      blockedUsers
    };
  } catch (error) {
    console.error('Failed to get block status:', error);
    return { isBlocked: false, blockedUsers: [] };
  }
};

export const reportContent = async (contentType, contentId, reason, description = '') => {
  try {
    const response = await reportAPI.createReport({
      contentType,
      contentId,
      reason,
      description
    });
    return { success: true, reportId: response.reportId };
  } catch (error) {
    console.error('Failed to report content:', error);
    return { success: false, error: error.message };
  }
};

// Validation utilities
export const validatePostContent = (content, images = []) => {
  const errors = [];

  if (!content?.trim() && images.length === 0) {
    errors.push('Post must contain text or images');
  }

  if (content && content.length > 2000) {
    errors.push('Post content cannot exceed 2000 characters');
  }

  if (images.length > 10) {
    errors.push('Cannot upload more than 10 images per post');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCommentContent = (content) => {
  const errors = [];

  if (!content?.trim()) {
    errors.push('Comment cannot be empty');
  }

  if (content && content.length > 1000) {
    errors.push('Comment cannot exceed 1000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Utility for handling API errors
export const handleAPIError = (error) => {
  console.error('API Error:', error);

  const status = error.response?.status;
  const data = error.response?.data;
  
  // Use server-provided error message if available
  const serverMessage = data?.message || data?.error;

  switch (status) {
    case 400:
      return serverMessage || 'Invalid request. Please check your input and try again.';
    
    case 401:
      return serverMessage || 'Your session has expired. Please log in again.';
    
    case 403:
      return serverMessage || 'You do not have permission to perform this action.';
    
    case 404:
      return serverMessage || 'The requested resource was not found.';
    
    case 409:
      // Handle specific conflict scenarios
      if (serverMessage?.toLowerCase().includes('username')) {
        return 'This username is already taken. Please choose a different one.';
      } else if (serverMessage?.toLowerCase().includes('email')) {
        return 'This email address is already registered. Please use a different email or try logging in.';
      } else if (serverMessage?.toLowerCase().includes('already exists')) {
        return serverMessage;
      } else {
        return serverMessage || 'This resource already exists. Please check your input.';
      }
    
    case 422:
      return serverMessage || 'Validation failed. Please check your input and try again.';
    
    case 429:
      return serverMessage || 'Too many requests. Please wait a moment and try again.';
    
    case 500:
      return 'Internal server error. Our team has been notified. Please try again later.';
    
    case 502:
      return 'Service temporarily unavailable. Please try again in a few moments.';
    
    case 503:
      return 'Service is currently under maintenance. Please try again later.';
    
    case 504:
      return 'Request timeout. Please check your connection and try again.';
    
    default:
      if (status >= 500) {
        return serverMessage || 'Server error. Please try again later.';
      } else if (status >= 400) {
        return serverMessage || 'Request failed. Please check your input and try again.';
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        return 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.message) {
        return error.message;
      } else {
        return 'An unexpected error occurred. Please try again.';
      }
  }
};

// Rate limiting utilities
export const createRateLimiter = (maxRequests, windowMs) => {
  const requests = [];

  return () => {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove old requests
    while (requests.length > 0 && requests[0] < windowStart) {
      requests.shift();
    }

    if (requests.length >= maxRequests) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    requests.push(now);
  };
};

// Export commonly used rate limiters
export const searchRateLimiter = createRateLimiter(10, 60000); // 10 requests per minute
export const postRateLimiter = createRateLimiter(5, 60000); // 5 posts per minute
export const commentRateLimiter = createRateLimiter(20, 60000); // 20 comments per minute
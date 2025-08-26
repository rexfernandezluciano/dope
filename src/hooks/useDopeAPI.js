
import { useState, useEffect, useCallback } from 'react';
import { 
  authAPI, 
  userAPI, 
  postAPI, 
  commentAPI, 
  searchAPI, 
  analyticsAPI,
  notificationAPI,
  liveStreamAPI,
  hashtagAPI,
  subscriptionAPI,
  adminAPI,
  blockAPI,
  reportAPI,
  paymentAPI,
  sessionAPI,
  contentModerationAPI,
  likeAPI,
  replyAPI,
  imageAPI
} from '../config/ApiConfig.js';

// Custom hook for authentication
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.login(credentials);
      setUser(response.user);
      return response;
    } catch (err) {
      // Import the error handler to provide better error messages
      const { handleAPIError } = await import('../utils/dope-api-utils');
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.register(userData);
      return response;
    } catch (err) {
      // Import the error handler to provide better error messages
      const { handleAPIError } = await import('../utils/dope-api-utils');
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const verifyEmail = useCallback(async (verificationData) => {
    try {
      setLoading(true);
      const response = await authAPI.verifyEmail(verificationData);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authAPI.me();
        setUser(response.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    verifyEmail,
    setUser,
    setError
  };
};

// Custom hook for posts
export const usePosts = (initialParams = {}) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);

  const fetchPosts = useCallback(async (params = {}, replace = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = {
        ...initialParams,
        ...params,
        ...(cursor && !replace ? { cursor } : {})
      };

      const response = await postAPI.getPosts(1, 20, queryParams);
      
      if (replace) {
        setPosts(response.posts || []);
      } else {
        setPosts(prev => [...prev, ...(response.posts || [])]);
      }
      
      setHasMore(response.hasMore || false);
      setCursor(response.nextCursor || null);
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // Remove dependencies that cause loops

  const createPost = useCallback(async (postData) => {
    try {
      const response = await postAPI.createPost(postData);
      setPosts(prev => [response.post, ...prev]);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const likePost = useCallback(async (postId) => {
    try {
      const response = await postAPI.likePost(postId);
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { ...post, isLiked: response.isLiked, likesCount: response.likesCount }
          : post
      ));
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deletePost = useCallback(async (postId) => {
    try {
      await postAPI.deletePost(postId);
      setPosts(prev => prev.filter(post => post._id !== postId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchPosts({}, true);
  }, []);

  return {
    posts,
    loading,
    error,
    hasMore,
    fetchPosts,
    createPost,
    likePost,
    deletePost,
    setPosts,
    setError
  };
};

// Custom hook for comments
export const useComments = (postId) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComments = useCallback(async (params = {}) => {
    if (!postId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await commentAPI.getComments(postId, params);
      setComments(response.comments || []);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const createComment = useCallback(async (commentData) => {
    try {
      const response = await commentAPI.createComment(postId, commentData);
      setComments(prev => [...prev, response.comment]);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [postId]);

  const likeComment = useCallback(async (commentId) => {
    try {
      const response = await commentAPI.likeComment(commentId);
      setComments(prev => prev.map(comment => 
        comment._id === commentId 
          ? { ...comment, isLiked: response.isLiked, likesCount: response.likesCount }
          : comment
      ));
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteComment = useCallback(async (commentId) => {
    try {
      await commentAPI.deleteComment(commentId);
      setComments(prev => prev.filter(comment => comment._id !== commentId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    fetchComments,
    createComment,
    likeComment,
    deleteComment,
    setComments,
    setError
  };
};

// Custom hook for search
export const useSearch = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const globalSearch = useCallback(async (query, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await searchAPI.globalSearch(query, filters);
      setResults(response);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchUsers = useCallback(async (query, params = {}) => {
    try {
      setLoading(true);
      const response = await searchAPI.searchUsers(query, params);
      setResults(prev => ({ ...prev, users: response.users }));
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchPosts = useCallback(async (query, params = {}) => {
    try {
      setLoading(true);
      const response = await searchAPI.searchPosts(query, params);
      setResults(prev => ({ ...prev, posts: response.posts }));
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    results,
    loading,
    error,
    globalSearch,
    searchUsers,
    searchPosts,
    setResults,
    setError
  };
};

// Custom hook for notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationAPI.getNotifications(params);
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since it doesn't depend on external values

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev => prev.map(notif => 
        notif._id === notificationId ? { ...notif, read: true } : notif
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!hasInitialized) {
      fetchNotifications();
      setHasInitialized(true);
    }
  }, []); // Only run once on mount

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    setNotifications,
    setError
  };
};

// Custom hook for user profile
export const useUser = (username) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    if (!username) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await userAPI.getUser(username);
      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [username]);

  const followUser = useCallback(async () => {
    try {
      const response = await userAPI.followUser(username);
      setUser(prev => ({ 
        ...prev, 
        isFollowing: response.isFollowing,
        followersCount: response.followersCount 
      }));
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [username]);

  useEffect(() => {
    if (username) {
      fetchUser();
    }
  }, [username]); // Only depend on username, not fetchUser

  return {
    user,
    loading,
    error,
    fetchUser,
    followUser,
    setUser,
    setError
  };
};

// Custom hook for live streams
export const useLiveStreams = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLiveStreams = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await liveStreamAPI.getLiveStreams(params);
      setStreams(response.streams || []);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createStream = useCallback(async (streamData) => {
    try {
      const response = await liveStreamAPI.createStream(streamData);
      setStreams(prev => [response.stream, ...prev]);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const endStream = useCallback(async (streamId) => {
    try {
      await liveStreamAPI.endStream(streamId);
      setStreams(prev => prev.filter(stream => stream._id !== streamId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchLiveStreams();
  }, [fetchLiveStreams]);

  return {
    streams,
    loading,
    error,
    fetchLiveStreams,
    createStream,
    endStream,
    setStreams,
    setError
  };
};

// Export all APIs for direct use
export {
  authAPI,
  userAPI,
  postAPI,
  commentAPI,
  searchAPI,
  analyticsAPI,
  notificationAPI,
  liveStreamAPI,
  hashtagAPI,
  subscriptionAPI,
  adminAPI,
  blockAPI,
  reportAPI,
  paymentAPI,
  sessionAPI,
  contentModerationAPI,
  likeAPI,
  replyAPI,
  imageAPI
};

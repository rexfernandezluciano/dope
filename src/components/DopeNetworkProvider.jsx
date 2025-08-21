
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth, useNotifications } from '../hooks/useDopeAPI';
import { getSubscriptionStatus } from '../utils/dope-api-utils';

// Create contexts
const DopeNetworkContext = createContext();
const DopeNetworkDispatchContext = createContext();

// Action types
const ACTION_TYPES = {
  SET_USER: 'SET_USER',
  SET_SUBSCRIPTION: 'SET_SUBSCRIPTION',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  UPDATE_USER_STATS: 'UPDATE_USER_STATS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ',
  SET_THEME: 'SET_THEME',
  SET_PREFERENCES: 'SET_PREFERENCES'
};

// Initial state
const initialState = {
  user: null,
  subscription: null,
  notifications: [],
  unreadNotificationsCount: 0,
  isLoading: true,
  error: null,
  theme: 'light',
  preferences: {
    autoplay: true,
    showSensitiveContent: false,
    emailNotifications: true,
    pushNotifications: true
  }
};

// Reducer
const dopeNetworkReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_USER:
      return {
        ...state,
        user: action.payload,
        isLoading: false
      };
    
    case ACTION_TYPES.SET_SUBSCRIPTION:
      return {
        ...state,
        subscription: action.payload
      };
    
    case ACTION_TYPES.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload.notifications,
        unreadNotificationsCount: action.payload.unreadCount
      };
    
    case ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case ACTION_TYPES.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case ACTION_TYPES.UPDATE_USER_STATS:
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          stats: {
            ...state.user.stats,
            ...action.payload
          }
        } : null
      };
    
    case ACTION_TYPES.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadNotificationsCount: state.unreadNotificationsCount + 1
      };
    
    case ACTION_TYPES.MARK_NOTIFICATION_READ:
      return {
        ...state,
        notifications: state.notifications.map(notif =>
          notif._id === action.payload ? { ...notif, read: true } : notif
        ),
        unreadNotificationsCount: Math.max(0, state.unreadNotificationsCount - 1)
      };
    
    case ACTION_TYPES.SET_THEME:
      return {
        ...state,
        theme: action.payload
      };
    
    case ACTION_TYPES.SET_PREFERENCES:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload
        }
      };
    
    default:
      return state;
  }
};

// Provider component
export const DopeNetworkProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dopeNetworkReducer, initialState);
  const { user, loading: authLoading, error: authError } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading: notificationsLoading 
  } = useNotifications();

  // Load user data and subscription
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        dispatch({ type: ACTION_TYPES.SET_USER, payload: user });
        
        try {
          // Load subscription data
          const subscription = await getSubscriptionStatus();
          dispatch({ type: ACTION_TYPES.SET_SUBSCRIPTION, payload: subscription });
        } catch (error) {
          console.error('Failed to load subscription:', error);
        }
        
        // Load preferences from localStorage
        const savedPreferences = localStorage.getItem('dopeNetworkPreferences');
        if (savedPreferences) {
          try {
            const preferences = JSON.parse(savedPreferences);
            dispatch({ type: ACTION_TYPES.SET_PREFERENCES, payload: preferences });
          } catch (error) {
            console.error('Failed to parse saved preferences:', error);
          }
        }
        
        // Load theme from localStorage
        const savedTheme = localStorage.getItem('dopeNetworkTheme');
        if (savedTheme) {
          dispatch({ type: ACTION_TYPES.SET_THEME, payload: savedTheme });
        }
      } else {
        dispatch({ type: ACTION_TYPES.SET_USER, payload: null });
        dispatch({ type: ACTION_TYPES.SET_SUBSCRIPTION, payload: null });
      }
    };

    loadUserData();
  }, [user]);

  // Update notifications
  useEffect(() => {
    if (!notificationsLoading) {
      dispatch({
        type: ACTION_TYPES.SET_NOTIFICATIONS,
        payload: {
          notifications,
          unreadCount
        }
      });
    }
  }, [notifications, unreadCount, notificationsLoading]);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: authError });
    }
  }, [authError]);

  // Update loading state
  useEffect(() => {
    dispatch({ 
      type: ACTION_TYPES.SET_LOADING, 
      payload: authLoading || notificationsLoading 
    });
  }, [authLoading, notificationsLoading]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('dopeNetworkPreferences', JSON.stringify(state.preferences));
  }, [state.preferences]);

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('dopeNetworkTheme', state.theme);
    document.body.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  return (
    <DopeNetworkContext.Provider value={state}>
      <DopeNetworkDispatchContext.Provider value={dispatch}>
        {children}
      </DopeNetworkDispatchContext.Provider>
    </DopeNetworkContext.Provider>
  );
};

// Custom hooks to use the context
export const useDopeNetworkContext = () => {
  const context = useContext(DopeNetworkContext);
  if (!context) {
    throw new Error('useDopeNetworkContext must be used within a DopeNetworkProvider');
  }
  return context;
};

export const useDopeNetworkDispatch = () => {
  const dispatch = useContext(DopeNetworkDispatchContext);
  if (!dispatch) {
    throw new Error('useDopeNetworkDispatch must be used within a DopeNetworkProvider');
  }
  return dispatch;
};

// Action creators
export const dopeNetworkActions = {
  setUser: (user) => ({
    type: ACTION_TYPES.SET_USER,
    payload: user
  }),
  
  setSubscription: (subscription) => ({
    type: ACTION_TYPES.SET_SUBSCRIPTION,
    payload: subscription
  }),
  
  updateUserStats: (stats) => ({
    type: ACTION_TYPES.UPDATE_USER_STATS,
    payload: stats
  }),
  
  addNotification: (notification) => ({
    type: ACTION_TYPES.ADD_NOTIFICATION,
    payload: notification
  }),
  
  markNotificationRead: (notificationId) => ({
    type: ACTION_TYPES.MARK_NOTIFICATION_READ,
    payload: notificationId
  }),
  
  setTheme: (theme) => ({
    type: ACTION_TYPES.SET_THEME,
    payload: theme
  }),
  
  setPreferences: (preferences) => ({
    type: ACTION_TYPES.SET_PREFERENCES,
    payload: preferences
  }),
  
  setError: (error) => ({
    type: ACTION_TYPES.SET_ERROR,
    payload: error
  })
};

// Higher-order component for easy integration
export const withDopeNetwork = (Component) => {
  return (props) => (
    <DopeNetworkProvider>
      <Component {...props} />
    </DopeNetworkProvider>
  );
};

export default DopeNetworkProvider;

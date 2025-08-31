
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from '../hooks/useDopeAPI';
import { businessAPI, userAPI, notificationAPI } from '../config/ApiConfig';
import { centavosToPesos } from '../utils/common-utils';

// Create contexts
const DopeNetworkContext = createContext();
const DopeNetworkDispatchContext = createContext();

// Action types
const ACTION_TYPES = {
  SET_USER: 'SET_USER',
  SET_SUBSCRIPTION: 'SET_SUBSCRIPTION',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  SET_CREDITS: 'SET_CREDITS',
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
  credits: {
    credits: 0,
    creditsDisplay: "₱0.00",
    creditsInCentavos: 0
  },
  isLoading: true,
  error: null,
  theme: localStorage.getItem('dopeNetworkTheme') || 'light',
  preferences: JSON.parse(localStorage.getItem('dopeNetworkPreferences') || '{}') || {
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
        notifications: action.payload.notifications || [],
        unreadNotificationsCount: action.payload.unreadCount || 0
      };
    
    case ACTION_TYPES.SET_CREDITS:
      return {
        ...state,
        credits: action.payload
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

  // Load user data and related information
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        dispatch({ type: ACTION_TYPES.SET_USER, payload: user });
        
        try {
          // Load credits data
          const creditsData = await businessAPI.getCredits();
          dispatch({ type: ACTION_TYPES.SET_CREDITS, payload: {
            credits: centavosToPesos(creditsData.creditsInCentavos || 0),
            creditsDisplay: `₱${centavosToPesos(creditsData.creditsInCentavos || 0).toFixed(2)}`,
            creditsInCentavos: creditsData.creditsInCentavos || 0
          }});
        } catch (error) {
          console.error('Failed to load credits:', error);
          dispatch({ type: ACTION_TYPES.SET_CREDITS, payload: {
            credits: 0,
            creditsDisplay: "₱0.00",
            creditsInCentavos: 0
          }});
        }

        try {
          // Load subscription data if available
          if (user.subscription || user.membership?.subscription) {
            dispatch({ type: ACTION_TYPES.SET_SUBSCRIPTION, payload: user.subscription || user.membership?.subscription });
          }
        } catch (error) {
          console.error('Failed to load subscription:', error);
        }

        try {
          // Load notifications from Firestore
          const { getUserNotifications } = await import('../utils/messaging-utils');
          const notificationsData = await getUserNotifications(user.uid, 20);
          const unreadCount = notificationsData.filter(notif => !notif.read).length;
          dispatch({
            type: ACTION_TYPES.SET_NOTIFICATIONS,
            payload: {
              notifications: notificationsData,
              unreadCount
            }
          });
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
        
      } else {
        dispatch({ type: ACTION_TYPES.SET_USER, payload: null });
        dispatch({ type: ACTION_TYPES.SET_SUBSCRIPTION, payload: null });
        dispatch({ type: ACTION_TYPES.SET_CREDITS, payload: {
          credits: 0,
          creditsDisplay: "₱0.00",
          creditsInCentavos: 0
        }});
      }
    };

    if (!authLoading) {
      loadUserData();
    }
  }, [user, authLoading]);

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
      payload: authLoading 
    });
  }, [authLoading]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (Object.keys(state.preferences).length > 0) {
      localStorage.setItem('dopeNetworkPreferences', JSON.stringify(state.preferences));
    }
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

  setCredits: (credits) => ({
    type: ACTION_TYPES.SET_CREDITS,
    payload: credits
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

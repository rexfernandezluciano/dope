
import React, { createContext, useContext, useEffect, useState } from 'react';
import { generateSecureRandom } from '../utils/security-utils';

const SecurityContext = createContext();

export const useSecurityContext = () => {
	const context = useContext(SecurityContext);
	if (!context) {
		throw new Error('useSecurityContext must be used within SecurityProvider');
	}
	return context;
};

export const SecurityProvider = ({ children }) => {
	const [sessionId] = useState(() => generateSecureRandom(32));
	const [isSecureConnection, setIsSecureConnection] = useState(false);

	useEffect(() => {
		// Check if connection is secure
		setIsSecureConnection(window.location.protocol === 'https:' || window.location.hostname === 'localhost');

		// Setup security event listeners
		const handleVisibilityChange = () => {
			if (document.hidden) {
				// Clear sensitive data when tab becomes hidden
				console.log('Tab hidden - security measures active');
			}
		};

		const handleBeforeUnload = (e) => {
			// Clear sensitive data before page unload
			sessionStorage.removeItem('tempData');
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	}, []);

	const value = {
		sessionId,
		isSecureConnection,
	};

	return (
		<SecurityContext.Provider value={value}>
			{children}
		</SecurityContext.Provider>
	);
};

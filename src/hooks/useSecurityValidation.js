
import { useState, useCallback } from 'react';
import { SecurityMiddleware, validateFileUpload } from '../utils/security-utils';

export const useSecurityValidation = () => {
	const [errors, setErrors] = useState({});

	const validateField = useCallback((name, value, type) => {
		try {
			const sanitizedValue = SecurityMiddleware.validateInput(value, type);
			setErrors(prev => ({ ...prev, [name]: null }));
			return sanitizedValue;
		} catch (error) {
			setErrors(prev => ({ ...prev, [name]: error.message }));
			return null;
		}
	}, []);

	const validateFile = useCallback((file, maxSize, allowedTypes) => {
		try {
			validateFileUpload(file, maxSize, allowedTypes);
			return true;
		} catch (error) {
			setErrors(prev => ({ ...prev, file: error.message }));
			return false;
		}
	}, []);

	const sanitizeContent = useCallback((content) => {
		return SecurityMiddleware.sanitizeUserContent(content);
	}, []);

	const clearErrors = useCallback(() => {
		setErrors({});
	}, []);

	return {
		errors,
		validateField,
		validateFile,
		sanitizeContent,
		clearErrors
	};
};

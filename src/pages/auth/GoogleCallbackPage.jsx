import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spinner, Alert } from 'react-bootstrap';
import { authAPI, setAuthToken } from '../../config/ApiConfig';

const GoogleCallbackPage = () => {
	const [searchParams] = useSearchParams();
	const [status, setStatus] = useState('processing');
	const [message, setMessage] = useState('Processing authentication...');
	const navigate = useNavigate();

	useEffect(() => {
		console.log('GoogleCallbackPage: Component mounted');
		console.log('Current URL:', window.location.href);
		console.log('URL params:', Object.fromEntries(searchParams.entries()));
		console.log('URL search params:', window.location.search);
		console.log('URL hash:', window.location.hash);

		const handleCallback = async () => {
			try {
				// Get parameters from URL (check both search params and hash)
				const token = searchParams.get('token') || new URLSearchParams(window.location.hash.substring(1)).get('token');
				const error = searchParams.get('error') || new URLSearchParams(window.location.hash.substring(1)).get('error');
				const code = searchParams.get('code');
				const state = searchParams.get('state');
				const access_token = searchParams.get('access_token') || new URLSearchParams(window.location.hash.substring(1)).get('access_token');

				console.log('Callback params:', { token, error, code, state, access_token });

				if (error) {
					throw new Error(decodeURIComponent(error));
				}

				// Check for token in multiple formats (token, access_token, etc.)
				const authToken = token || access_token;

				if (authToken) {
					// Store the token and user data
					setAuthToken(authToken, true);

					// Get user data from token or make API call
					const userData = searchParams.get('user');
					let user = null;

					if (userData) {
						try {
							user = JSON.parse(decodeURIComponent(userData));
						} catch (e) {
							console.warn('Could not parse user data:', e);
							// Fallback: fetch user data from API
							try {
								const response = await authAPI.me();
								user = response.user || response;
							} catch (apiError) {
								console.warn('Could not fetch user data from API:', apiError);
								user = { token: authToken }; // Minimal user object
							}
						}
					} else {
						// Fetch user data from API
						try {
							const response = await authAPI.me();
							user = response.user || response;
						} catch (apiError) {
							console.warn('Could not fetch user data from API:', apiError);
							user = { token: authToken }; // Minimal user object
						}
					}

					// Send success message to parent window
					const result = {
						success: true,
						token: authToken,
						user: user
					};

					console.log('Sending success result to parent:', result);

					if (window.opener) {
						window.opener.postMessage({
							type: 'GOOGLE_AUTH_SUCCESS',
							result
						}, window.location.origin);
						window.close();
					} else {
						// Fallback: redirect to home page
						navigate('/', { replace: true });
					}
				} else if (code) {
					// If we have an authorization code but no token, the API didn't complete the OAuth flow
					throw new Error('OAuth flow incomplete - received authorization code but no access token. Check your API backend OAuth implementation.');
				} else {
					throw new Error('No token or authorization data received from server');
				}
			} catch (err) {
				console.error('Callback processing error:', err);

				const errorMessage = err.message || 'An unknown error occurred';

				// Send error message to parent window
				if (window.opener) {
					window.opener.postMessage({
						type: 'GOOGLE_AUTH_ERROR',
						error: errorMessage
					}, window.location.origin);
				}

				setStatus('error');
				setMessage(`Authentication failed: ${errorMessage}`);

				// Close popup after a short delay for errors
				setTimeout(() => {
					window.close();
				}, 3000);
			}
		};

		handleCallback();
	}, [searchParams, navigate]);

	return (
		<div className="d-flex align-items-center justify-content-center min-vh-100">
			<div className="text-center">
				{status === 'processing' && (
					<>
						<Spinner animation="border" className="mb-3" />
						<p>{message}</p>
					</>
				)}

				{status === 'success' && (
					<>
						<Alert variant="success">{message}</Alert>
						<p className="text-muted">This window will close automatically.</p>
					</>
				)}

				{status === 'error' && (
					<>
						<Alert variant="danger">{message}</Alert>
						<p className="text-muted">This window will close automatically.</p>
						<button
							className="btn btn-secondary mt-2"
							onClick={() => window.close()}
						>
							Close Window
						</button>
					</>
				)}
			</div>
		</div>
	);
};

export default GoogleCallbackPage;
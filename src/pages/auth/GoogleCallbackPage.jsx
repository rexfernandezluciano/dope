
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Spinner, Alert } from 'react-bootstrap';

const GoogleCallbackPage = () => {
	const [searchParams] = useSearchParams();
	const [status, setStatus] = useState('processing');
	const [message, setMessage] = useState('Processing authentication...');

	useEffect(() => {
		const handleCallback = () => {
			const success = searchParams.get('success');
			const error = searchParams.get('error');
			const token = searchParams.get('token');
			const user = searchParams.get('user');

			try {
				if (success === 'true' && token) {
					// Parse user data if provided
					let userData = null;
					if (user) {
						try {
							userData = JSON.parse(decodeURIComponent(user));
						} catch (e) {
							console.error('Error parsing user data:', e);
						}
					}

					const result = {
						token,
						user: userData,
						success: true
					};

					// Send success message to parent window
					if (window.opener) {
						window.opener.postMessage({
							type: 'GOOGLE_AUTH_SUCCESS',
							result
						}, window.location.origin);
						
						setStatus('success');
						setMessage('Authentication successful! Closing window...');
						
						// Close popup after a short delay
						setTimeout(() => {
							window.close();
						}, 1500);
					} else {
						setStatus('error');
						setMessage('Unable to communicate with parent window.');
					}
				} else {
					const errorMessage = error || 'Authentication failed';
					
					// Send error message to parent window
					if (window.opener) {
						window.opener.postMessage({
							type: 'GOOGLE_AUTH_ERROR',
							error: errorMessage
						}, window.location.origin);
						
						setStatus('error');
						setMessage(`Authentication failed: ${errorMessage}`);
						
						// Close popup after a short delay
						setTimeout(() => {
							window.close();
						}, 3000);
					} else {
						setStatus('error');
						setMessage(`Authentication failed: ${errorMessage}`);
					}
				}
			} catch (err) {
				console.error('Callback processing error:', err);
				
				if (window.opener) {
					window.opener.postMessage({
						type: 'GOOGLE_AUTH_ERROR',
						error: 'Callback processing error'
					}, window.location.origin);
				}
				
				setStatus('error');
				setMessage('Error processing authentication response.');
			}
		};

		handleCallback();
	}, [searchParams]);

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

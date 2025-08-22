
import React from 'react';
import { Alert, Container, Button } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		console.error('Error caught by boundary:', error, errorInfo);
	}

	componentDidMount() {
		// Handle uncaught syntax errors and other window errors
		window.addEventListener('error', this.handleWindowError);
		window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
	}

	componentWillUnmount() {
		window.removeEventListener('error', this.handleWindowError);
		window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
	}

	handleWindowError = (event) => {
		if (event.message.includes('Unexpected token')) {
			this.setState({ 
				hasError: true, 
				error: new Error('Application failed to load properly. Please refresh the page.') 
			});
		}
	}

	handleUnhandledRejection = (event) => {
		console.error('Unhandled promise rejection:', event.reason);
		this.setState({ 
			hasError: true, 
			error: new Error('An unexpected error occurred. Please refresh the page.') 
		});
	}

	render() {
		if (this.state.hasError) {
			return (
				<Container className="py-5">
					<Alert variant="danger">
						<Alert.Heading>Something went wrong</Alert.Heading>
						<p>An unexpected error occurred. Please try refreshing the page.</p>
						<Button 
							variant="outline-danger" 
							onClick={() => window.location.reload()}
						>
							Refresh Page
						</Button>
					</Alert>
				</Container>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;

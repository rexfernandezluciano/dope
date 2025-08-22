
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

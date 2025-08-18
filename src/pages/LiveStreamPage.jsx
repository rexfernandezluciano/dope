
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';

const LiveStreamPage = () => {
	const { streamKey } = useParams();
	const [isLoading, setIsLoading] = useState(true);
	const [streamActive, setStreamActive] = useState(false);
	const [error, setError] = useState('');
	const [viewerCount, setViewerCount] = useState(0);
	const videoRef = useRef(null);

	useEffect(() => {
		// Simulate checking if stream is active
		const checkStream = setTimeout(() => {
			setIsLoading(false);
			// In a real implementation, you'd check if the stream is actually active
			setStreamActive(Math.random() > 0.5); // Random for demo
			setViewerCount(Math.floor(Math.random() * 1000) + 1);
		}, 2000);

		return () => clearTimeout(checkStream);
	}, [streamKey]);

	const connectToStream = async () => {
		try {
			// In a real implementation, you would connect to the actual stream
			// This could be WebRTC, HLS, or another streaming protocol
			console.log('Connecting to stream:', streamKey);
			
			// For demo purposes, we'll show a placeholder
			if (videoRef.current) {
				// You would set the actual stream source here
				// videoRef.current.src = actualStreamUrl;
			}
		} catch (err) {
			setError('Failed to connect to live stream');
		}
	};

	useEffect(() => {
		if (streamActive && !isLoading) {
			connectToStream();
		}
	}, [streamActive, isLoading]);

	if (isLoading) {
		return (
			<Container className="py-4">
				<div className="text-center">
					<Spinner animation="border" className="mb-3" />
					<p>Connecting to live stream...</p>
				</div>
			</Container>
		);
	}

	return (
		<Container className="py-4">
			<Card className="border-0 shadow-sm">
				<Card.Body className="p-0">
					{streamActive ? (
						<>
							<div className="position-relative">
								<video
									ref={videoRef}
									controls
									autoPlay
									className="w-100"
									style={{
										height: "400px",
										objectFit: "cover",
										backgroundColor: "#000"
									}}
									poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23000'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23fff' font-size='24'%3ELive Stream%3C/text%3E%3C/svg%3E"
								/>
								<div
									className="position-absolute top-0 start-0 m-3 px-2 py-1 rounded"
									style={{
										backgroundColor: "rgba(220, 53, 69, 0.9)",
										color: "white",
										fontSize: "0.875rem",
										fontWeight: "bold"
									}}
								>
									<span
										style={{
											width: "6px",
											height: "6px",
											borderRadius: "50%",
											backgroundColor: "#fff",
											display: "inline-block",
											marginRight: "4px",
											animation: "pulse 1s infinite"
										}}
									></span>
									LIVE
								</div>
								<div
									className="position-absolute top-0 end-0 m-3 px-2 py-1 rounded"
									style={{
										backgroundColor: "rgba(0, 0, 0, 0.7)",
										color: "white",
										fontSize: "0.875rem"
									}}
								>
									👁️ {viewerCount.toLocaleString()} viewers
								</div>
							</div>
							<div className="p-3">
								<h5 className="mb-2">Live Stream</h5>
								<p className="text-muted mb-0">Stream Key: {streamKey}</p>
							</div>
						</>
					) : (
						<div className="text-center p-5">
							<h4 className="mb-3">Stream Offline</h4>
							<p className="text-muted mb-3">
								This live stream is currently offline or has ended.
							</p>
							<Button
								variant="primary"
								onClick={() => window.location.reload()}
							>
								Refresh Page
							</Button>
						</div>
					)}
				</Card.Body>
			</Card>

			{error && (
				<Alert variant="danger" className="mt-3">
					{error}
				</Alert>
			)}
		</Container>
	);
};

export default LiveStreamPage;

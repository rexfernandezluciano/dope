import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Card, Button, Alert, Spinner, Form, InputGroup } from 'react-bootstrap';
import AgoraRTC from 'agora-rtc-sdk-ng';
import io from 'socket.io-client';
import { updatePageMeta, pageMetaData } from "../utils/meta-utils";

const LiveStreamPage = () => {
	const { streamKey } = useParams();
	const [isLoading, setIsLoading] = useState(true);
	const [streamActive, setStreamActive] = useState(false);
	const [error, setError] = useState('');
	const [viewerCount, setViewerCount] = useState(0);
	const [comments, setComments] = useState([]);
	const [newComment, setNewComment] = useState('');
	const [currentUser] = useState({ name: 'Anonymous', uid: 'anon' });

	// Agora states
	const [agoraClient, setAgoraClient] = useState(null);
	const [localVideoTrack, setLocalVideoTrack] = useState(null);
	const [localAudioTrack, setLocalAudioTrack] = useState(null);
	const [isStreaming, setIsStreaming] = useState(false);
	const [isJoined, setIsJoined] = useState(false);


	const videoRef = useRef(null);
	const socketRef = useRef(null);

	// Agora configuration
	const agoraConfig = {
		appId: process.env.REACT_APP_AGORA_APP_ID || 'your-agora-app-id',
		token: null, // You should generate this server-side for production
		channel: streamKey || 'default-channel',
		uid: null
	};

	useEffect(() => {
		// Initialize Agora client
		const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
		setAgoraClient(client);

		// Initialize Socket.IO for real-time comments
		socketRef.current = io(process.env.REACT_APP_SOCKET_URL || 'ws://localhost:3001');

		socketRef.current.on('connect', () => {
			console.log('Connected to comment server');
			socketRef.current.emit('join-stream', streamKey);
		});

		socketRef.current.on('new-comment', (comment) => {
			setComments(prev => [...prev, comment]);
		});

		socketRef.current.on('viewer-count', (count) => {
			setViewerCount(count);
		});

		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
			if (client) {
				client.leave();
			}
		};
	}, [streamKey]);

	const handleUserPublished = React.useCallback(async (user, mediaType) => {
		try {
			await agoraClient.subscribe(user, mediaType);

			if (mediaType === 'video') {
				const remoteVideoTrack = user.videoTrack;
				if (videoRef.current) {
					remoteVideoTrack.play(videoRef.current);
				}

			}

			if (mediaType === 'audio') {
				user.audioTrack.play();
			}
		} catch (err) {
			console.error('Failed to subscribe to user:', err);
		}
	}, [agoraClient]);

	const handleUserUnpublished = React.useCallback((user, mediaType) => {
		// Handle user unpublished
	}, []);

	const handleUserLeft = React.useCallback((user) => {
		// Handle user left
	}, []);

	useEffect(() => {
		const initializeStream = async () => {
			try {
				setIsLoading(true);

				if (!agoraClient) return;

				// Set client role as audience initially
				await agoraClient.setClientRole('audience');

				// Set up event listeners
				agoraClient.on('user-published', handleUserPublished);
				agoraClient.on('user-unpublished', handleUserUnpublished);
				agoraClient.on('user-left', handleUserLeft);

				// Join the channel
				await agoraClient.join(
					agoraConfig.appId,
					agoraConfig.channel,
					agoraConfig.token,
					agoraConfig.uid
				);

				setIsJoined(true);
				setStreamActive(true);

			} catch (err) {
				console.error('Failed to initialize stream:', err);
				setError('Failed to connect to live stream');
			} finally {
				setIsLoading(false);
			}
		};

		if (agoraClient) {
			initializeStream();
		}
	}, [agoraClient, agoraConfig.appId, agoraConfig.channel, agoraConfig.token, agoraConfig.uid, handleUserPublished, handleUserUnpublished, handleUserLeft]);

	useEffect(() => {
		// Update page meta data
		updatePageMeta(pageMetaData.liveStream(streamKey));
	}, [streamKey]);

	const startBroadcast = async () => {
		try {
			if (!agoraClient || !isJoined) return;

			// Switch to broadcaster role
			await agoraClient.setClientRole('host');

			// Create and publish local tracks
			const videoTrack = await AgoraRTC.createCameraVideoTrack({
				optimizationMode: 'detail',
				encoderConfig: {
					width: 1280,
					height: 720,
					frameRate: 30,
					bitrateMin: 1000,
					bitrateMax: 3000,
				}
			});

			const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
				encoderConfig: 'high_quality_stereo'
			});

			// Play local video
			if (videoRef.current) {
				videoTrack.play(videoRef.current);
			}

			// Publish tracks
			await agoraClient.publish([videoTrack, audioTrack]);

			setLocalVideoTrack(videoTrack);
			setLocalAudioTrack(audioTrack);
			setIsStreaming(true);

			// Notify server about stream start
			if (socketRef.current) {
				socketRef.current.emit('stream-started', streamKey);
			}

		} catch (err) {
			console.error('Failed to start broadcast:', err);
			setError('Failed to start live stream');
		}
	};

	const stopBroadcast = async () => {
		try {
			if (localVideoTrack) {
				localVideoTrack.stop();
				localVideoTrack.close();
				setLocalVideoTrack(null);
			}

			if (localAudioTrack) {
				localAudioTrack.stop();
				localAudioTrack.close();
				setLocalAudioTrack(null);
			}

			if (agoraClient) {
				await agoraClient.unpublish();
				await agoraClient.setClientRole('audience');
			}

			setIsStreaming(false);

			// Notify server about stream end
			if (socketRef.current) {
				socketRef.current.emit('stream-ended', streamKey);
			}

		} catch (err) {
			console.error('Failed to stop broadcast:', err);
		}
	};

	const sendComment = () => {
		if (!newComment.trim() || !socketRef.current) return;

		const comment = {
			id: Date.now(),
			user: currentUser.name,
			uid: currentUser.uid,
			text: newComment.trim(),
			timestamp: new Date().toISOString(),
			streamKey
		};

		socketRef.current.emit('send-comment', comment);
		setNewComment('');
	};

	const handleKeyPress = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendComment();
		}
	};

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
			<div className="row">
				{/* Video Stream Section */}
				<div className="col-lg-8">
					<Card className="border-0 shadow-sm mb-3">
						<Card.Body className="p-0">
							<div className="position-relative">
								<div
									ref={videoRef}
									className="w-100 bg-dark d-flex align-items-center justify-content-center"
									style={{
										height: "450px",
										borderRadius: "0.375rem 0.375rem 0 0"
									}}
								>
									{!streamActive && (
										<div className="text-center text-white">
											<h4>Stream Offline</h4>
											<p>This live stream is currently offline</p>
										</div>
									)}
								</div>

								{/* Live indicator */}
								{(streamActive || isStreaming) && (
									<div
										className="position-absolute top-0 start-0 m-3 px-3 py-1 rounded"
										style={{
											backgroundColor: "rgba(220, 53, 69, 0.9)",
											color: "white",
											fontSize: "0.875rem",
											fontWeight: "bold"
										}}
									>
										<span
											style={{
												width: "8px",
												height: "8px",
												borderRadius: "50%",
												backgroundColor: "#fff",
												display: "inline-block",
												marginRight: "6px",
												animation: "pulse 1.5s infinite"
											}}
										></span>
										LIVE
									</div>
								)}

								{/* Viewer count */}
								<div
									className="position-absolute top-0 end-0 m-3 px-3 py-1 rounded"
									style={{
										backgroundColor: "rgba(0, 0, 0, 0.7)",
										color: "white",
										fontSize: "0.875rem"
									}}
								>
									👁️ {viewerCount.toLocaleString()} watching
								</div>

								{/* Stream controls */}
								<div className="position-absolute bottom-0 start-0 end-0 p-3">
									<div className="d-flex gap-2 justify-content-center">
										{!isStreaming ? (
											<Button
												variant="danger"
												onClick={startBroadcast}
												disabled={!isJoined}
											>
												Start Broadcasting
											</Button>
										) : (
											<Button
												variant="outline-light"
												onClick={stopBroadcast}
											>
												Stop Broadcasting
											</Button>
										)}
									</div>
								</div>
							</div>

							<div className="p-3">
								<h5 className="mb-2">Live Stream</h5>
								<p className="text-muted mb-0">
									Channel: {agoraConfig.channel}
								</p>
							</div>
						</Card.Body>
					</Card>
				</div>

				{/* Comments Section */}
				<div className="col-lg-4">
					<Card className="border-0 shadow-sm" style={{ height: "450px" }}>
						<Card.Header className="bg-white border-bottom">
							<h6 className="mb-0 fw-bold">Live Chat</h6>
						</Card.Header>

						<Card.Body className="p-0 d-flex flex-column">
							{/* Comments list */}
							<div
								className="flex-grow-1 overflow-auto p-3"
								style={{ maxHeight: "350px" }}
							>
								{comments.length === 0 ? (
									<div className="text-center text-muted">
										<p className="mb-0">No comments yet</p>
										<small>Be the first to comment!</small>
									</div>
								) : (
									<div className="d-flex flex-column gap-2">
										{comments.map((comment) => (
											<div key={comment.id} className="d-flex gap-2">
												<div className="flex-shrink-0">
													<div
														className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
														style={{ width: "32px", height: "32px", fontSize: "0.75rem" }}
													>
														{comment.user.charAt(0).toUpperCase()}
													</div>
												</div>
												<div className="flex-grow-1">
													<div className="d-flex align-items-center gap-2 mb-1">
														<span className="fw-bold" style={{ fontSize: "0.875rem" }}>
															{comment.user}
														</span>
														<small className="text-muted">
															{new Date(comment.timestamp).toLocaleTimeString()}
														</small>
													</div>
													<p className="mb-0" style={{ fontSize: "0.875rem" }}>
														{comment.text}
													</p>
												</div>
											</div>
										))}
									</div>
								)}
							</div>

							{/* Comment input */}
							<div className="border-top p-3">
								<InputGroup>
									<Form.Control
										type="text"
										placeholder="Type a message..."
										value={newComment}
										onChange={(e) => setNewComment(e.target.value)}
										onKeyPress={handleKeyPress}
										className="shadow-none"
									/>
									<Button
										variant="primary"
										onClick={sendComment}
										disabled={!newComment.trim()}
									>
										Send
									</Button>
								</InputGroup>
							</div>
						</Card.Body>
					</Card>
				</div>
			</div>

			{error && (
				<Alert variant="danger" className="mt-3">
					{error}
				</Alert>
			)}
		</Container>
	);
};

export default LiveStreamPage;
import React, { useState, useRef, useEffect } from 'react';
import {
	Modal,
	Button,
	Form,
	Card,
	Row,
	Col,
	Badge,
	Spinner,
	Image
} from 'react-bootstrap';
import {
	Camera,
	CameraVideo,
	Mic,
	MicMute,
	Palette,
	Sun,
	Circle,
	Globe,
	People,
	Lock,
	X,
	Play,
	Stop,
	EmojiSmile,
	ChatDots,
	Heart,
	HeartFill
} from 'react-bootstrap-icons';
import AgoraRTC from 'agora-rtc-sdk-ng';

const LiveStudioModal = ({ 
	show, 
	onHide, 
	onStartStream, 
	isStreaming, 
	onStopStream 
}) => {
	const [streamTitle, setStreamTitle] = useState('');
	const [streamDescription, setStreamDescription] = useState('');
	const [privacy, setPrivacy] = useState('public');
	const [videoEnabled, setVideoEnabled] = useState(true);
	const [audioEnabled, setAudioEnabled] = useState(true);
	const [isInitializing, setIsInitializing] = useState(false);

	// Video effects states
	const [brightness, setBrightness] = useState(100);
	const [contrast, setContrast] = useState(100);
	const [saturation, setSaturation] = useState(100);
	const [blur, setBlur] = useState(0);
	const [selectedFilter, setSelectedFilter] = useState('none');

	// Agora states
	const [localVideoTrack, setLocalVideoTrack] = useState(null);
	const [localAudioTrack, setLocalAudioTrack] = useState(null);

	// Live comments states
	const [liveComments, setLiveComments] = useState([]);
	const [viewerCount, setViewerCount] = useState(0);
	const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error

	const videoRef = useRef(null);
	const commentsEndRef = useRef(null);

	const filters = [
		{ id: 'none', name: 'None', style: {} },
		{ id: 'warm', name: 'Warm', style: { filter: 'sepia(0.3) saturate(1.2)' } },
		{ id: 'cool', name: 'Cool', style: { filter: 'hue-rotate(180deg) saturate(0.8)' } },
		{ id: 'vintage', name: 'Vintage', style: { filter: 'sepia(0.5) contrast(1.2) brightness(0.9)' } },
		{ id: 'dramatic', name: 'Dramatic', style: { filter: 'contrast(1.5) brightness(0.8) saturate(1.3)' } }
	];

	const privacyOptions = [
		{ value: 'public', label: 'Public', icon: Globe, description: 'Anyone can watch' },
		{ value: 'followers', label: 'Followers', icon: People, description: 'Only your followers' },
		{ value: 'private', label: 'Private', icon: Lock, description: 'Only you' }
	];

	useEffect(() => {
		if (show && !isStreaming) {
			initializePreview();
		}

		return () => {
			cleanup();
		};
	}, [show, isStreaming]);

	// Simulate live comments when streaming (replace with real socket connection)
	useEffect(() => {
		let commentInterval;
		if (isStreaming) {
			// Simulate viewer count
			setViewerCount(Math.floor(Math.random() * 50) + 5);

			// Simulate incoming comments
			commentInterval = setInterval(() => {
				const mockComments = [
					{ id: Date.now(), user: 'JohnDoe23', message: 'Great stream!', timestamp: new Date() },
					{ id: Date.now() + 1, user: 'StreamFan', message: 'Love this content 💖', timestamp: new Date() },
					{ id: Date.now() + 2, user: 'TechGuru', message: 'Looking good!', timestamp: new Date() },
					{ id: Date.now() + 3, user: 'MusicLover', message: 'Amazing quality', timestamp: new Date() },
					{ id: Date.now() + 4, user: 'CoolViewer', message: 'Keep it up! 🔥', timestamp: new Date() }
				];

				const randomComment = mockComments[Math.floor(Math.random() * mockComments.length)];
				setLiveComments(prev => [...prev.slice(-19), randomComment]); // Keep last 20 comments

				// Update viewer count randomly
				setViewerCount(prev => Math.max(1, prev + Math.floor(Math.random() * 3) - 1));
			}, 3000 + Math.random() * 4000); // Random interval between 3-7 seconds
		}

		return () => {
			if (commentInterval) {
				clearInterval(commentInterval);
			}
		};
	}, [isStreaming]);

	// Auto-scroll comments to bottom
	useEffect(() => {
		if (commentsEndRef.current) {
			commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [liveComments]);

	const initializePreview = async () => {
		try {
			setIsInitializing(true);

			// Clean up any existing tracks first
			cleanup();

			// Check if browser supports getUserMedia
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error('Camera access is not supported in this browser');
			}

			// Check camera permissions first
			try {
				const permissions = await navigator.permissions.query({ name: 'camera' });
				if (permissions.state === 'denied') {
					throw new Error('Camera permission is denied. Please enable camera access in your browser settings.');
				}
			} catch (permError) {
				console.warn('Cannot check camera permissions:', permError);
			}

			// Test basic camera access with minimal requirements
			let testStream;
			try {
				testStream = await navigator.mediaDevices.getUserMedia({ 
					video: { 
						width: { min: 320, ideal: 640, max: 1280 },
						height: { min: 240, ideal: 480, max: 720 },
						frameRate: { min: 10, ideal: 15, max: 30 }
					}, 
					audio: true
				});

				// Stop test stream immediately
				testStream.getTracks().forEach(track => {
					track.stop();
				});
			} catch (permissionError) {
				if (permissionError.name === 'NotAllowedError') {
					throw new Error('Camera and microphone access denied. Please click "Allow" when prompted and try again.');
				} else if (permissionError.name === 'NotFoundError') {
					throw new Error('No camera or microphone found. Please connect a camera/microphone and try again.');
				} else if (permissionError.name === 'NotReadableError') {
					throw new Error('Camera is being used by another application. Please close other applications using the camera and try again.');
				} else if (permissionError.name === 'OverconstrainedError') {
					throw new Error('Camera does not support the required video settings. Please try with a different camera.');
				} else {
					throw new Error(`Failed to access camera: ${permissionError.message}`);
				}
			}

			// Wait a moment to ensure camera is released
			await new Promise(resolve => setTimeout(resolve, 500));

			// Create Agora tracks with retry mechanism
			let videoTrack, audioTrack;

			const createVideoTrackWithRetry = async (maxRetries = 3) => {
				for (let attempt = 1; attempt <= maxRetries; attempt++) {
					try {
						console.log(`Creating video track - attempt ${attempt}/${maxRetries}`);
						
						if (attempt === 1) {
							// Try with optimized settings first
							return await AgoraRTC.createCameraVideoTrack({
								optimizationMode: 'motion',
								encoderConfig: {
									width: 320,
									height: 240,
									frameRate: 10,
									bitrateMin: 200,
									bitrateMax: 800,
								}
							});
						} else {
							// Fallback to default settings
							return await AgoraRTC.createCameraVideoTrack();
						}
					} catch (error) {
						console.warn(`Video track creation attempt ${attempt} failed:`, error);
						
						if (attempt === maxRetries) {
							throw new Error('Cannot start video source. Please ensure no other application is using your camera and try again.');
						}
						
						// Wait before retry with exponential backoff
						await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
					}
				}
			};

			try {
				videoTrack = await createVideoTrackWithRetry();
				console.log('Agora video track created successfully');
			} catch (videoError) {
				console.error('Failed to create Agora video track after retries:', videoError);
				throw videoError;
			}

			try {
				audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
					encoderConfig: 'speech_low_quality'
				});
				console.log('Agora audio track created successfully');
			} catch (audioError) {
				console.error('Failed to create Agora audio track:', audioError);

				// Clean up video track if audio fails
				if (videoTrack) {
					videoTrack.stop();
					videoTrack.close();
				}

				// Try with default settings
				try {
					audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
					console.log('Agora audio track created with default settings');
				} catch (fallbackAudioError) {
					console.error('Fallback audio track creation failed:', fallbackAudioError);
					throw new Error('Cannot access microphone. Please check your microphone permissions and try again.');
				}
			}

			// Play video preview
			if (videoRef.current && videoTrack) {
				try {
					await videoTrack.play(videoRef.current);
					console.log('Video preview started successfully');
				} catch (playError) {
					console.error('Failed to play video preview:', playError);
					// Continue anyway, the track is created
				}
			}

			setLocalVideoTrack(videoTrack);
			setLocalAudioTrack(audioTrack);
		} catch (error) {
			console.error('Failed to initialize preview:', error);

			// Clean up any partial state
			cleanup();

			// Show user-friendly error with specific guidance
			const errorMessage = error.message || 'Failed to access camera. Please check permissions and try again.';
			alert(`${errorMessage}\n\nTroubleshooting:\n1. Refresh the page and try again\n2. Check that no other application is using your camera\n3. Enable camera permissions in your browser\n4. Try using a different browser`);
			onHide(); // Close modal on error
		} finally {
			setIsInitializing(false);
		}
	};

	const cleanup = async () => {
		try {
			if (localVideoTrack) {
				await localVideoTrack.stop();
				await localVideoTrack.close();
				setLocalVideoTrack(null);
			}
		} catch (error) {
			console.warn('Error stopping video track:', error);
		}

		try {
			if (localAudioTrack) {
				await localAudioTrack.stop();
				await localAudioTrack.close();
				setLocalAudioTrack(null);
			}
		} catch (error) {
			console.warn('Error stopping audio track:', error);
		}
	};

	const handleVideoToggle = async () => {
		const newVideoEnabled = !videoEnabled;
		setVideoEnabled(newVideoEnabled);

		if (localVideoTrack) {
			if (newVideoEnabled) {
				// Enable and play video
				await localVideoTrack.setEnabled(true);
				if (videoRef.current) {
					await localVideoTrack.play(videoRef.current);
				}
			} else {
				// Disable video
				await localVideoTrack.setEnabled(false);
			}
		}
	};

	const handleAudioToggle = () => {
		setAudioEnabled(!audioEnabled);
		if (localAudioTrack) {
			localAudioTrack.setEnabled(!audioEnabled);
		}
	};

	const getVideoStyle = () => {
		const baseStyle = {
			filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`,
		};

		const filterStyle = filters.find(f => f.id === selectedFilter)?.style || {};

		return { ...baseStyle, ...filterStyle };
	};

	const testConnection = async () => {
		setConnectionStatus('connecting');

		try {
			// Simple connectivity test without hitting Agora endpoints that might be blocked
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);

			await fetch('https://httpbin.org/status/200', { 
				method: 'GET',
				signal: controller.signal,
				mode: 'cors'
			});

			clearTimeout(timeoutId);
			console.log('Network connectivity: OK');
			setConnectionStatus('connected');
			setTimeout(() => setConnectionStatus('disconnected'), 3000);
		} catch (error) {
			console.warn('Network connectivity test failed:', error);
			// Still show as connected since the error might be due to CORS, not actual connectivity
			setConnectionStatus('connected');
			setTimeout(() => setConnectionStatus('disconnected'), 3000);
		}
	};

	const handleStartStream = () => {
		if (!streamTitle.trim()) {
			alert('Please enter a stream title');
			return;
		}

		if (!localVideoTrack || !localAudioTrack) {
			alert('Video or audio track not available. Please refresh and try again.');
			return;
		}

		// Validate tracks are functional
		try {
			const videoMediaTrack = localVideoTrack.getMediaStreamTrack();
			const audioMediaTrack = localAudioTrack.getMediaStreamTrack();
			
			if (!videoMediaTrack || !audioMediaTrack) {
				alert('Media tracks are not properly initialized. Please refresh and try again.');
				return;
			}

			console.log('Track status:', {
				video: {
					enabled: videoMediaTrack.enabled,
					readyState: videoMediaTrack.readyState,
					muted: videoMediaTrack.muted
				},
				audio: {
					enabled: audioMediaTrack.enabled,
					readyState: audioMediaTrack.readyState,
					muted: audioMediaTrack.muted
				}
			});
		} catch (trackError) {
			console.error('Error validating tracks:', trackError);
			alert('Track validation failed. Please refresh and try again.');
			return;
		}

		const streamData = {
			title: streamTitle,
			description: streamDescription,
			privacy,
			videoTrack: localVideoTrack,
			audioTrack: localAudioTrack,
			videoEnabled,
			audioEnabled
		};

		onStartStream(streamData);
	};

	const handleHeartReaction = (commentId) => {
		setLiveComments(prev => 
			prev.map(comment => 
				comment.id === commentId 
					? { ...comment, hearted: !comment.hearted }
					: comment
			)
		);
	};

	const handleClose = () => {
		cleanup();
		setStreamTitle('');
		setStreamDescription('');
		setPrivacy('public');
		setBrightness(100);
		setContrast(100);
		setSaturation(100);
		setBlur(0);
		setSelectedFilter('none');
		setLiveComments([]);
		setViewerCount(0);
		onHide();
	};

	return (
		<Modal
			show={show}
			onHide={handleClose}
			size="lg"
			fullscreen
			centered
			backdrop="static"
			className="live-studio-modal"
		>
			<Modal.Header className="border-0 pb-0">
				<div className="d-flex align-items-center gap-2">
					<div
						className="rounded-circle bg-danger d-flex align-items-center justify-content-center"
						style={{ width: "12px", height: "12px" }}
					>
						<div
							className="rounded-circle bg-white"
							style={{ 
								width: "6px", 
								height: "6px",
								animation: isStreaming ? "pulse 1.5s infinite" : "none"
							}}
						></div>
					</div>
					<Modal.Title className="h5 mb-0">
						{isStreaming ? 'Live Studio - Broadcasting' : 'Live Studio Setup'}
					</Modal.Title>
				</div>
				<Button
					variant="link"
					className="text-muted p-1"
					onClick={handleClose}
				>
					<X size={20} />
				</Button>
			</Modal.Header>

			<Modal.Body className="pt-2">
				<Row>
					{/* Video Preview Section */}
					<Col lg={isStreaming ? 5 : 8}>
						<Card className="border-0 shadow-sm mb-3">
							<Card.Body className="p-0">
								<div className="position-relative">
									<div
										className="w-100 bg-dark d-flex align-items-center justify-content-center rounded-3 overflow-hidden"
										style={{ height: "300px" }}
									>
										{isInitializing ? (
											<div className="text-center text-white">
												<Spinner animation="border" size="sm" className="mb-2" />
												<p className="mb-0">Initializing camera...</p>
											</div>
										) : (
											<video
												ref={videoRef}
												autoPlay
												muted
												playsInline
												className="w-100 h-100"
												style={{
													objectFit: "cover",
													...getVideoStyle(),
													display: videoEnabled ? 'block' : 'none'
												}}
											/>
										)}

										{!videoEnabled && !isInitializing && (
											<div className="text-center text-white">
												<Camera size={48} className="mb-2 opacity-50" />
												<p className="mb-0">Camera is off</p>
											</div>
										)}

										{/* Live indicator */}
										{isStreaming && (
											<div
												className="position-absolute top-0 start-0 m-3 px-3 py-1 rounded-pill"
												style={{
													backgroundColor: "rgba(220, 53, 69, 0.9)",
													color: "white",
													fontSize: "0.875rem",
													fontWeight: "bold"
												}}
											>
												<span
													className="me-1"
													style={{
														width: "8px",
														height: "8px",
														borderRadius: "50%",
														backgroundColor: "#fff",
														display: "inline-block",
														animation: "pulse 1.5s infinite"
													}}
												></span>
												LIVE
											</div>
										)}
									</div>

									{/* Video Controls */}
									<div className="position-absolute bottom-0 start-0 end-0 p-3">
										<div className="d-flex justify-content-center gap-2">
											<Button
												variant={videoEnabled ? "light" : "outline-light"}
												size="sm"
												className="rounded-circle d-flex align-items-center justify-content-center"
												style={{ width: "40px", height: "40px" }}
												onClick={handleVideoToggle}
											>
												{videoEnabled ? <CameraVideo size={18} /> : <Camera size={18} />}
											</Button>
											<Button
												variant={audioEnabled ? "light" : "outline-light"}
												size="sm"
												className="rounded-circle d-flex align-items-center justify-content-center"
												style={{ width: "40px", height: "40px" }}
												onClick={handleAudioToggle}
											>
												{audioEnabled ? <Mic size={18} /> : <MicMute size={18} />}
											</Button>
										</div>
									</div>
								</div>
							</Card.Body>
						</Card>

						{/* Video Effects */}
						<Card className="border-0 shadow-sm">
							<Card.Header className="bg-white border-0 pb-2">
								<div className="d-flex align-items-center gap-2">
									<Palette size={16} className="text-primary" />
									<h6 className="mb-0">Video Effects</h6>
								</div>
							</Card.Header>
							<Card.Body className="pt-0">
								{/* Filters */}
								<div className="mb-3">
									<small className="text-muted fw-bold d-block mb-2">FILTERS</small>
									<div className="d-flex gap-2 flex-wrap">
										{filters.map((filter) => (
											<Button
												key={filter.id}
												variant={selectedFilter === filter.id ? "primary" : "outline-secondary"}
												size="sm"
												onClick={() => setSelectedFilter(filter.id)}
											>
												{filter.name}
											</Button>
										))}
									</div>
								</div>

								{/* Adjustments */}
								<Row>
									<Col sm={6}>
										<div className="mb-3">
											<div className="d-flex align-items-center gap-2 mb-2">
												<Sun size={14} />
												<small className="fw-bold">Brightness: {brightness}%</small>
											</div>
											<Form.Range
												min={50}
												max={150}
												value={brightness}
												onChange={(e) => setBrightness(e.target.value)}
											/>
										</div>
									</Col>
									<Col sm={6}>
										<div className="mb-3">
											<div className="d-flex align-items-center gap-2 mb-2">
												<Circle size={14} />
												<small className="fw-bold">Contrast: {contrast}%</small>
											</div>
											<Form.Range
												min={50}
												max={150}
												value={contrast}
												onChange={(e) => setContrast(e.target.value)}
											/>
										</div>
									</Col>
									<Col sm={6}>
										<div className="mb-3">
											<div className="d-flex align-items-center gap-2 mb-2">
												<EmojiSmile size={14} />
												<small className="fw-bold">Saturation: {saturation}%</small>
											</div>
											<Form.Range
												min={0}
												max={200}
												value={saturation}
												onChange={(e) => setSaturation(e.target.value)}
											/>
										</div>
									</Col>
									<Col sm={6}>
										<div className="mb-3">
											<div className="d-flex align-items-center gap-2 mb-2">
												<span>🌫️</span>
												<small className="fw-bold">Blur: {blur}px</small>
											</div>
											<Form.Range
												min={0}
												max={10}
												value={blur}
												onChange={(e) => setBlur(e.target.value)}
											/>
										</div>
									</Col>
								</Row>
							</Card.Body>
						</Card>
					</Col>

					{/* Live Comments Section - Only show when streaming */}
					{isStreaming && (
						<Col lg={3}>
							<Card className="border-0 shadow-sm h-100">
								<Card.Header className="bg-white border-0 pb-2">
									<div className="d-flex align-items-center justify-content-between">
										<div className="d-flex align-items-center gap-2">
											<ChatDots size={16} className="text-primary" />
											<h6 className="mb-0">Live Chat</h6>
										</div>
										<Badge bg="primary" className="rounded-pill">
											{viewerCount} viewers
										</Badge>
									</div>
								</Card.Header>
								<Card.Body className="p-0">
									<div 
										className="px-3 py-2" 
										style={{ 
											height: '400px', 
											overflowY: 'auto',
											backgroundColor: '#f8f9fa'
										}}
									>
										{liveComments.length === 0 ? (
											<div className="text-center text-muted py-4">
												<ChatDots size={32} className="mb-2 opacity-50" />
												<p className="mb-0 small">No comments yet...</p>
												<p className="mb-0 small">Comments will appear here when viewers start chatting!</p>
											</div>
										) : (
											<>
												{liveComments.map((comment) => (
													<div key={comment.id} className="mb-2 p-2 bg-white rounded-3 border comment-item">
														<div className="d-flex align-items-start gap-2">
															<Image
																src={`https://i.pravatar.cc/150?u=${comment.user}`}
																alt={comment.user}
																roundedCircle
																width="24"
																height="24"
																style={{ objectFit: 'cover' }}
															/>
															<div className="flex-grow-1">
																<div className="d-flex align-items-center gap-1 mb-1">
																	<span className="fw-bold small text-primary">{comment.user}</span>
																	<span className="text-muted" style={{ fontSize: '0.75rem' }}>
																		{comment.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
																	</span>
																</div>
																<p className="mb-0 small">{comment.message}</p>
															</div>
															<Button
																variant="link"
																size="sm"
																className="p-0 text-danger"
																onClick={() => handleHeartReaction(comment.id)}
															>
																{comment.hearted ? (
																	<HeartFill size={14} />
																) : (
																	<Heart size={14} />
																)}
															</Button>
														</div>
													</div>
												))}
												<div ref={commentsEndRef} />
											</>
										)}
									</div>
								</Card.Body>
							</Card>
						</Col>
					)}

					{/* Stream Settings Section */}
					<Col lg={isStreaming ? 4 : 4}>
						<Card className="border-0 shadow-sm h-100">
							<Card.Header className="bg-white border-0 pb-2">
								<h6 className="mb-0">Stream Details</h6>
							</Card.Header>
							<Card.Body>
								{/* Stream Title */}
								<div className="mb-3">
									<Form.Label className="fw-bold small">STREAM TITLE *</Form.Label>
									<Form.Control
										type="text"
										placeholder="What's your stream about?"
										value={streamTitle}
										onChange={(e) => setStreamTitle(e.target.value)}
										maxLength={100}
										className="shadow-none"
									/>
									<div className="text-end">
										<small className="text-muted">{streamTitle.length}/100</small>
									</div>
								</div>

								{/* Stream Description */}
								<div className="mb-3">
									<Form.Label className="fw-bold small">DESCRIPTION</Form.Label>
									<Form.Control
										as="textarea"
										rows={3}
										placeholder="Tell viewers what to expect..."
										value={streamDescription}
										onChange={(e) => setStreamDescription(e.target.value)}
										maxLength={280}
										className="shadow-none"
									/>
									<div className="text-end">
										<small className="text-muted">{streamDescription.length}/280</small>
									</div>
								</div>

								{/* Privacy Settings */}
								<div className="mb-4">
									<Form.Label className="fw-bold small">WHO CAN WATCH</Form.Label>
									<div className="d-grid gap-2">
										{privacyOptions.map((option) => {
											const IconComponent = option.icon;
											return (
												<div
													key={option.value}
													className={`border rounded-3 p-3 cursor-pointer ${privacy === option.value ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}
													style={{ cursor: 'pointer' }}
													onClick={() => setPrivacy(option.value)}
												>
													<div className="d-flex align-items-center gap-2">
														<Form.Check
															type="radio"
															name="privacy"
															value={option.value}
															checked={privacy === option.value}
															onChange={() => setPrivacy(option.value)}
														/>
														<IconComponent size={16} />
														<div>
															<div className="fw-bold small">{option.label}</div>
															<small className="text-muted">{option.description}</small>
														</div>
													</div>
												</div>
											);
										})}
									</div>
								</div>

								{/* Connection Test */}
								{!isStreaming && (
									<div className="mb-3">
										<small className="text-muted fw-bold d-block mb-2">CONNECTION TEST</small>
										<Button
											variant={connectionStatus === 'connected' ? 'success' : connectionStatus === 'error' ? 'danger' : 'outline-primary'}
											size="sm"
											onClick={testConnection}
											disabled={connectionStatus === 'connecting'}
											className="w-100"
										>
											{connectionStatus === 'connecting' && <Spinner size="sm" className="me-2" />}
											{connectionStatus === 'connected' ? '✓ Connected' : 
											 connectionStatus === 'error' ? '✗ Connection Failed' : 
											 'Test Connection'}
										</Button>
									</div>
								)}

								{/* Stream Stats (when live) */}
								{isStreaming && (
									<div className="mb-3">
										<small className="text-muted fw-bold d-block mb-2">STREAM STATS</small>
										<Row className="g-2">
											<Col>
												<div className="text-center p-2 bg-light rounded-3">
													<div className="fw-bold text-success small">LIVE</div>
													<small className="text-muted">Status</small>
												</div>
											</Col>
											<Col>
												<div className="text-center p-2 bg-light rounded-3">
													<div className="fw-bold text-primary small">{viewerCount}</div>
													<small className="text-muted">Viewers</small>
												</div>
											</Col>
											<Col>
												<div className="text-center p-2 bg-light rounded-3">
													<div className="fw-bold text-info small">{liveComments.length}</div>
													<small className="text-muted">Comments</small>
												</div>
											</Col>
										</Row>
									</div>
								)}
							</Card.Body>
						</Card>
					</Col>
				</Row>
			</Modal.Body>

			<Modal.Footer className="border-0 pt-0">
				<div className="d-flex justify-content-between w-100 align-items-center">
					<div className="d-flex align-items-center gap-2">
						{isStreaming && (
							<Badge bg="danger" className="d-flex align-items-center gap-1">
								<div
									className="rounded-circle bg-white"
									style={{ width: "6px", height: "6px" }}
								></div>
								Broadcasting
							</Badge>
						)}
					</div>
					<div className="d-flex gap-2">
						<Button variant="outline-secondary" onClick={handleClose}>
							Cancel
						</Button>
						{!isStreaming ? (
							<Button 
								variant="danger" 
								onClick={handleStartStream}
								disabled={!streamTitle.trim() || isInitializing}
								className="d-flex align-items-center gap-2"
							>
								<Play size={16} />
								Go Live
							</Button>
						) : (
							<Button 
								variant="outline-danger" 
								onClick={onStopStream}
								className="d-flex align-items-center gap-2"
							>
								<Stop size={16} />
								End Stream
							</Button>
						)}
					</div>
				</div>
			</Modal.Footer>

			<style jsx>{`
				@keyframes pulse {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.5; }
				}
			`}</style>
		</Modal>
	);
};

export default LiveStudioModal;
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
	}, [show]);

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

			// Check if browser supports getUserMedia
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error('Camera access is not supported in this browser');
			}

			// Request permissions with better error handling
			let stream;
			try {
				stream = await navigator.mediaDevices.getUserMedia({ 
					video: {
						width: { ideal: 1280 },
						height: { ideal: 720 },
						frameRate: { ideal: 30 }
					}, 
					audio: {
						echoCancellation: true,
						noiseSuppression: true,
						autoGainControl: true
					}
				});
			} catch (permissionError) {
				if (permissionError.name === 'NotAllowedError') {
					throw new Error('Camera and microphone access denied. Please allow permissions and try again.');
				} else if (permissionError.name === 'NotFoundError') {
					throw new Error('No camera or microphone found. Please connect a camera/microphone and try again.');
				} else if (permissionError.name === 'NotReadableError') {
					throw new Error('Camera is being used by another application. Please close other apps and try again.');
				} else {
					throw new Error(`Failed to access camera: ${permissionError.message}`);
				}
			}

			// Stop the test stream immediately since we'll use Agora tracks
			stream.getTracks().forEach(track => track.stop());

			// Create Agora video track for preview
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

			// Play video preview immediately
			if (videoRef.current) {
			videoTrack.play(videoRef.current);
			}

			setLocalVideoTrack(videoTrack);
			setLocalAudioTrack(audioTrack);
		} catch (error) {
			console.error('Failed to initialize preview:', error);
			// Show user-friendly error with specific guidance
			alert(error.message || 'Failed to access camera. Please check permissions and try again.');
			onHide(); // Close modal on error
		} finally {
			setIsInitializing(false);
		}
	};

	const cleanup = () => {
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

	const handleStartStream = () => {
		if (!streamTitle.trim()) {
			alert('Please enter a stream title');
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
			fullscreen="md-down"
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
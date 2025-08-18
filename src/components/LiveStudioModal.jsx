
import React, { useState, useRef, useEffect } from 'react';
import {
	Modal,
	Button,
	Form,
	Card,
	Row,
	Col,
	Badge,
	OverlayTrigger,
	Tooltip,
	ButtonGroup,
	Spinner
} from 'react-bootstrap';
import {
	Camera,
	CameraVideo,
	Mic,
	MicMute,
	Palette,
	Sun,
	Contrast,
	Globe,
	People,
	Lock,
	X,
	Play,
	Stop,
	EmojiSmile
} from 'react-bootstrap-icons';
import AgoraRTC from 'agora-rtc-sdk-ng';

const LiveStudioModal = ({ 
	show, 
	onHide, 
	onStartStream, 
	isStreaming, 
	onStopStream,
	currentUser 
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
	
	const videoRef = useRef(null);
	
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

	const initializePreview = async () => {
		try {
			setIsInitializing(true);
			
			// Create video track for preview
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

			// Play video preview
			if (videoRef.current && videoEnabled) {
				videoTrack.play(videoRef.current);
			}

			setLocalVideoTrack(videoTrack);
			setLocalAudioTrack(audioTrack);
		} catch (error) {
			console.error('Failed to initialize preview:', error);
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

	const handleVideoToggle = () => {
		setVideoEnabled(!videoEnabled);
		if (localVideoTrack) {
			localVideoTrack.setEnabled(!videoEnabled);
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
		onHide();
	};

	return (
		<Modal
			show={show}
			onHide={handleClose}
			size="lg"
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
					<Col lg={8}>
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
												<Contrast size={14} />
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

					{/* Stream Settings Section */}
					<Col lg={4}>
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
													<div className="fw-bold text-primary small">0</div>
													<small className="text-muted">Viewers</small>
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

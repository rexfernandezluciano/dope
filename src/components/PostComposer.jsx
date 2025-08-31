/** @format */
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
	Card,
	Form,
	Button,
	Image,
	Alert,
	Spinner,
	Modal,
	InputGroup,
	Row,
	Col,
	Dropdown,
} from "react-bootstrap";
import {
	Camera,
	Globe,
	Lock,
	PersonFill,
	EmojiSmile,
	X,
	Search,
	CameraVideo,
	Type,
	BarChart,
	CheckCircleFill,
} from "react-bootstrap-icons";
import { MentionsInput, Mention } from "react-mentions";
import { postAPI, imageAPI, userAPI } from "../config/ApiConfig";
import LiveStudioModal from "./LiveStudioModal";
import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import heic2any from "heic2any";

const PostComposer = ({ currentUser, onPostCreated }) => {
	const [showComposerModal, setShowComposerModal] = useState(false);
	const [content, setContent] = useState("");
	const [images, setImages] = useState([]);
	const [privacy, setPrivacy] = useState("public");
	const [postType, setPostType] = useState("text");
	const [liveVideoUrl, setLiveVideoUrl] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [uploadingImages, setUploadingImages] = useState(false);
	const [error, setError] = useState("");
	const [showStickerModal, setShowStickerModal] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [showLiveStudioModal, setShowLiveStudioModal] = useState(false);
	const [isStreaming, setIsStreaming] = useState(false);
	const [currentSelected, setCurrentSelected] = useState("text");
	const [pollOptions, setPollOptions] = useState(["", ""]);
	const [pollDuration, setPollDuration] = useState(24); // hours
	const [pollAllowMultiple, setPollAllowMultiple] = useState(false);
	const [placeholder, setPlaceholder] = useState("What's happening?");
	const textareaRef = useRef(null);
	const fileInputRef = useRef(null);
	const postClickRef = useRef(null);

	const gf = new GiphyFetch("BXvRq8D03IHvybiQ6Fjls2pkPJLXjx9x");
	const fetchGifs = (offset) =>
		searchTerm
			? gf.search(searchTerm, { offset, limit: 12 })
			: gf.trending({ offset, limit: 12 });

	const getImageUploadLimit = (subscription) => {
		switch (subscription) {
			case "premium":
				return 10;
			case "pro":
				return Infinity;
			default:
				return 4;
		}
	};

	// Function to search for users for mentions
	const searchMentionUsers = useCallback(async (query, callback) => {
		if (!query) {
			callback([]);
			return;
		}

		try {
			const users = await userAPI.searchUsers(query);
			let foundUsers = users || [];

			// Include current user in results if they match the query and currentUser exists
			if (currentUser && currentUser.username && currentUser.name) {
				const queryLower = query.toLowerCase();
				const matchesUsername = currentUser.username.toLowerCase().includes(queryLower);
				const matchesName = currentUser.name.toLowerCase().includes(queryLower);

				if ((matchesUsername || matchesName) && !foundUsers.some(u => u.uid === currentUser.uid)) {
					foundUsers = [currentUser, ...foundUsers];
				}
			}

			const mentionData = foundUsers.map((user) => ({
				id: user.uid,
				display: user.name || user.displayName || user.username || 'Unknown User',
				name: user.name || user.displayName || 'Unknown User',
				username: user.username,
				photoURL: user.photoURL,
				hasBlueCheck: user.hasBlueCheck || false
			}));

			callback(mentionData);
		} catch (error) {
			console.error("Error searching users:", error);
			callback([]);
		}
	}, [currentUser]);

	const handleContentChange = useCallback(
		(event, newValue, newPlainTextValue, mentions) => {
			setContent(newValue);
		}, []);

	const uploadImage = async (file) => {
		let finalFile = file;

		// Validate file type
		if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".heic")) {
			throw new Error(`${file.name} is not a valid image file`);
		}

		// Validate file size (10MB limit)
		if (file.size > 10 * 1024 * 1024) {
			throw new Error(`${file.name} is too large. Maximum size is 10MB`);
		}

		if (
			file.type === "image/heic" ||
			file.name.toLowerCase().endsWith(".heic")
		) {
			try {
				const blob = await heic2any({ blob: file, toType: "image/jpeg" });
				finalFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
					type: "image/jpeg",
				});
			} catch (err) {
				console.error("Error converting HEIC:", err);
				throw new Error("Failed to convert HEIC image");
			}
		}

		const formData = new FormData();
		formData.append("images", finalFile);

		try {
			console.log("Uploading image:", finalFile.name, "Size:", finalFile.size);
			const response = await imageAPI.uploadImages(formData);

			if (!response) {
				throw new Error("No response received from server");
			}

			if (!response.imageUrls || !Array.isArray(response.imageUrls) || response.imageUrls.length === 0) {
				throw new Error("Invalid response: No image URLs returned");
			}

			const imageUrl = response.imageUrls[0];
			if (!imageUrl || typeof imageUrl !== 'string') {
				throw new Error("Invalid image URL received");
			}

			console.log("Image upload successful:", imageUrl);
			return imageUrl;
		} catch (error) {
			console.error("Error uploading image:", error);
			if (error.message.includes("Network Error") || error.message.includes("fetch")) {
				throw new Error("Network error: Please check your connection and try again");
			}
			throw error;
		}
	};

	const handleImageUpload = useCallback(
		async (e) => {
			const files = Array.from(e.target.files);
			if (files.length === 0) return;

			const imageLimit = getImageUploadLimit(currentUser?.subscription);
			const currentImages = images || [];
			const remainingSlots = imageLimit - currentImages.length;

			if (files.length > remainingSlots) {
				setError(
					`You can only upload ${remainingSlots} more image(s). ${
						imageLimit === 4
							? "Upgrade to Premium or Pro for more uploads."
							: ""
					}`,
				);
				e.target.value = "";
				return;
			}

			setUploadingImages(true);
			setError("");

			const uploadedUrls = [];
			let uploadProgress = 0;

			try {
				for (let i = 0; i < files.length; i++) {
					const file = files[i];
					console.log(`Processing file ${i + 1}/${files.length}:`, file.name);

					try {
						const url = await uploadImage(file);
						uploadedUrls.push(url);
						uploadProgress++;
						console.log(`Successfully uploaded ${uploadProgress}/${files.length} files`);
					} catch (fileError) {
						console.error(`Failed to upload ${file.name}:`, fileError);
						throw new Error(`Failed to upload ${file.name}: ${fileError.message}`);
					}
				}

				if (uploadedUrls.length > 0) {
					setImages((prev) => [...prev, ...uploadedUrls]);
					console.log("All images uploaded successfully:", uploadedUrls);
				}
			} catch (err) {
				console.error("Error processing files:", err);
				setError(err.message || "Failed to upload one or more images");

				// Clean up any successfully uploaded URLs if there was a partial failure
				uploadedUrls.forEach(url => {
					if (url && url.startsWith('blob:')) {
						URL.revokeObjectURL(url);
					}
				});
			} finally {
				setUploadingImages(false);
				e.target.value = "";
			}
		},
		[images, currentUser],
	);

	const handleSelectGif = (gif) => {
		const currentImages = images || [];
		const imageLimit = getImageUploadLimit(currentUser?.subscription);

		if (currentImages.length >= imageLimit) {
			setError(
				`You can only add up to ${imageLimit === Infinity ? "unlimited" : imageLimit} images/GIFs. ${
					imageLimit === 4 ? "Upgrade to Premium or Pro for more uploads." : ""
				}`,
			);
			return;
		}

		const imageUrl = gif.images.fixed_height.url;
		setImages((prev) => [...prev, imageUrl]);
		setShowStickerModal(false);
	};

	const handleStartLiveStream = async (streamData) => {
		try {
			setIsStreaming(true);
			setPostType("live_video");
			setLiveVideoUrl(streamData.url);
			postClickRef?.current.click();
		} catch (error) {
			console.error("Error starting live stream:", error);
			setError("Failed to start live stream");
			setIsStreaming(false);
		}
	};

	const handleStopLiveStream = () => {
		setIsStreaming(false);
	};

	const handlePollOptionChange = (index, value) => {
		const newOptions = [...pollOptions];
		newOptions[index] = value;
		setPollOptions(newOptions);
	};

	const addPollOption = () => {
		if (pollOptions.length < 4) {
			setPollOptions([...pollOptions, ""]);
		}
	};

	const removePollOption = (index) => {
		if (pollOptions.length > 2) {
			setPollOptions(pollOptions.filter((_, i) => i !== index));
		}
	};

	const handleSubmit = useCallback(
		async (e) => {
			e.preventDefault();

			const cleanContent = content.replace(/(\r\n|\n|\r){2,}/g, "$1$2").trim();

			if (!cleanContent.trim() && images.length === 0) {
				setError("Post must contain text or images");
				return;
			}

			try {
				setSubmitting(true);
				setError("");

				let postData = {};

				if (postType === "poll") {
					const validOptions = pollOptions.filter(
						(option) => option.trim() !== "",
					);

					if (validOptions.length < 2) {
						setError("Poll must have at least 2 options");
						return;
					}

					postData = {
						content: cleanContent,
						postType: "poll",
						privacy: privacy.toLowerCase(),
						poll: {
							question: cleanContent,
							options: validOptions.map((option) => ({ text: option })),
							expiresIn: pollDuration * 60,
							allowMultiple: pollAllowMultiple,
						},
					};
				} else if (postType === "live_video" && liveVideoUrl) {
					postData = {
						liveVideoUrl: liveVideoUrl,
						postType: "live_video",
						privacy: privacy.toLowerCase(),
					};
				} else {
					// Default text post with or without images
					postData = {
						content: cleanContent,
						imageUrls: images,
						postType: "text",
						privacy: privacy.toLowerCase(),
					};
				}

				const response = await postAPI.createPost(postData);
				// Reset form
				setContent("");
				setImages([]);
				setLiveVideoUrl("");
				setPrivacy("public");
				setPostType("text");
				setPollOptions(["", ""]);
				setPollDuration(24);
				setShowComposerModal(false);

				onPostCreated?.(response.post);
			} catch (err) {
				setError(err.message || "Failed to create post");
			} finally {
				setSubmitting(false);
			}
		},
		[
			content,
			images,
			privacy,
			postType,
			liveVideoUrl,
			pollOptions,
			pollDuration,
			pollAllowMultiple,
			onPostCreated,
		],
	);

	const removeImage = useCallback((index) => {
		setImages((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const getPrivacyIcon = () => {
		switch (privacy) {
			case "public":
				return <Globe size={16} />;
			case "private":
				return <Lock size={16} />;
			case "followers":
				return <PersonFill size={16} />;
			default:
				return <Globe size={16} />;
		}
	};

	const handleSearchChange = (e) => {
		setSearchTerm(e.target.value);
	};

	const isPostDisabled =
		submitting || uploadingImages || (!content.trim() && images.length === 0);
	const characterCount = content.length;
	const characterLimit = 280;
	const isOverLimit = characterCount > characterLimit;

	const activeClassName = (type) => {
		return `btn-sm ${
			currentSelected === type
				? "btn-primary"
				: "border border-1 text-muted bg-light"
		} fw-bold p-2 rounded-3 d-flex align-items-center justify-content-center`;
	};

	const handlePollMultiple = (e) => {
		const isChecked = e.target.checked;
		setPollAllowMultiple(isChecked);
	};

	// Custom styles for react-mentions
	// Cleanup blob URLs when component unmounts to prevent memory leaks
	useEffect(() => {
		return () => {
			images.forEach(url => {
				if (url && url.startsWith('blob:')) {
					URL.revokeObjectURL(url);
				}
			});
		};
	}, []);

	const mentionsStyle = {
		control: {
			backgroundColor: "transparent",
			fontSize: "20px",
			lineHeight: "24px",
			minHeight: "120px",
			border: "none",
			outline: "none",
			boxShadow: "none",
		},
		"&multiLine": {
			control: {
				fontFamily: "inherit",
				minHeight: "120px",
				border: "none",
				outline: "none",
			},
			highlighter: {
				padding: 0,
				border: "none",
			},
			input: {
				padding: 0,
				border: "none",
				outline: "none",
				fontSize: "20px",
				lineHeight: "24px",
				resize: "none",
				maxHeight: "200px",
				overflowY: "auto",
			},
		},
		suggestions: {
			list: {
				backgroundColor: "white",
				border: "1px solid #dee2e6",
				borderRadius: "8px",
				boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
				fontSize: "14px",
				maxHeight: "200px",
				overflowY: "auto",
			},
			item: {
				padding: "8px 12px",
				borderBottom: "1px solid #f8f9fa",
				"&focused": {
					backgroundColor: "#e3f2fd",
				},
			},
		},
	};

	return (
		<>
			{/* Inline Post Composer */}
			<Card className="border-0 border-bottom rounded-0 shadow-none">
				<Card.Body className="px-4 py-3">
					<div className="d-flex gap-3">
						<Image
							src={currentUser?.photoURL || "https://i.pravatar.cc/150?img=10"}
							alt="avatar"
							roundedCircle
							width="40"
							height="40"
							style={{
								objectFit: "cover",
								minWidth: "40px",
								minHeight: "40px",
							}}
						/>
						<div
							className="flex-grow-1 d-flex align-items-center p-0 fs-6 cursor-pointer"
							onClick={() => setShowComposerModal(true)}
							style={{ cursor: "pointer" }}
						>
							<span className="text-muted fs-6">{placeholder}</span>
						</div>
					</div>
				</Card.Body>
			</Card>

			{/* Full Post Composer Modal */}
			<Modal
				show={showComposerModal}
				fullscreen="md-down"
				backdrop="static"
				onHide={() => setShowComposerModal(false)}
				centered
				className="post-composer-modal"
				scrollable={false}
			>
				<Modal.Header closeButton={false} className="border-0">
						<div className="d-flex align-items-center w-100">
							<Button
								variant="link"
								className="p-0 me-3 text-dark d-flex align-items-center"
								onClick={() => setShowComposerModal(false)}
								style={{ minWidth: 'auto' }}
							>
								<X size={24} />
							</Button>
							<h5 className="mb-0 flex-grow-1 fs-6 fw-bold">Create Post</h5>
							<Button
								ref={postClickRef}
								onClick={handleSubmit}
								disabled={isPostDisabled || isOverLimit}
								className="rounded-pill px-3 py-1 fw-bold"
								size="sm"
								style={{
									backgroundColor:
										isPostDisabled || isOverLimit ? "#ccc" : "#1DA1F2",
									border: "none",
									color: "white",
									minWidth: "60px"
								}}
							>
								{submitting ? <Spinner size="sm" animation="border" /> : "Post"}
							</Button>
						</div>
					</Modal.Header>

					<Modal.Body className="flex-grow-1 bg-white px-3 py-2">
					{error && (
						<Alert variant="danger" className="mb-3"
							dismissible
							onHide={() => setError("")}>
							{error}
						</Alert>
					)}

					<Form onSubmit={handleSubmit}>
						<div className="d-flex gap-3">
							<Image
								src={
									currentUser?.photoURL || "https://i.pravatar.cc/150?img=10"
								}
								alt="avatar"
								roundedCircle
								width="48"
								height="48"
								style={{
									objectFit: "cover",
									minWidth: "48px",
									minHeight: "48px",
								}}
							/>
							<div className="flex-grow-1">
								{/* Privacy Dropdown */}
								<div className="mb-2">
									<Dropdown>
										<Dropdown.Toggle
											variant="link"
											className="border border-1 bg-light rounded-pill px-3 py-1 text-decoration-none text-start d-flex align-items-center gap-2"
											style={{
												fontSize: "14px",
												color: "#1DA1F2",
												width: "auto",
											}}
										>
											{privacy === "public" && (
												<>
													<Globe size={14} />
													<span>Everyone can reply</span>
												</>
											)}
											{privacy === "followers" && (
												<>
													<PersonFill size={14} />
													<span>Followers can reply</span>
												</>
											)}
											{privacy === "private" && (
												<>
													<Lock size={14} />
													<span>Only you can see</span>
												</>
											)}
										</Dropdown.Toggle>

										<Dropdown.Menu
											className="shadow-sm border"
											style={{ minWidth: "200px" }}
										>
											<Dropdown.Item
												onClick={() => setPrivacy("public")}
												className={`d-flex align-items-center gap-2 ${
													privacy === "public"
														? "bg-primary bg-opacity-10 text-white"
														: ""
												}`}
											>
												<Globe size={16} />
												<div>
													<div className="fw-bold">Everyone</div>
													<small className={`fw-bold` + privacy === "public" ? "text-white": "text-muted"}>Everyone can reply</small>
												</div>
											</Dropdown.Item>

											<Dropdown.Item
												onClick={() => setPrivacy("followers")}
												className={`d-flex align-items-center gap-2 ${
													privacy === "followers"
														? "bg-primary bg-opacity-10 text-white"
														: ""
												}`}
											>
												<PersonFill size={16} />
												<div>
													<div className="fw-bold">Followers</div>
													<small className={`fw-bold` + privacy === "followers" ? "text-white": "text-muted"}>
														Only followers can reply
													</small>
												</div>
											</Dropdown.Item>

											<Dropdown.Item
												onClick={() => setPrivacy("private")}
												className={`d-flex align-items-center gap-2 ${
													privacy === "private"
														? "bg-primary bg-opacity-10 text-white"
														: ""
												}`}
											>
												<Lock size={16} />
												<div>
													<div className="fw-bold">Only you</div>
													<small
														className={`fw-bold` + privacy === "private" ? "text-white": "text-muted"}>
														Only you can see this post
													</small>
												</div>
											</Dropdown.Item>
										</Dropdown.Menu>
									</Dropdown>
								</div>

								{/* MentionsInput */}
								<div ref={textareaRef}>
									<MentionsInput
										value={content}
										onChange={handleContentChange}
										placeholder={placeholder}
										style={mentionsStyle}
										allowSpaceInQuery={true}
									>
										<Mention
											trigger="@"
											data={searchMentionUsers}
											displayTransform={(id, display) => `@${display}`}
											markup="@[__display__](__id__)"
											renderSuggestion={(entry, search, highlightedDisplay, index, focused) => (
												<div className="d-flex align-items-center gap-2">
													<Image
														src={entry.photoURL || "https://i.pravatar.cc/150?img=10"}
														alt="avatar"
														roundedCircle
														width="32"
														height="32"
														style={{ objectFit: "cover" }}
													/>
													<div className="flex-grow-1">
														<div className="fw-bold">{entry.name}</div>
														<small className="text-muted">@{entry.username}</small>
													</div>
													{entry.hasBlueCheck && (
														<CheckCircleFill className="text-primary" size={14} />
													)}
												</div>
											)}
											style={{
												backgroundColor: "#e3f2fd",
												color: "#1976d2",
												fontWeight: "bold",
											}}
										/>
									</MentionsInput>
								</div>

								{/* Live Video URL Input */}
								{postType === "live_video" && (
									<Form.Control
										type="url"
										value={liveVideoUrl}
										onChange={(e) => setLiveVideoUrl(e.target.value)}
										placeholder="Live video stream URL (optional)"
										className="border-0 shadow-none mt-2"
										style={{ fontSize: "16px" }}
									/>
								)}

								{/* Poll Options */}
								{postType === "poll" && currentSelected === "poll" && (
									<div className="mt-3 p-3 border rounded-3 animate__animated animate__fadeIn">
										<div className="d-flex align-items-center justify-content-between mb-3">
											<h6 className="mb-0">Poll Options</h6>
											<Form.Select
												size="sm"
												value={pollDuration}
												onChange={(e) =>
													setPollDuration(Number(e.target.value))
												}
												style={{ width: "auto" }}
											>
												<option value={1}>1 hour</option>
												<option value={6}>6 hours</option>
												<option value={12}>12 hours</option>
												<option value={24}>1 day</option>
												<option value={72}>3 days</option>
												<option value={168}>1 week</option>
											</Form.Select>
										</div>
										{pollOptions.map((option, index) => (
											<div
												key={index}
												className="d-flex align-items-center gap-2 mb-2"
											>
												<Form.Control
													type="text"
													value={option}
													onChange={(e) =>
														handlePollOptionChange(index, e.target.value)
													}
													placeholder={`Option ${index + 1}`}
													className="border-1"
													maxLength={25}
												/>
												{pollOptions.length > 2 && (
													<Button
														variant="outline-danger"
														size="sm"
														onClick={() => removePollOption(index)}
													>
														<X size={16} />
													</Button>
												)}
											</div>
										))}

										<Form.Check
											id="poll-allow-multiple"
											type="switch"
											label="Multiple Choices"
											onChange={(e) => handlePollMultiple(e)}
											className="shadow-none"
										/>
										{pollOptions.length < 4 && (
											<Button
												variant="outline-primary"
												size="sm"
												onClick={addPollOption}
												className="mt-2"
											>
												Add Option
											</Button>
										)}
									</div>
								)}

								{/* Image Previews */}
								{images.length > 0 && (
									<div className="mt-3">
										<div
											className="border rounded-3 p-2"
											style={{ backgroundColor: "#f8f9fa" }}
										>
											{images.length === 1 ? (
												// Single image
												<div className="position-relative">
													<Image
														src={images[0]}
														alt="Upload"
														className="rounded-3 w-100"
														style={{
															height: "300px",
															objectFit: "cover",
														}}
													/>
													<Button
														variant="dark"
														size="sm"
														className="position-absolute top-0 end-0 m-2 rounded-circle d-flex align-items-center justify-content-center"
														style={{
															width: "32px",
															height: "32px",
															opacity: 0.8,
														}}
														onClick={() => removeImage(0)}
													>
														<X size={16} />
													</Button>
												</div>
											) : images.length === 2 ? (
												// Two images side by side
												<Row className="g-2">
													{images.map((image, index) => (
														<Col key={index} xs={6}>
															<div className="position-relative">
																<Image
																	src={image}
																	alt={`Upload ${index + 1}`}
																	className="rounded-3 w-100"
																	style={{
																		height: "200px",
																		objectFit: "cover",
																	}}
																/>
																<Button
																	variant="dark"
																	size="sm"
																	className="position-absolute top-0 end-0 m-2 rounded-circle d-flex align-items-center justify-content-center"
																	style={{
																		width: "28px",
																		height: "28px",
																		opacity: 0.8,
																	}}
																	onClick={() => removeImage(index)}
																>
																	<X size={12} />
																</Button>
															</div>
														</Col>
													))}
												</Row>
											) : (
												// Three or four images in grid
												<Row className="g-2">
													<Col xs={6}>
														<div className="position-relative">
															<Image
																src={images[0]}
																alt="Upload 1"
																className="rounded-3 w-100"
																style={{
																	height:
																		images.length === 3 ? "260px" : "150px",
																	objectFit: "cover",
																}}
															/>
															<Button
																variant="dark"
																size="sm"
																className="position-absolute top-0 end-0 m-2 rounded-circle d-flex align-items-center justify-content-center"
																style={{
																	width: "28px",
																	height: "28px",
																	opacity: 0.8,
																}}
																onClick={() => removeImage(0)}
															>
																<X size={12} />
															</Button>
														</div>
													</Col>
													<Col xs={6}>
														<div className="d-flex flex-column gap-2">
															{images.slice(1).map((image, index) => (
																<div
																	key={index + 1}
																	className="position-relative"
																>
																	<Image
																		src={image}
																		alt={`Upload ${index + 2}`}
																		className="rounded-3 w-100"
																		style={{
																			height:
																				images.length === 3
																					? index === 0
																						? "125px"
																						: "125px"
																					: "72px",
																			objectFit: "cover",
																		}}
																	/>
																	<Button
																		variant="dark"
																		size="sm"
																		className="position-absolute top-0 end-0 m-1 rounded-circle d-flex align-items-center justify-content-center"
																		style={{
																			width: "24px",
																			height: "24px",
																			opacity: 0.8,
																		}}
																		onClick={() => removeImage(index + 1)}
																	>
																		<X size={10} />
																	</Button>
																</div>
															))}
														</div>
													</Col>
												</Row>
											)}
										</div>
									</div>
								)}

								{/* Upload Progress */}
								{uploadingImages && (
									<div className="mt-3 p-3 bg-light rounded-3 text-center">
										<Spinner size="sm" animation="border" className="me-2" />
										<span className="text-muted">Uploading images...</span>
									</div>
								)}
							</div>
						</div>
					</Form>
				</Modal.Body>

				<Modal.Footer className="border-0 pt-2 flex-shrink-0 bg-white">
						<div className="d-flex justify-content-between align-items-center w-100">
							<div className="d-flex gap-1 flex-wrap">
								<Button
									variant="link"
									size="sm"
									className={activeClassName("text")}
									onClick={() => {
										setCurrentSelected("text");
										setPostType("text");
										setPlaceholder("What's happening?");
									}}
									disabled={
										uploadingImages ||
										images.length >=
											getImageUploadLimit(currentUser?.subscription)
									}
									title="Text Post"
									style={{ minWidth: '36px', minHeight: '36px' }}
								>
									<Type size={16} />
								</Button>
							<Button
									variant="link"
									size="sm"
									className={activeClassName("image")}
									onClick={() => {
										setCurrentSelected("image");
										setPlaceholder("What's happening?");
										fileInputRef.current.click();
									}}
									disabled={
										uploadingImages ||
										images.length >=
											getImageUploadLimit(currentUser?.subscription)
									}
									title="Add Photos"
									style={{ minWidth: '36px', minHeight: '36px' }}
								>
									<Camera size={16} />
								</Button>
								<input
									ref={fileInputRef}
									type="file"
									onChange={handleImageUpload}
									accept="image/*"
									multiple
									style={{ display: "none" }}
								/>
								<Button
									variant="link"
									size="sm"
									className={activeClassName("gif")}
									onClick={() => {
										setCurrentSelected("gif");
										setShowStickerModal(true);
										setPlaceholder("What's happening?");
									}}
									title="Add GIF"
									style={{ minWidth: '36px', minHeight: '36px' }}
								>
									<EmojiSmile size={16} />
								</Button>
								<Button
									variant="link"
									size="sm"
									className={activeClassName("poll")}
									onClick={() => {
										setCurrentSelected("poll");
										setPostType("poll");
										setPlaceholder("Ask a question...");
									}}
									title="Create Poll"
									style={{ minWidth: '36px', minHeight: '36px' }}
								>
									<BarChart size={16} />
								</Button>
								<Button
									variant="link"
									size="sm"
									className={`${activeClassName("live")} ${isStreaming ? "btn-danger" : ""}`}
									onClick={() => {
										setPlaceholder("What's happening?");
										setShowLiveStudioModal(true);
									}}
									title={isStreaming ? "Manage Live Stream" : "Go Live"}
									style={{ minWidth: '36px', minHeight: '36px' }}
								>
									<CameraVideo size={16} />
								</Button>
						</div>

							<div className="d-flex align-items-center gap-2">
								{/* Character Count */}
								{characterCount > 0 && (
									<div className="d-flex align-items-center gap-1">
										<svg width="18" height="18" viewBox="0 0 20 20">
											<circle
												cx="10"
												cy="10"
												r="8"
												fill="none"
												stroke={
													isOverLimit
														? "#ff6b6b"
														: characterCount > characterLimit * 0.8
															? "#ffb347"
															: "#e1e8ed"
												}
												strokeWidth="2"
											/>
											<circle
												cx="10"
												cy="10"
												r="8"
												fill="none"
												stroke={isOverLimit ? "#ff6b6b" : "#1DA1F2"}
												strokeWidth="2"
												strokeDasharray={`${(characterCount / characterLimit) * 50.26} 50.26`}
												strokeLinecap="round"
												transform="rotate(-90 10 10)"
											/>
										</svg>
										<small
											className={`fw-bold ${isOverLimit ? "text-danger" : "text-muted"}`}
											style={{ fontSize: '0.75rem' }}
										>
											{characterLimit - characterCount}
										</small>
									</div>
								)}

								{/* Privacy Indicator */}
								<div className="d-flex align-items-center text-muted">
									{getPrivacyIcon()}
								</div>
							</div>
						</div>
					</Modal.Footer>
			</Modal>

			{/* Sticker/GIF Modal */}
			<Modal
				show={showStickerModal}
				onHide={() => setShowStickerModal(false)}
				fullscreen="md-down"
				centered
				size="lg"
			>
				<Modal.Header closeButton className="border-0">
					<Modal.Title>Choose a GIF</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<InputGroup className="mb-3">
						<InputGroup.Text className="bg-light border-0">
							<Search />
						</InputGroup.Text>
						<Form.Control
							type="text"
							placeholder="Search for GIFs"
							value={searchTerm}
							onChange={handleSearchChange}
							className="shadow-none border-0 bg-light"
						/>
					</InputGroup>

					<div style={{ maxHeight: "60vh", overflowY: "auto" }}>
						<Grid
							columns={3}
							width={window.innerWidth > 768 ? 500 : window.innerWidth - 40}
							fetchGifs={fetchGifs}
							onGifClick={(gif, e) => {
								e.preventDefault();
								handleSelectGif(gif);
							}}
						/>
					</div>
				</Modal.Body>
			</Modal>

			{/* Live Studio Modal */}
			<LiveStudioModal
				show={showLiveStudioModal}
				onHide={() => setShowLiveStudioModal(false)}
				onStartStream={handleStartLiveStream}
				onStopStream={handleStopLiveStream}
				isStreaming={isStreaming}
				currentUser={currentUser}
			/>
		</>
	);
};

export default PostComposer;
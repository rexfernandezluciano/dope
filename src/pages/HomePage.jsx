/** @format */

import { useState, useRef, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import {
	Container,
	Image,
	Modal,
	Form,
	Button,
	Dropdown,
	InputGroup,
	Card,
	Spinner,
	Alert,
} from "react-bootstrap";
import {
	Globe,
	People,
	Lock,
	Camera,
	EmojiSmile,
	X,
	Search,
	Heart,
	HeartFill,
	ChatDots,
	Share,
	ChevronLeft,
	ChevronRight,
	ThreeDots,
	CheckCircleFill,
} from "react-bootstrap-icons";

import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";

import { postAPI } from "../config/ApiConfig";
import AlertDialog from "../components/dialogs/AlertDialog";

const HomePage = () => {
	const [showComposerModal, setShowComposerModal] = useState(false);
	const [postText, setPostText] = useState("");
	const [privacy, setPrivacy] = useState("Public");
	const [showStickerModal, setShowStickerModal] = useState(false);
	const [photos, setPhotos] = useState(null);
	const MAX_IMAGES = 4;
	const [searchTerm, setSearchTerm] = useState("");
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [hasMore, setHasMore] = useState(false);
	const [nextCursor, setNextCursor] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [isLive, setIsLive] = useState(false);
	const [liveVideoUrl, setLiveVideoUrl] = useState("");
	const [showImageViewer, setShowImageViewer] = useState(false);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [currentImages, setCurrentImages] = useState([]);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [postToDelete, setPostToDelete] = useState(null);
	const textareaRef = useRef(null);
	const fileInputRef = useRef(null);
	const [showPostOptionsModal, setShowPostOptionsModal] = useState(false);
	const [selectedPost, setSelectedPost] = useState(null);
	const [filterBy, setFilterBy] = useState("for-you"); // State for filter selection

	const loaderData = useLoaderData() || {};
	const { user } = loaderData;

	useEffect(() => {
		loadPosts();
	}, []);

	const loadPosts = async (cursor = null) => {
		try {
			setLoading(true);
			const params = { limit: 20 };
			if (cursor) params.cursor = cursor;

			const response = await postAPI.getPosts(params);
			if (cursor) {
				setPosts((prev) => [...prev, ...response.posts]);
			} else {
				setPosts(response.posts);
			}
			setHasMore(response.hasMore);
			setNextCursor(response.nextCursor);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	// Filter posts based on filterBy
	const filteredPosts = posts.filter((post) => {
		const matchesFilter = filterBy === "for-you" || filterBy === "following"; // Add logic for 'following' if implemented
		return matchesFilter;
	});

	const handleInput = (e) => {
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			textarea.style.height = textarea.scrollHeight + "px";
		}
		setPostText(e.target.value);
	};

	const handlePhotoClick = () => {
		fileInputRef.current.click();
	};

	const uploadToCloudinary = async (file) => {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("upload_preset", "dope_network"); // You'll need to set this up in Cloudinary

		try {
			const response = await fetch(
				"https://api.cloudinary.com/v1_1/your_cloud_name/image/upload",
				{
					method: "POST",
					body: formData,
				},
			);
			const data = await response.json();
			return data.secure_url;
		} catch (error) {
			console.error("Error uploading to Cloudinary:", error);
			return null;
		}
	};

	const handleFileChange = async (e) => {
		const files = Array.from(e.target.files);
		if (files.length) {
			const currentPhotos = photos || [];
			const remainingSlots = MAX_IMAGES - currentPhotos.length;
			const filesToUpload = files.slice(0, remainingSlots);

			if (filesToUpload.length < files.length) {
				alert(
					`You can only upload up to ${MAX_IMAGES} images. Only the first ${filesToUpload.length} will be uploaded.`,
				);
			}

			const uploadedUrls = [];
			for (const file of filesToUpload) {
				const url = await uploadToCloudinary(file);
				if (url) {
					uploadedUrls.push(url);
				}
			}
			setPhotos((prev) => [...(prev || []), ...uploadedUrls]);
		}
	};

	const handleRemovePhoto = (index) => {
		setPhotos((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSelectGif = (gif) => {
		const currentPhotos = photos || [];
		if (currentPhotos.length >= MAX_IMAGES) {
			alert(`You can only add up to ${MAX_IMAGES} images/GIFs.`);
			return;
		}

		const imageUrl = gif.images.fixed_height.url;
		setPhotos((prev) => [...(prev || []), imageUrl]);
		setShowStickerModal(false);
	};

	const handleCreatePost = async () => {
		if (!postText.trim() && !photos && !liveVideoUrl) return;

		try {
			setSubmitting(true);
			const postData = {
				content: postText,
				privacy: privacy.toLowerCase(),
				postType: isLive ? "live_video" : "text",
			};

			if (liveVideoUrl && isLive) {
				postData.liveVideoUrl = liveVideoUrl;
			}

			if (photos && photos.length > 0) {
				// If photos are URLs (from Cloudinary), include them in postData
				if (typeof photos[0] === "string") {
					postData.imageUrls = photos;
					await postAPI.createPost(postData);
				} else {
					// If photos are files, use FormData
					const formData = new FormData();
					formData.append("content", postText);
					formData.append("privacy", privacy.toLowerCase());
					formData.append("postType", isLive ? "live" : "text");

					if (liveVideoUrl && isLive) {
						formData.append("liveVideoUrl", liveVideoUrl);
					}

					for (let i = 0; i < photos.length; i++) {
						formData.append("images", photos[i]);
					}

					await postAPI.createPost(formData);
				}
			} else {
				await postAPI.createPost(postData);
			}

			// Reset form
			setPostText("");
			setPhotos(null);
			setIsLive(false);
			setLiveVideoUrl("");
			setShowComposerModal(false);

			// Reload posts
			loadPosts();
		} catch (err) {
			setError(err.message);
		} finally {
			setSubmitting(false);
		}
	};

	const handleDeletePost = (postId) => {
		setPostToDelete(postId);
		setShowDeleteDialog(true);
	};

	const confirmDeletePost = async () => {
		if (!postToDelete) return;

		try {
			await postAPI.deletePost(postToDelete);
			setPosts((prev) => prev.filter((post) => post.id !== postToDelete));
			setShowDeleteDialog(false);
			setPostToDelete(null);
		} catch (err) {
			console.error("Error deleting post:", err);
			setError("Failed to delete post.");
			setShowDeleteDialog(false);
			setPostToDelete(null);
		}
	};

	const handleSharePost = async (postId) => {
		const postUrl = `${window.location.origin}/post/${postId}`;

		if (navigator.share) {
			try {
				await navigator.share({
					title: "Check out this post",
					url: postUrl,
				});
			} catch (err) {
				// Fallback to clipboard if sharing fails
				navigator.clipboard.writeText(postUrl);
			}
		} else {
			// Fallback to clipboard for browsers that don't support Web Share API
			try {
				await navigator.clipboard.writeText(postUrl);
				// You could show a toast notification here
			} catch (err) {
				console.error("Failed to copy to clipboard:", err);
			}
		}
	};

	const handlePostClick = (postId, e) => {
		// Don't navigate if clicking on interactive elements
		if (
			e.target.closest("button") ||
			e.target.closest("a") ||
			e.target.closest(".dropdown")
		) {
			return;
		}
		window.location.href = `/post/${postId}`;
	};

	const handleLikePost = async (postId) => {
		try {
			await postAPI.likePost(postId);
			// Update posts state to reflect like change
			setPosts((prev) =>
				prev.map((post) => {
					if (post.id === postId) {
						const isLiked = post.likes.some(
							(like) => like.user.uid === user.uid,
						);
						return {
							...post,
							likes: isLiked
								? post.likes.filter((like) => like.user.uid !== user.uid)
								: [...post.likes, { user: {uid: user.uid }}],
							stats: {
								...post.stats,
								likes: isLiked ? post.stats.likes - 1 : post.stats.likes + 1,
							},
						};
					}
					return post;
				}),
			);
		} catch (err) {
			console.error("Error liking post:", err);
		}
	};

	const formatTimeAgo = (dateString) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now - date;
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return "now";
		if (diffMins < 60) return `${diffMins}m`;
		if (diffHours < 24) return `${diffHours}h`;
		return `${diffDays}d`;
	};

	const openImageViewer = (images, startIndex = 0) => {
		setCurrentImages(images);
		setCurrentImageIndex(startIndex);
		setShowImageViewer(true);
	};

	const closeImageViewer = () => {
		setShowImageViewer(false);
		setCurrentImages([]);
		setCurrentImageIndex(0);
	};

	const openPostOptionsModal = (post) => {
		setSelectedPost(post);
		setShowPostOptionsModal(true);
	};

	const closePostOptionsModal = () => {
		setShowPostOptionsModal(false);
		setSelectedPost(null);
	};

	const privacyOptions = {
		Public: <Globe size={14} className="me-1" />,
		Followers: <People size={14} className="me-1" />,
		"Only Me": <Lock size={14} className="me-1" />,
	};

	const gf = new GiphyFetch("BXvRq8D03IHvybiQ6Fjls2pkPJLXjx9x");
	const fetchGifs = (offset) =>
		searchTerm
			? gf.search(searchTerm, { offset, limit: 12 })
			: gf.trending({ offset, limit: 12 });

	const handleSearchChange = (e) => {
		setSearchTerm(e.target.value);
	};

	return (
		<>
			<Container className="py-3 px-0 px-0 px-md-3">


				{error && (
					<Alert variant="danger" className="mb-3">
						{error}
					</Alert>
				)}

				{/* Quick Post */}
				<Card
					className="border-0 border-bottom rounded-0 mb-0 shadow-none"
					onClick={() => setShowComposerModal(true)}
				>
					<Card.Body className="px-3 py-3">
						<div className="d-flex gap-3">
							<Image
								src={user?.photoURL || "https://i.pravatar.cc/150?img=10"}
								alt="avatar"
								roundedCircle
								width="45"
								height="45"
								style={{ objectFit: "cover" }}
							/>
							<div className="flex-grow-1">
								<div className="d-flex align-items-center gap-1 mb-2">
									<span className="fw-bold">{user?.name}</span>
									{user?.hasBlueCheck && (
										<CheckCircleFill className="text-primary" size={16} />
									)}
								</div>
								<div className="w-100 text-start text-muted border-1 bg-transparent">
									What's on your mind?
								</div>
							</div>
						</div>
					</Card.Body>
				</Card>

				{loading && posts.length === 0 ? (
					<div className="text-center py-5">
						<Spinner animation="border" variant="primary" />
					</div>
				) : (
					<>
						<div className="d-flex align-items-center justify-content-center px-3 pt-3 border-bottom bg-white sticky-top">
							<div className="d-flex justify-content-between">
								<Button
									variant="link"
									className={`px-4 py-2 fw-bold text-decoration-none border-0 ${
										filterBy === "for-you"
											? "text-primary border-bottom border-primary pb-3 border-2"
											: "text-muted"
									}`}
									onClick={() => setFilterBy("for-you")}
									style={{ borderRadius: 0 }}
								>
									For you
								</Button>
								<Button
									variant="link"
									className={`px-4 py-2 fw-bold text-decoration-none border-0 ${
										filterBy === "following"
											? "text-primary border-bottom border-primary pb-3 border-2"
											: "text-muted"
									}`}
									onClick={() => setFilterBy("following")}
									style={{ borderRadius: 0 }}
								>
									Following
								</Button>
							</div>
						</div>
						{filteredPosts.length === 0 && !loading ? (
							<div className="text-center text-muted py-5">
								<h5>No posts available</h5>
								<p>Be the first to share something!</p>
							</div>
						) : (
							filteredPosts.map((post) => (
								<Card
									key={post.id}
									className="border-0 border-bottom rounded-0 mb-0 post-card"
									style={{ cursor: "pointer" }}
									onClick={(e) => handlePostClick(post.id, e)}
								>
									<Card.Body className="px-3">
										<div className="d-flex gap-2">
											<Image
												src={
													post.author.photoURL ||
													"https://i.pravatar.cc/150?img=10"
												}
												alt="avatar"
												roundedCircle
												width="40"
												height="40"
											/>
											<div className="flex-grow-1">
												<div className="d-flex align-items-center justify-content-between">
													<div className="d-flex align-items-center gap-1">
														<span
															className="fw-bold"
															style={{ cursor: "pointer", color: "inherit" }}
															onClick={(e) => {
																e.stopPropagation();
																window.location.href = `/${post.author.username}`;
															}}
														>
															{post.author.name}
														</span>
														{post.author.hasBlueCheck && (
															<CheckCircleFill className="text-primary" size={16} />
														)}
														<span className="text-muted">·</span>
														<span className="text-muted small">
															{formatTimeAgo(post.createdAt)}
														</span>
													</div>
													<Button
														variant="link"
														className="text-muted p-1 border-0 rounded-circle d-flex align-items-center justify-content-center"
														style={{
															width: "32px",
															height: "32px",
															background: "none",
															border: "none !important",
															boxShadow: "none !important",
														}}
														onClick={(e) => {
															e.stopPropagation();
															openPostOptionsModal(post);
														}}
													>
														<ThreeDots size={16} />
													</Button>
												</div>

												{post.content && <p className="mb-2">{post.content}</p>}

												{post.imageUrls && post.imageUrls.length > 0 && (
													<div className="mb-2">
														{post.imageUrls.length === 1 ? (
															// Single image - full width
															<Image
																src={post.imageUrls[0]}
																className="rounded w-100"
																style={{
																	height: "300px",
																	objectFit: "cover",
																	cursor: "pointer",
																}}
																onClick={(e) => {
																	e.stopPropagation();
																	openImageViewer(post.imageUrls, 0);
																}}
															/>
														) : (
															// Multiple images - box layout
															<div
																className="d-flex gap-2"
																style={{ height: "300px" }}
															>
																{/* Main image on the left */}
																<div style={{ flex: "2" }}>
																	<Image
																		src={post.imageUrls[0]}
																		className="rounded w-100 h-100"
																		style={{
																			objectFit: "cover",
																			cursor: "pointer",
																		}}
																		onClick={(e) => {
																			e.stopPropagation();
																			openImageViewer(post.imageUrls, 0);
																		}}
																	/>
																</div>
																{/* Right side with stacked images */}
																{post.imageUrls.length > 1 && (
																	<div
																		className="d-flex flex-column gap-2"
																		style={{ flex: "1" }}
																	>
																		<div
																			style={{
																				height:
																					post.imageUrls.length > 2
																						? "calc(50% - 4px)"
																						: "100%",
																			}}
																		>
																			<Image
																				src={post.imageUrls[1]}
																				className="rounded w-100 h-100"
																				style={{
																					objectFit: "cover",
																					cursor: "pointer",
																				}}
																				onClick={(e) => {
																					e.stopPropagation();
																					openImageViewer(post.imageUrls, 1);
																				}}
																			/>
																		</div>
																		{post.imageUrls.length > 2 && (
																			<div
																				style={{ height: "calc(50% - 4px)" }}
																				className="position-relative"
																			>
																				<Image
																					src={post.imageUrls[2]}
																					className="rounded w-100 h-100"
																					style={{
																						objectFit: "cover",
																						cursor: "pointer",
																					}}
																					onClick={(e) => {
																						e.stopPropagation();
																						openImageViewer(post.imageUrls, 2);
																					}}
																				/>
																				{/* Show more indicator */}
																				{post.imageUrls.length > 3 && (
																					<div
																						className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded"
																						style={{
																							backgroundColor:
																								"rgba(0, 0, 0, 0.7)",
																							cursor: "pointer",
																							color: "white",
																							fontWeight: "bold",
																							fontSize: "1.2rem",
																						}}
																						onClick={(e) => {
																							e.stopPropagation();
																							openImageViewer(post.imageUrls, 2);
																						}}
																					>
																						+{post.imageUrls.length - 3}
																					</div>
																				)}
																			</div>
																		)}
																	</div>
																)}
															</div>
														)}
													</div>
												)}
												{post.postType === "live" && post.liveVideoUrl && (
													<div className="mb-2">
														{/* Placeholder for live video embed */}
														<p className="text-danger fw-bold">
															Live Video: {post.liveVideoUrl}
														</p>
													</div>
												)}

												<div className="d-flex align-items-center justify-content-between">
													{post.likes.length > 0 &&
														(post.likes[0].user.uid === user.uid ? (
															<div className="small text-muted">
																<span className="fw-bold">You</span>{" "}
																{post.likes.length > 1
																	? "& " + post.likes.length - 1 + " reacted."
																	: " reacted."}
															</div>
														) : (
															""
														))}
												</div>

												<div
													className="d-flex justify-content-around text-muted mt-3 pt-2 border-top"
													style={{ maxWidth: "400px" }}
												>
													<Button
														variant="link"
														size="sm"
														className="text-muted p-2 border-0 d-flex align-items-center gap-1 rounded-circle action-btn"
														style={{
															transition: "all 0.2s",
															minWidth: "40px",
															height: "36px",
														}}
														onClick={(e) => {
															e.stopPropagation();
															window.location.href = `/post/${post.id}`;
														}}
														onMouseEnter={(e) => {
															e.target.closest(
																".action-btn",
															).style.backgroundColor = "rgba(29, 161, 242, 0.1)";
															e.target.closest(".action-btn").style.color =
																"#1da1f2";
														}}
														onMouseLeave={(e) => {
															e.target.closest(
																".action-btn",
															).style.backgroundColor = "transparent";
															e.target.closest(".action-btn").style.color =
																"#6c757d";
														}}
													>
														<ChatDots size={20} style={{ flexShrink: 0 }} />
														{post.stats?.comments > 0 && (
															<span className="small">
																{post.stats?.comments}
															</span>
														)}
													</Button>

													<Button
														variant="link"
														size="sm"
														className="p-2 border-0 d-flex align-items-center gap-1 rounded-circle action-btn"
														style={{
															color: post?.likes.some(
																(like) => like.user.uid === user.uid,
															)
																? "#dc3545"
																: "#6c757d",
															transition: "all 0.2s",
															minWidth: "40px",
															height: "36px",
														}}
														onClick={(e) => {
															e.stopPropagation();
															handleLikePost(post.id);
														}}
														onMouseEnter={(e) => {
															if (
																!post?.likes.some(
																	(like) => like.user.uid === user.uid,
																)
															) {
																e.target.closest(
																	".action-btn",
																).style.backgroundColor =
																	"rgba(220, 53, 69, 0.1)";
																e.target.closest(".action-btn").style.color =
																	"#dc3545";
															}
														}}
														onMouseLeave={(e) => {
															if (
																!post.likes.some(
																	(like) => like.user.uid === user.uid,
																)
															) {
																e.target.closest(
																	".action-btn",
																).style.backgroundColor = "transparent";
																e.target.closest(".action-btn").style.color =
																	"#6c757d";
															}
														}}
													>
														{post.likes.some(
															(like) => like.user.uid === user.uid,
														) ? (
															<HeartFill size={20} style={{ flexShrink: 0 }} />
														) : (
															<Heart size={20} style={{ flexShrink: 0 }} />
														)}
														{post.stats.likes > 0 && (
															<span className="small">{post.stats.likes}</span>
														)}
													</Button>

													<Button
														variant="link"
														size="sm"
														className="text-muted p-2 border-0 rounded-circle action-btn"
														style={{
															transition: "all 0.2s",
															minWidth: "40px",
															height: "36px",
														}}
														onClick={(e) => {
															e.stopPropagation();
															handleSharePost(post.id);
														}}
														onMouseEnter={(e) => {
															e.target.closest(
																".action-btn",
															).style.backgroundColor = "rgba(23, 191, 99, 0.1)";
															e.target.closest(".action-btn").style.color =
																"#17bf63";
														}}
														onMouseLeave={(e) => {
															e.target.closest(
																".action-btn",
															).style.backgroundColor = "transparent";
															e.target.closest(".action-btn").style.color =
																"#6c757d";
														}}
													>
														<Share size={20} style={{ flexShrink: 0 }} />
													</Button>
												</div>
											</div>
										</div>
									</Card.Body>
								</Card>
							))
						)}

						{hasMore && (
							<div className="text-center py-3">
								<Button
									variant="outline-primary"
									onClick={() => loadPosts(nextCursor)}
									disabled={loading}
								>
									{loading ? (
										<Spinner size="sm" animation="border" />
									) : (
										"Load More"
									)}
								</Button>
							</div>
						)}
					</>
				)}
			</Container>

			{/* Composer Modal */}
			{showComposerModal && (
				<Modal
					show={showComposerModal}
					size="md"
					fullscreen="md-down"
					backdrop="static"
					onHide={() => setShowComposerModal(false)}
					centered
				>
					<Modal.Header closeButton>
						<Modal.Title>Create Post</Modal.Title>
					</Modal.Header>

					<Modal.Body className="overflow-x-hidden">
						<div className="d-flex gap-3 mb-3">
							<Image
								src={user?.photoURL ?? "https://i.pravatar.cc/150?img=10"}
								alt="avatar"
								roundedCircle
								width="48"
								height="48"
							/>

							<div className="flex-grow-1">
								<div className="d-flex align-items-center gap-1 mb-2">
									<span className="fw-bold">{user?.name}</span>
									{user?.hasBlueCheck && (
										<CheckCircleFill className="text-primary" size={16} />
									)}
								</div>

								<Dropdown
									onSelect={(value) => setPrivacy(value)}
									className="mb-3"
								>
									<Dropdown.Toggle
										variant="outline-primary"
										size="sm"
										className="border rounded-pill px-3 py-1 d-flex align-items-center shadow-none"
										style={{
											fontSize: "0.875rem",
											fontWeight: "600",
										}}
									>
										{privacyOptions[privacy]} {privacy}
									</Dropdown.Toggle>

									<Dropdown.Menu>
										{Object.keys(privacyOptions).map((opt) => (
											<Dropdown.Item key={opt} eventKey={opt}>
												{privacyOptions[opt]} {opt}
											</Dropdown.Item>
										))}
									</Dropdown.Menu>
								</Dropdown>

								<Form.Control
									as="textarea"
									ref={textareaRef}
									value={postText}
									onInput={handleInput}
									placeholder="What's happening?"
									className="border-0 shadow-none fs-5"
									rows={3}
									style={{
										overflow: "hidden",
										resize: "none",
										minHeight: "120px",
									}}
								/>
							</div>
						</div>

						{photos?.length > 0 && (
							<div
								className="d-flex gap-2 overflow-x-auto mt-2 pb-2"
								style={{ scrollbarWidth: "thin" }}
							>
								{photos.map((file, idx) => {
									const url =
										typeof file === "string" ? file : URL.createObjectURL(file);
									return (
										<div key={idx} className="position-relative flex-shrink-0">
											<Image
												src={url}
												width={120}
												height={120}
												className="rounded-3 border bg-light"
												style={{ objectFit: "cover" }}
											/>
											<Button
												variant="danger"
												size="sm"
												onClick={() => handleRemovePhoto(idx)}
												className="position-absolute top-0 end-0 m-1 p-0 rounded-circle"
												style={{
													width: "20px",
													height: "20px",
													lineHeight: "16px",
												}}
											>
												<X size={12} />
											</Button>
										</div>
									);
								})}
							</div>
						)}

						{isLive && (
							<Form.Group className="mb-3">
								<Form.Label>Live Video URL</Form.Label>
								<Form.Control
									type="url"
									value={liveVideoUrl}
									onChange={(e) => setLiveVideoUrl(e.target.value)}
									placeholder="https://example.com/live-stream"
									className="shadow-none"
								/>
							</Form.Group>
						)}

						<div className="d-flex justify-content-between align-items-center">
							<div className="d-flex gap-2">
								<Button
									variant="link"
									size="sm"
									className={`p-1 ${photos?.length >= MAX_IMAGES ? "text-secondary" : "text-muted"}`}
									onClick={handlePhotoClick}
									disabled={photos?.length >= MAX_IMAGES}
									title={
										photos?.length >= MAX_IMAGES
											? `Maximum ${MAX_IMAGES} images allowed`
											: "Add photo"
									}
								>
									<Camera size={18} />
								</Button>
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleFileChange}
									accept="image/*"
									multiple
									style={{ display: "none" }}
								/>
								<Button
									variant="link"
									size="sm"
									className={`p-1 ${photos?.length >= MAX_IMAGES ? "text-secondary" : "text-muted"}`}
									onClick={() => setShowStickerModal(true)}
									disabled={photos?.length >= MAX_IMAGES}
									title={
										photos?.length >= MAX_IMAGES
											? `Maximum ${MAX_IMAGES} images allowed`
											: "Add GIF"
									}
								>
									<EmojiSmile size={18} />
								</Button>
								<Button
									variant={isLive ? "danger" : "link"}
									size="sm"
									className={isLive ? "text-white p-1" : "text-muted p-1"}
									onClick={() => setIsLive(!isLive)}
								>
									<span className="d-flex align-items-center gap-1">
										<span
											style={{
												width: "8px",
												height: "8px",
												borderRadius: "50%",
												backgroundColor: isLive ? "#fff" : "#dc3545",
												display: "inline-block",
											}}
										></span>
										{isLive ? "LIVE" : "Go Live"}
									</span>
								</Button>
							</div>
							{/* Character limit indicator */}
							<span className="text-muted">{postText.length}/280</span>
						</div>
					</Modal.Body>

					<Modal.Footer>
						<Button
							className="w-100"
							onClick={handleCreatePost}
							disabled={
								submitting || (!postText.trim() && !photos && !liveVideoUrl)
							}
						>
							{submitting ? <Spinner size="sm" animation="border" /> : "Post"}
						</Button>
					</Modal.Footer>
				</Modal>
			)}

			{/* Sticker Modal */}
			{showStickerModal && (
				<Modal
					show={showStickerModal}
					onHide={() => setShowStickerModal(false)}
					fullscreen="md-down"
					centered
				>
					<Modal.Header closeButton>
						<Modal.Title>Stickers</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<InputGroup className="mb-3">
							<InputGroup.Text>
								<Search />
							</InputGroup.Text>
							<Form.Control
								type="text"
								placeholder="Search stickers..."
								value={searchTerm}
								onChange={handleSearchChange}
								className="shadow-none"
							/>
						</InputGroup>

						<div style={{ maxHeight: "70vh", overflowY: "auto" }}>
							<Grid
								columns={3}
								width={window.innerWidth - 40}
								fetchGifs={fetchGifs}
								onGifClick={(gif, e) => {
									e.preventDefault();
									handleSelectGif(gif);
								}}
							/>
						</div>
					</Modal.Body>
				</Modal>
			)}

			{/* Image Viewer Modal */}
			{showImageViewer && (
				<Modal
					show={showImageViewer}
					onHide={closeImageViewer}
					centered
					size="md"
					className="image-viewer-modal"
				>
					<Modal.Body className="p-0 bg-dark text-center">
						<div className="position-relative">
							<Button
								variant="link"
								className="position-absolute top-0 end-0 m-2 text-white"
								style={{ zIndex: 10 }}
								onClick={closeImageViewer}
							>
								<X size={24} />
							</Button>

							{currentImages.length > 1 && (
								<>
									<Button
										variant="link"
										className="position-absolute top-50 start-0 translate-middle-y text-white ms-2"
										style={{ zIndex: 10 }}
										disabled={currentImageIndex === 0}
										onClick={() =>
											setCurrentImageIndex((prev) => Math.max(0, prev - 1))
										}
									>
										<ChevronLeft size={32} />
									</Button>

									<Button
										variant="link"
										className="position-absolute top-50 end-0 translate-middle-y text-white me-2"
										style={{ zIndex: 10 }}
										disabled={currentImageIndex === currentImages.length - 1}
										onClick={() =>
											setCurrentImageIndex((prev) =>
												Math.min(currentImages.length - 1, prev + 1),
											)
										}
									>
										<ChevronRight size={32} />
									</Button>
								</>
							)}

							<Image
								src={currentImages[currentImageIndex]}
								className="w-100"
								style={{
									maxHeight: "80vh",
									objectFit: "contain",
								}}
							/>

							{currentImages.length > 1 && (
								<div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 text-white">
									{currentImageIndex + 1} / {currentImages.length}
								</div>
							)}
						</div>
					</Modal.Body>
				</Modal>
			)}

			{/* Post Options Modal */}
			<Modal
				show={showPostOptionsModal}
				onHide={closePostOptionsModal}
				centered
				size="sm"
			>
				<Modal.Header closeButton>
					<Modal.Title className="fs-4">Post Options</Modal.Title>
				</Modal.Header>
				{selectedPost && (
					<Modal.Body className="p-0">
						<ul className="list-unstyled mb-0">
							<li className="border-bottom">
								<Button
									variant="link"
									className="w-100 px-3 post-card text-start text-decoration-none text-dark p-2"
									onClick={(e) => {
										e.stopPropagation();
										navigator.clipboard.writeText(
											`${window.location.origin}/post/${selectedPost.id}`,
										);
										closePostOptionsModal();
									}}
								>
									Copy Link
								</Button>
							</li>
							<li className="border-bottom">
								<Button
									variant="link"
									className="w-100 px-3 post-card text-start text-decoration-none text-dark p-2"
									onClick={(e) => {
										e.stopPropagation();
										// Handle repost logic
										closePostOptionsModal();
									}}
								>
									Repost
								</Button>
							</li>
							{selectedPost.author.id !== user.uid && (
								<li className="border-0">
									<Button
										variant="link"
										className="w-100 px-3 post-card text-start text-decoration-none text-danger p-2"
										onClick={(e) => {
											e.stopPropagation();
											// Handle report logic
											closePostOptionsModal();
										}}
									>
										Report
									</Button>
								</li>
							)}
							{selectedPost.author.uid === user.uid && (
								<li className="border-0 border-top">
									<Button
										variant="link"
										className="w-100 px-3 post-card text-start text-decoration-none text-danger p-2"
										onClick={(e) => {
											e.stopPropagation();
											handleDeletePost(selectedPost.id);
											closePostOptionsModal();
										}}
									>
										Delete Post
									</Button>
								</li>
							)}
						</ul>
					</Modal.Body>
				)}
			</Modal>

			{/* Delete Post Confirmation Dialog */}
			<AlertDialog
				show={showDeleteDialog}
				onHide={() => {
					setShowDeleteDialog(false);
					setPostToDelete(null);
				}}
				title="Delete Post"
				message="Are you sure you want to delete this post? This action cannot be undone."
				dialogButtonMessage="Delete"
				onDialogButtonClick={confirmDeletePost}
				type="danger"
			/>
		</>
	);
};

export default HomePage;
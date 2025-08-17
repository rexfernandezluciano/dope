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
	PersonFill,
} from "react-bootstrap-icons";

import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import heic2any from "heic2any";

import { postAPI, commentAPI } from "../config/ApiConfig";
import AlertDialog from "../components/dialogs/AlertDialog";
import PostCard from "../components/PostCard";

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
	const [postComments, setPostComments] = useState({}); // Store comments for each post

	const loaderData = useLoaderData() || {};
	const { user } = loaderData;

	useEffect(() => {
		loadPosts();
	}, []);

	// Reload posts when filter changes
	useEffect(() => {
		loadPosts(null, filterBy);
	}, [filterBy]);

	const loadPosts = async (cursor = null, filter = filterBy) => {
		try {
			setLoading(true);
			const params = { limit: 20 };
			if (cursor) params.cursor = cursor;

			// Add filter parameter to API call
			if (filter === "following") {
				params.filter = "following";
				// Exclude current user's own posts in following tab
				params.excludeOwnPosts = true;
			} else {
				params.filter = "for-you"; // Default to random/for-you posts
				// For "For You" tab, sort by engagement (likes + comments)
				params.sortBy = "engagement";
			}

			const response = await postAPI.getPosts(params);

			let processedPosts = response.posts;

			// Client-side filtering as backup in case API doesn't support it
			if (filter === "following") {
				// Filter out current user's own posts
				processedPosts = response.posts.filter(post => post.author.uid !== user.uid);
			} else if (filter === "for-you") {
				// Sort by engagement (likes + comments) if not already sorted by API
				processedPosts = response.posts.sort((a, b) => {
					const engagementA = (a.stats?.likes || 0) + (a.stats?.comments || 0);
					const engagementB = (b.stats?.likes || 0) + (b.stats?.comments || 0);
					return engagementB - engagementA; // Higher engagement first
				});
			}

			if (cursor) {
				setPosts((prev) => [...prev, ...processedPosts]);
				// Fetch comments for new posts only
				fetchRandomCommentsForPosts(processedPosts);
			} else {
				setPosts(processedPosts);
				// Clear previous comments and fetch new ones
				setPostComments({});
				fetchRandomCommentsForPosts(processedPosts);
			}
			setHasMore(response.hasMore);
			setNextCursor(response.nextCursor);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	// Function to fetch random comments for posts
	const fetchRandomCommentsForPosts = async (posts) => {
		const commentsData = {};

		for (const post of posts) {
			// Randomly decide if post should show comments (70% chance)
			const shouldShowComments = Math.random() > 0.3;

			if (shouldShowComments && post.stats?.comments > 0) {
				try {
					// Randomly choose 1, 2, or 3 comments to show
					const commentCount = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
					const maxToShow = Math.min(commentCount, post.stats.comments, 3);

					const response = await commentAPI.getComments(post.id, { limit: maxToShow });
					if (response.comments && response.comments.length > 0) {
						commentsData[post.id] = response.comments;
					}
				} catch (error) {
					console.error(`Error fetching comments for post ${post.id}:`, error);
				}
			}
		}

		setPostComments(prev => ({ ...prev, ...commentsData }));
	};

	// All posts are already filtered by the API, so we don't need to filter here
	const filteredPosts = posts;

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
		formData.append("upload_preset", "dope-network");

		try {
			const response = await fetch(
				"https://api.cloudinary.com/v1_1/zxpic/image/upload",
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

	const deleteFromCloudinary = async (imageUrl) => {
		try {
			// Extract public_id from Cloudinary URL
			const urlParts = imageUrl.split('/');
			const filename = urlParts[urlParts.length - 1];
			const publicId = filename.split('.')[0];

			const formData = new FormData();
			formData.append("public_id", publicId);
			formData.append("api_key", "YOUR_API_KEY"); // You'll need to add your Cloudinary API key
			
			// Generate signature for deletion (you'll need to implement this on your backend)
			const response = await fetch(
				"https://api.cloudinary.com/v1_1/zxpic/image/destroy",
				{
					method: "POST",
					body: formData,
				}
			);
			
			const data = await response.json();
			return data.result === "ok";
		} catch (error) {
			console.error("Error deleting from Cloudinary:", error);
			return false;
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
				try {
					let finalFile = file;

					// Handle HEIC files
					if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
						const blob = await heic2any({ blob: file, toType: "image/jpeg" });
						finalFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" });
					}

					const url = await uploadToCloudinary(finalFile);
					if (url) {
						uploadedUrls.push(url);
					}
				} catch (err) {
					console.error("Error processing file:", err);
					setError("Failed to process one or more images.");
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
			// Find the post to get its images
			const postToDeleteObj = posts.find(post => post.id === postToDelete);
			
			// Delete the post first
			await postAPI.deletePost(postToDelete);
			
			// Delete associated images from Cloudinary
			if (postToDeleteObj && postToDeleteObj.imageUrls && postToDeleteObj.imageUrls.length > 0) {
				for (const imageUrl of postToDeleteObj.imageUrls) {
					if (imageUrl.includes('cloudinary.com')) {
						await deleteFromCloudinary(imageUrl);
					}
				}
			}
			
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

	const canComment = (post) => {
		if (!user) return false;
		
		// Post owner can always comment
		if (post.author.uid === user.uid) return true;
		
		// Check privacy settings
		switch (post.privacy) {
			case 'public':
				return true;
			case 'private':
				return post.author.uid === user.uid;
			case 'followers':
				// Check if current user follows the post author
				// This would need to be determined by the API or stored in post data
				return post.author.isFollowedByCurrentUser || false;
			default:
				return true;
		}
	};

	const getPrivacyIcon = (privacy) => {
		switch (privacy) {
			case 'public':
				return <Globe size={14} className="text-muted" />;
			case 'private':
				return <Lock size={14} className="text-muted" />;
			case 'followers':
				return <PersonFill size={14} className="text-muted" />;
			default:
				return <Globe size={14} className="text-muted" />;
		}
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
						<div className="d-flex align-items-center justify-content-center px-0 pt-2 border-bottom bg-white sticky-top">
							<div className="d-flex w-100">
								<Button
									variant="link"
									className={`flex-fill px-4 py-2 fw-bold text-decoration-none border-0 ${
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
									className={`flex-fill px-4 py-2 fw-bold text-decoration-none border-0 ${
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
								<PostCard
									key={post.id}
									post={post}
									currentUser={user}
									onLike={handleLikePost}
									onShare={handleSharePost}
									onDeletePost={handleDeletePost}
									onPostClick={handlePostClick}
									showComments={postComments[post.id] && postComments[post.id].length > 0}
									comments={postComments[post.id] || []}
								/>
							))
						)}

						{hasMore && (
							<div className="text-center py-3">
								<Button
									variant="outline-primary"
									onClick={() => loadPosts(nextCursor, filterBy)}
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
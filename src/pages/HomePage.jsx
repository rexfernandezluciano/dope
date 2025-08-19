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
	ChevronLeft,
	ChevronRight,
	CheckCircleFill,
	Person,
} from "react-bootstrap-icons";

import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import heic2any from "heic2any";
import AgoraRTC from "agora-rtc-sdk-ng";

import { postAPI } from "../config/ApiConfig";
import AlertDialog from "../components/dialogs/AlertDialog";
import PostCard from "../components/PostCard";
import LiveStudioModal from "../components/LiveStudioModal";
import { deletePost as deletePostUtil, sharePost } from "../utils/common-utils";
import {
	initializeNotifications,
	requestNotificationPermission,
	setupMessageListener,
	notifyFollowersOfNewPost,
} from "../utils/messaging-utils";
import { updatePageMeta, pageMetaData } from "../utils/meta-utils";
import { getUser } from "../utils/auth-utils";
import { useNavigate } from "react-router-dom";

// Utility function to clean text content
const cleanTextContent = (text) => {
	// Replace multiple line breaks with a single one, and trim whitespace
	return text.replace(/(\r\n|\n|\r){2,}/g, "$1$2").trim();
};

const HomePage = () => {
	const navigate = useNavigate();
	const [showComposerModal, setShowComposerModal] = useState(false);
	const [showLiveStudioModal, setShowLiveStudioModal] = useState(false); // State for the new modal
	const [postText, setPostText] = useState("");
	const [privacy, setPrivacy] = useState("Public");
	const [showStickerModal, setShowStickerModal] = useState(false);
	const [photos, setPhotos] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [hasMore, setHasMore] = useState(false);
	const [nextCursor, setNextCursor] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [isLive, setIsLive] = useState(false);
	const [liveVideoUrl, setLiveVideoUrl] = useState("");
	const [streamTitle, setStreamTitle] = useState(""); // State for stream title
	const [isStreaming, setIsStreaming] = useState(false);
	const [mediaStream, setMediaStream] = useState(null);
	const [mediaRecorder, setMediaRecorder] = useState(null);

	const [showImageViewer, setShowImageViewer] = useState(false);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [currentImages, setCurrentImages] = useState([]);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [postToDelete, setPostToDelete] = useState(null);
	const [deletingPost, setDeletingPost] = useState(false); // State for post deletion loading
	const textareaRef = useRef(null);
	const fileInputRef = useRef(null);
	const [filterBy, setFilterBy] = useState("for-you"); // 'for-you', 'following'
	const [user, setUser] = useState(null); // State to hold the current user

	const loaderData = useLoaderData() || {};
	const { user: currentUser } = loaderData; // Renamed to currentUser to avoid conflict

	useEffect(() => {
		// Update page meta data
		updatePageMeta(pageMetaData.home);

		loadPosts();
		checkUser();
		// Initialize notifications and request permission
		initializeNotifications();
		requestNotificationPermission();
		setupMessageListener();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// Effect to load posts when filterBy changes
	useEffect(() => {
		loadPosts();
	}, [filterBy]); // eslint-disable-line react-hooks/exhaustive-deps

	const checkUser = async () => {
		try {
			const currentUser = await getUser();
			setUser(currentUser);
		} catch (error) {
			console.log("No authenticated user");
			setUser(null);
		}
	};

	const loadPosts = async (cursor = null, filter = filterBy) => {
		try {
			setLoading(true);
			setError("");
			const params = { limit: 20 };
			if (cursor) params.cursor = cursor;

			let response;

			if (filter === "following") {
				response = await postAPI.getFollowingFeed(params);
			} else {
				// For "For You" tab, sort by engagement (likes + comments)
				params.sortBy = "engagement";
				response = await postAPI.getPosts(params);
			}

			let processedPosts = response.posts;

			// Randomize posts each time they're loaded
			if (processedPosts && processedPosts.length > 0) {
				processedPosts = processedPosts.sort(() => Math.random() - 0.5);
			}

			// Filter posts based on profile privacy settings
			const privacyFilteredPosts = processedPosts.filter((post) => {
				const authorPrivacy = post.author.privacy?.profile || "public";

				if (authorPrivacy === "public") return true;
				if (authorPrivacy === "private") {
					return post.author.uid === currentUser.uid;
				}
				if (authorPrivacy === "followers") {
					return (
						post.author.uid === currentUser.uid ||
						post.author.isFollowedByCurrentUser
					);
				}
				return false;
			});

			if (cursor) {
				setPosts((prev) => [...prev, ...privacyFilteredPosts]);
			} else {
				setPosts(privacyFilteredPosts);
			}
			setHasMore(response.hasMore);
			setNextCursor(response.nextCursor);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleFilterChange = (value) => {
		setFilterBy(value);
	};

	const handleHashtagClick = (hashtag) => {
		setFilterBy("hashtag");
		// Navigate to search page for hashtag
		navigate(`/search?q=%23${encodeURIComponent(hashtag)}&tab=posts`);
	};

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

	// Function to get the image upload limit based on subscription plan
	const getImageUploadLimit = (subscription) => {
		switch (subscription) {
			case "premium":
				return 10;
			case "pro":
				return Infinity;
			default:
				return 3;
		}
	};

	const uploadImageToCloudinary = async (file) => {
		// Handle HEIC files
		let finalFile = file;
		if (
			file.type === "image/heic" ||
			file.name.toLowerCase().endsWith(".heic")
		) {
			try {
				const heic2any = (await import("heic2any")).default;
				const blob = await heic2any({ blob: file, toType: "image/jpeg" });
				finalFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
					type: "image/jpeg",
				});
			} catch (err) {
				console.error("Error converting HEIC:", err);
				return null;
			}
		}

		const formData = new FormData();
		formData.append("file", finalFile);
		formData.append("upload_preset", "dope-network"); // Replace with your actual upload preset
		formData.append("folder", "posts"); // Replace with your desired folder
		formData.append("api_key", "552259847565352"); // Add the Cloudinary API key

		try {
			const response = await fetch(
				"https://api.cloudinary.com/v1_1/zxpic/image/upload", // Replace zxpic with your Cloudinary cloud name
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
		const imageLimit = getImageUploadLimit(currentUser?.subscription);

		if (files.length > imageLimit) {
			alert(
				`You can only upload ${imageLimit === Infinity ? "unlimited" : imageLimit} images per post. ${imageLimit === 3 ? "Upgrade to Premium or Pro for more uploads." : ""}`,
			);
			e.target.value = "";
			return;
		}

		// This part of the code was previously `setPhotos(files)` but is now `setPhotos((prev) => [...(prev || []), ...uploadedUrls]);`
		// The following logic reflects the original intention of uploading and setting photos.
		const currentPhotos = photos || [];
		const remainingSlots = imageLimit - currentPhotos.length;
		const filesToUpload = files.slice(0, remainingSlots);

		if (filesToUpload.length < files.length) {
			alert(
				`You can only upload up to ${imageLimit} images. Only the first ${filesToUpload.length} will be uploaded.`,
			);
		}

		const uploadedUrls = [];
		for (const file of filesToUpload) {
			try {
				let finalFile = file;

				// Handle HEIC files
				if (
					file.type === "image/heic" ||
					file.name.toLowerCase().endsWith(".heic")
				) {
					const blob = await heic2any({ blob: file, toType: "image/jpeg" });
					finalFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
						type: "image/jpeg",
					});
				}

				const url = await uploadImageToCloudinary(finalFile);
				if (url) {
					uploadedUrls.push(url);
				}
			} catch (err) {
				console.error("Error processing file:", err);
				setError("Failed to process one or more images.");
			}
		}
		setPhotos((prev) => [...(prev || []), ...uploadedUrls]);
	};

	const handleRemovePhoto = (index) => {
		setPhotos((prev) => prev.filter((_, i) => i !== index));
	};

	const handleStartLiveStream = async (streamData) => {
		try {
			// Validate required fields
			if (!streamData.title || !streamData.title.trim()) {
				throw new Error("Stream title is required");
			}

			// Use the tracks from LiveStudioModal
			const { videoTrack, audioTrack } = streamData;

			// Validate tracks are available
			if (!videoTrack || !audioTrack) {
				throw new Error(
					"Video or audio track not available. Please try again.",
				);
			}

			// Wait for tracks to be ready with timeout
			const waitForTrackReady = async (track, trackType, maxWait = 5000) => {
				const startTime = Date.now();
				while (Date.now() - startTime < maxWait) {
					try {
						const mediaStreamTrack = track.getMediaStreamTrack();
						if (mediaStreamTrack && mediaStreamTrack.readyState === "live") {
							return true;
						}
					} catch (e) {
						console.warn(`Error checking ${trackType} track readiness:`, e);
					}
					await new Promise((resolve) => setTimeout(resolve, 100));
				}
				return false;
			};

			// Wait for both tracks to be ready
			const [videoReady, audioReady] = await Promise.all([
				waitForTrackReady(videoTrack, "video"),
				waitForTrackReady(audioTrack, "audio"),
			]);

			if (!videoReady) {
				console.warn("Video track not ready, but proceeding anyway");
			}

			if (!audioReady) {
				console.warn("Audio track not ready, but proceeding anyway");
			}

			// Clean up any existing stream first
			if (mediaStream) {
				try {
					await mediaStream.leave();
				} catch (cleanupError) {
					console.warn("Error cleaning up existing stream:", cleanupError);
				}
			}

			// Generate unique stream key
			const streamKey = `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const streamUrl = `${window.location.origin}/live/${streamKey}`;

			// Create Agora client with more robust configuration
			const client = AgoraRTC.createClient({
				mode: "live",
				codec: "h264", // H264 is more widely supported
			});

			// Enable debug mode to get more information
			AgoraRTC.setLogLevel(1);

			// Enhanced error handlers
			client.on("connection-state-change", (curState, revState, reason) => {
				console.log(
					"Agora connection state changed:",
					curState,
					"from",
					revState,
					"reason:",
					reason,
				);

				if (curState === "FAILED" || curState === "DISCONNECTED") {
					console.warn("Agora connection lost, attempting to reconnect...");
				}
			});

			client.on("exception", (evt) => {
				console.error("Agora exception:", evt);
				if (evt.code === "NETWORK_ERROR") {
					console.warn("Network error detected, connection may be unstable");
				}
			});

			client.on("network-quality", (stats) => {
				if (
					stats.uplinkNetworkQuality < 3 ||
					stats.downlinkNetworkQuality < 3
				) {
					console.warn("Poor network quality detected");
				}
			});

			try {
				await client.setClientRole("host");
			} catch (roleError) {
				console.error("Failed to set client role:", roleError);
				throw new Error("Failed to initialize streaming role");
			}

			// Join channel and publish tracks with timeout
			const agoraConfig = {
				appId:
					process.env.REACT_APP_AGORA_APP_ID ||
					"24ce08654e5c4232bac73ee7946ee769",
				token: null,
				channel: streamKey,
				uid: null,
			};

			console.log("Joining Agora channel with config:", {
				appId: agoraConfig.appId,
				channel: agoraConfig.channel,
				hasVideo: !!videoTrack,
				hasAudio: !!audioTrack,
			});

			// Retry join with exponential backoff
			const joinWithRetry = async (maxRetries = 3) => {
				for (let attempt = 1; attempt <= maxRetries; attempt++) {
					try {
						console.log(
							`Joining Agora channel - attempt ${attempt}/${maxRetries}`,
						);

						const joinPromise = client.join(
							agoraConfig.appId,
							agoraConfig.channel,
							agoraConfig.token,
							agoraConfig.uid,
						);

						// Shorter timeout for each attempt
						const timeoutPromise = new Promise((_, reject) =>
							setTimeout(() => reject(new Error("Join timeout")), 8000),
						);

						await Promise.race([joinPromise, timeoutPromise]);
						console.log("Successfully joined Agora channel");
						return true;
					} catch (attemptError) {
						console.log(`Join attempt ${attempt} failed:`, attemptError);

						if (attempt === maxRetries) {
							throw attemptError;
						}

						// Wait before retry with exponential backoff
						const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
						await new Promise((resolve) => setTimeout(resolve, waitTime));
					}
				}
			};

			try {
				await joinWithRetry();
			} catch (joinError) {
				console.error("Failed to join Agora channel after retries:", joinError);

				// Clean up client on error
				try {
					await client.leave();
				} catch (leaveError) {
					console.warn("Error during cleanup:", leaveError);
				}

				// Clean up tracks on error
				if (videoTrack) {
					videoTrack.stop();
					videoTrack.close();
				}
				if (audioTrack) {
					audioTrack.stop();
					audioTrack.close();
				}

				throw new Error(
					"Unable to connect to streaming servers. This might be due to network restrictions. Please try again later.",
				);
			}

			try {
				await client.publish([videoTrack, audioTrack]);
				console.log("Successfully published tracks to Agora");
			} catch (publishError) {
				console.error("Failed to publish tracks:", publishError);
				throw new Error(
					`Failed to start broadcasting: ${publishError.message}`,
				);
			}

			// Prepare the live stream post payload
			const postPayload = {
				content: streamData.description || streamData.title,
				postType: "live_video",
				liveVideoUrl: streamUrl,
				privacy: streamData.privacy.toLowerCase() || "public",
			};

			// Create the live stream post using the API
			const response = await postAPI.createPost(postPayload);

			if (response.success || response.id) {
				setIsLive(true);
				setStreamTitle(streamData.title);
				setPostText(streamData.description || streamData.title);
				setLiveVideoUrl(streamUrl);
				setIsStreaming(true);
				setMediaStream(client);
				setMediaRecorder({ videoTrack, audioTrack });

				// Set broadcast status in localStorage
				localStorage.setItem("isCurrentlyBroadcasting", "true");
				localStorage.setItem("currentStreamTitle", streamData.title);

				console.log("Live stream started successfully:", response);
			} else {
				throw new Error("Failed to create live stream post");
			}
		} catch (error) {
			console.error("Error starting live stream:", error);

			// Provide specific error messages based on error type
			let errorMessage = error.message;
			if (
				error.message.includes("NETWORK_ERROR") ||
				error.message.includes("timeout")
			) {
				errorMessage =
					"Network connection issues detected. Please check your internet connection and try again.";
			} else if (
				error.message.includes("camera") ||
				error.message.includes("video")
			) {
				errorMessage =
					"Camera access issue. Please ensure your camera is not being used by another application.";
			} else if (
				error.message.includes("microphone") ||
				error.message.includes("audio")
			) {
				errorMessage =
					"Microphone access issue. Please check your microphone permissions.";
			}

			setError(`Failed to start live stream: ${errorMessage}`);

			// Clean up localStorage on error
			localStorage.removeItem("isCurrentlyBroadcasting");
		}
	};

	const handleStopLiveStream = () => {
		stopLiveStream();
		setShowLiveStudioModal(false);
	};

	const stopLiveStream = async () => {
		try {
			// Leave Agora channel first before stopping tracks
			if (mediaStream) {
				try {
					// Unpublish tracks first
					if (mediaRecorder) {
						try {
							await mediaStream.unpublish([
								mediaRecorder.videoTrack,
								mediaRecorder.audioTrack,
							]);
						} catch (unpublishError) {
							console.warn("Error unpublishing tracks:", unpublishError);
						}
					}

					await mediaStream.leave();
					console.log("Left Agora channel successfully");
				} catch (err) {
					console.warn("Error leaving Agora channel:", err);
				}
				setMediaStream(null);
			}

			// Stop Agora tracks properly after leaving channel
			if (mediaRecorder) {
				try {
					if (mediaRecorder.videoTrack) {
						await mediaRecorder.videoTrack.stop();
						await mediaRecorder.videoTrack.close();
					}
				} catch (videoError) {
					console.warn("Error stopping video track:", videoError);
				}

				try {
					if (mediaRecorder.audioTrack) {
						await mediaRecorder.audioTrack.stop();
						await mediaRecorder.audioTrack.close();
					}
				} catch (audioError) {
					console.warn("Error stopping audio track:", audioError);
				}
			}

			setIsStreaming(false);
			setIsLive(false);
			setMediaRecorder(null);
			setLiveVideoUrl("");

			// Clear broadcast status from localStorage
			localStorage.removeItem("isCurrentlyBroadcasting");
			localStorage.removeItem("currentStreamTitle");
		} catch (error) {
			console.error("Error stopping live stream:", error);
		}
	};

	const toggleLiveMode = () => {
		if (!isLive) {
			setShowLiveStudioModal(true);
		} else {
			stopLiveStream();
			setPostText("");
		}
	};

	const handleSelectGif = (gif) => {
		const currentPhotos = photos || [];
		const imageLimit = getImageUploadLimit(currentUser?.subscription);

		if (currentPhotos.length >= imageLimit) {
			alert(
				`You can only add up to ${imageLimit === Infinity ? "unlimited" : imageLimit} images/GIFs. ${imageLimit === 3 ? "Upgrade to Premium or Pro for more uploads." : ""}`,
			);
			return;
		}

		const imageUrl = gif.images.fixed_height.url;
		setPhotos((prev) => [...(prev || []), imageUrl]);
		setShowStickerModal(false);
	};

	const handleCreatePost = async () => {
		// Placeholder states for the new logic
		const newPost = postText;
		const selectedImages = photos || [];
		const selectedGif = null; // Assuming this is handled elsewhere or not used here
		const selectedPrivacy = privacy;

		const cleanedContent = cleanTextContent(newPost);

		if (!cleanedContent.trim() && selectedImages.length === 0 && !selectedGif) {
			setError("Please enter some content or select images/GIF.");
			return;
		}

		try {
			setSubmitting(true);
			// Extract hashtags and mentions for potential future use
			// const hashtags = extractHashtags(cleanedContent);
			// const mentions = extractMentions(cleanedContent);

			let uploadedImageUrls = [];
			if (selectedImages.length > 0) {
				// Upload images if they are files, otherwise assume they are already URLs
				if (typeof selectedImages[0] === "object") {
					const uploadPromises = selectedImages.map((img) =>
						uploadImageToCloudinary(img),
					);
					uploadedImageUrls = await Promise.all(uploadPromises);
				} else {
					uploadedImageUrls = selectedImages; // Already URLs
				}
			}

			const postData = {
				content: cleanedContent,
				imageUrls: uploadedImageUrls,
				privacy: selectedPrivacy.toLowerCase(),
				postType: "text",
			};

			if (liveVideoUrl && isLive && isStreaming) {
				postData.liveVideoUrl = liveVideoUrl;
			}

			const response = await postAPI.createPost(postData);

			// Send notification to followers
			if (response && response.post) {
				try {
					await notifyFollowersOfNewPost(response.post.id, {
						...response.post,
						author: currentUser,
					});
				} catch (notificationError) {
					console.error("Failed to send notifications:", notificationError);
					// Don't fail the post creation if notification fails
				}
			}

			// Reset form
			setPostText("");
			setPhotos(null);
			setIsLive(false);
			setLiveVideoUrl("");
			setShowComposerModal(false);

			// Stop live stream if active
			if (isStreaming) {
				stopLiveStream();
			}

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
			setDeletingPost(true);
			await deletePostUtil(postToDelete); // Use the utility function
			setPosts((prev) => prev.filter((post) => post.id !== postToDelete));
		} catch (err) {
			console.error("Error deleting post:", err);
			setError("Failed to delete post.");
		} finally {
			setDeletingPost(false);
			setShowDeleteDialog(false);
			setPostToDelete(null);
		}
	};

	// Use the reusable sharePost utility
	const handleSharePost = (postId) => {
		sharePost(postId);
	};

	const handleLikePost = async (postId) => {
		try {
			const response = await postAPI.likePost(postId);
			setPosts((prevPosts) =>
				prevPosts.map((post) => {
					if (post.id === postId) {
						// Only update the likes array based on the response
						const updatedPost = { ...post };

						// Update likes based on response
						if (response.liked) {
							// Add current user to likes if not already there
							const userAlreadyLiked = post.likes.some(like => like.user.uid === currentUser.uid);
							if (!userAlreadyLiked) {
								updatedPost.likes = [...post.likes, { user: currentUser }];
							}
						} else {
							// Remove current user from likes
							updatedPost.likes = post.likes.filter(like => like.user.uid !== currentUser.uid);
						}

						// Update stats if available
						if (updatedPost.stats) {
							updatedPost.stats = {
								...updatedPost.stats,
								likes: updatedPost.likes.length
							};
						}

						return updatedPost;
					}
					return post;
				}),
			);
			return response; // Return the response so PostCard can check if liked
		} catch (err) {
			console.error("Error liking post:", err);
			return null;
		}
	};

	const closeImageViewer = () => {
		setShowImageViewer(false);
		setCurrentImageIndex(0);
	};

	const handleImageClick = (postImages, postId, e) => {
		// Find the post object by its ID
		const clickedPost = posts.find((post) => post.id === postId);
		if (clickedPost && clickedPost.images) {
			setCurrentImageIndex(0); // Reset index for new images
			setCurrentImages(clickedPost.images);
			setShowImageViewer(true);
		}
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

	const displayedPosts = posts;

	return (
		<>
			<Container className="py-3 px-0">
				{error && (
					<Alert variant="danger" className="mb-3">
						{error}
					</Alert>
				)}

				{/* Live Broadcasting Status Bar */}
				{isStreaming && (
					<div className="bg-danger text-white px-3 py-2 d-flex align-items-center justify-content-between">
						<div className="d-flex align-items-center gap-2">
							<span
								style={{
									width: "10px",
									height: "10px",
									borderRadius: "50%",
									backgroundColor: "#fff",
									display: "inline-block",
									animation: "pulse 1.5s infinite",
								}}
							></span>
							<strong>🔴 LIVE BROADCASTING</strong>
							<span className="text-white-50">|</span>
							<span>{streamTitle || "Untitled Stream"}</span>
						</div>
						<Button
							variant="outline-light"
							size="sm"
							onClick={() => setShowLiveStudioModal(true)}
						>
							Manage Stream
						</Button>
					</div>
				)}

				{/* Guest Welcome Section */}
				{!user && (
					<Card className="mb-4 shadow-sm border-primary">
						<Card.Body className="text-center py-4">
							<Person size={48} className="text-primary mb-3" />
							<h4 className="text-primary">Welcome to DOPE Network!</h4>
							<p className="text-muted mb-3">
								Join our community to create posts, go live, and connect with
								others.
							</p>
							<div className="d-flex gap-2 justify-content-center">
								<Button
									variant="primary"
									onClick={() => navigate("/auth/signup")}
								>
									Sign Up
								</Button>
								<Button
									variant="outline-primary"
									onClick={() => navigate("/auth/login")}
								>
									Login
								</Button>
							</div>
						</Card.Body>
					</Card>
				)}

				{/* Create Post Section */}
				{user && (
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
									style={{
										objectFit: "cover",
										minWidth: "45px",
										minHeight: "45px",
									}}
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
				)}

				<div
					className="d-flex align-items-center justify-content-between px-0 pt-2 border-bottom bg-white sticky-top-md"
					style={{ zIndex: 10 }}
				>
					<div className="d-flex w-100">
						<Button
							variant="link"
							className={`flex-fill px-4 py-2 fw-bold text-decoration-none border-0 ${
								filterBy === "for-you"
									? "text-primary border-bottom border-primary pb-3 border-2"
									: "text-muted"
							}`}
							onClick={() => handleFilterChange("for-you")}
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
							onClick={() => handleFilterChange("following")}
							style={{ borderRadius: 0 }}
						>
							Following
						</Button>
					</div>
				</div>

				{loading && posts.length === 0 ? (
					<div className="text-center py-5">
						<Spinner animation="border" variant="primary" />
					</div>
				) : (
					<>
						{displayedPosts.length === 0 && !loading ? (
							<div className="text-center text-muted py-5">
								<h5>No posts available</h5>
								<p>Be the first to share something!</p>
							</div>
						) : (
							displayedPosts.map((post) => (
								<PostCard
									key={post.id}
									post={post}
									currentUser={user}
									onLike={handleLikePost}
									onShare={() => handleSharePost(post.id)}
									onDeletePost={handleDeletePost}
									onPostClick={(e) => handleImageClick(post.images, post.id, e)}
									onHashtagClick={handleHashtagClick}
									showComments={true}
									comments={post.comments || []}
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
						{/* Live Broadcasting Status Alert */}
						{isStreaming && (
							<div
								className="alert alert-danger mb-3 d-flex align-items-center gap-2"
								role="alert"
							>
								<span
									style={{
										width: "12px",
										height: "12px",
										borderRadius: "50%",
										backgroundColor: "#dc3545",
										display: "inline-block",
										animation: "pulse 1.5s infinite",
									}}
								></span>
								<strong>🔴 You are currently broadcasting live!</strong>
								<span className="ms-auto">
									<small>Stream: {streamTitle || "Untitled Stream"}</small>
								</span>
							</div>
						)}

						<div className="d-flex gap-3 mb-3">
							<Image
								src={user?.photoURL ?? "https://i.pravatar.cc/150?img=10"}
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

						<div className="d-flex justify-content-between align-items-center">
							<div className="d-flex gap-2">
								<Button
									variant="link"
									size="sm"
									className={`p-1 ${photos?.length >= getImageUploadLimit(user?.subscription) ? "text-secondary" : "text-muted"}`}
									onClick={handlePhotoClick}
									disabled={
										photos?.length >= getImageUploadLimit(user?.subscription)
									}
									title={
										photos?.length >= getImageUploadLimit(user?.subscription)
											? `Maximum ${getImageUploadLimit(user?.subscription)} images allowed`
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
									className={`p-1 ${photos?.length >= getImageUploadLimit(user?.subscription) ? "text-secondary" : "text-muted"}`}
									onClick={() => setShowStickerModal(true)}
									disabled={
										photos?.length >= getImageUploadLimit(user?.subscription)
									}
									title={
										photos?.length >= getImageUploadLimit(user?.subscription)
											? `Maximum ${getImageUploadLimit(user?.subscription)} images allowed`
											: "Add GIF"
									}
								>
									<EmojiSmile size={18} />
								</Button>
								<Button
									variant={isLive ? "danger" : "link"}
									size="sm"
									className={isLive ? "text-white p-1" : "text-muted p-1"}
									onClick={toggleLiveMode}
								>
									<span className="d-flex align-items-center gap-1">
										<span
											style={{
												width: "8px",
												height: "8px",
												borderRadius: "50%",
												backgroundColor: isLive ? "#fff" : "#dc3545",
												display: "inline-block",
												animation: isStreaming ? "pulse 1s infinite" : "none",
											}}
										></span>
										{isStreaming ? "BROADCASTING" : isLive ? "LIVE" : "Go Live"}
									</span>
								</Button>
							</div>
							{/* Character limit indicator */}
							<span className="text-muted">{postText.length}/280</span>
						</div>
					</Modal.Body>

					<Modal.Footer className="d-flex justify-content-between align-items-center">
						{isStreaming && (
							<div className="d-flex align-items-center gap-2 text-danger">
								<span
									style={{
										width: "8px",
										height: "8px",
										borderRadius: "50%",
										backgroundColor: "#dc3545",
										display: "inline-block",
										animation: "pulse 1.5s infinite",
									}}
								></span>
								<small className="fw-bold">Broadcasting Live</small>
							</div>
						)}
						<Button
							className={isStreaming ? "flex-grow-1 ms-3" : "w-100"}
							onClick={handleCreatePost}
							disabled={
								submitting || (!postText.trim() && !photos && !liveVideoUrl)
							}
						>
							{submitting ? (
								<Spinner size="sm" animation="border" />
							) : isStreaming ? (
								"Post to Live Stream"
							) : (
								"Post"
							)}
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

			{/* Delete Post Confirmation Dialog */}
			<AlertDialog
				show={showDeleteDialog}
				title="Delete Post"
				message="Are you sure you want to delete this post? This action cannot be undone."
				onCancel={() => setShowDeleteDialog(false)}
				onConfirm={confirmDeletePost}
				isLoading={deletingPost}
			/>

			{/* Live Studio Modal */}
			<LiveStudioModal
				show={showLiveStudioModal}
				onHide={() => setShowLiveStudioModal(false)}
				onStartStream={handleStartLiveStream}
				onStopStream={handleStopLiveStream}
				isStreaming={isStreaming}
				currentUser={user} // Pass the user state
			/>
		</>
	);
};

export default HomePage;
/** @format */

import React, { useState, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import {
	Container,
	Button,
	Spinner,
	Alert,
	Modal,
	Image,
} from "react-bootstrap";
import {
	ChevronLeft,
	ChevronRight,
	X,
} from "react-bootstrap-icons";

import AgoraRTC from "agora-rtc-sdk-ng";

import { postAPI } from "../config/ApiConfig";
import AlertDialog from "../components/dialogs/AlertDialog";
import PostCard from "../components/PostCard";
import PostComposer from "../components/PostComposer";
import LiveStudioModal from "../components/LiveStudioModal";
import UserRecommendation from "../components/UserRecommendation";

import { deletePost as deletePostUtil, sharePost } from "../utils/common-utils";
import {
	initializeNotifications,
	requestNotificationPermission,
	setupMessageListener,
} from "../utils/messaging-utils";
import { updatePageMeta, pageMetaData } from "../utils/meta-utils";
import { getUser } from "../utils/app-utils";
import { extractHashtags, extractMentions } from "../utils/dope-api-utils";
import { useNavigate } from "react-router-dom";

// Removed unused cleanTextContent function

const HomePage = () => {
	const navigate = useNavigate();
	const [showLiveStudioModal, setShowLiveStudioModal] = useState(false);
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [hasMore, setHasMore] = useState(false);
	const [nextCursor, setNextCursor] = useState(null);
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
			const additionalParams = { random: "true" };
			if (cursor) additionalParams.cursor = cursor;

			let response;

			if (filter === "following") {
				const params = { limit: 20, ...additionalParams };
				response = await postAPI.getFollowingFeed(params);
			} else {
				// For "For You" tab, sort by engagement (likes + comments) with randomization
				additionalParams.sortBy = "engagement";
				response = await postAPI.getPosts(1, 20, additionalParams);
			}

			let processedPosts = response.posts;

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

	// Removed unused utility functions (now handled by PostComposer)





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

			// Set streaming state first
			setStreamTitle(streamData.title);
			setIsStreaming(true);
			setMediaStream(client);
			setMediaRecorder({ videoTrack, audioTrack });

			// Set broadcast status in localStorage
			localStorage.setItem("isCurrentlyBroadcasting", "true");
			localStorage.setItem("currentStreamTitle", streamData.title);

			// Now create the live stream post with the proper URL
			const postPayload = {
				content: streamData.description || streamData.title,
				postType: "live_video",
				liveVideoUrl: streamUrl,
				privacy: streamData.privacy.toLowerCase() || "public",
				hashtags: extractHashtags(streamData.description || streamData.title),
				mentions: extractMentions(streamData.description || streamData.title)
			};

			try {
				const response = await postAPI.createPost(postPayload);
				console.log("Live stream post created successfully:", response);

				// Add the new post to the feed if we have an onPostCreated callback
				if (response.post) {
					const postWithDefaults = {
						...response.post,
						comments: response.post.comments || [],
						stats: response.post.stats || { comments: 0, likes: 0, shares: 0 },
						likes: response.post.likes || [],
						isLiveStreaming: true
					};
					setPosts(prevPosts => [postWithDefaults, ...prevPosts]);
				}
			} catch (postError) {
				console.warn("Failed to create live stream post, but stream is active:", postError);
				// Don't fail the entire stream if post creation fails
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
		// Don't automatically close the modal - let user close it manually
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
			setMediaRecorder(null);

			// Clear broadcast status from localStorage
			localStorage.removeItem("isCurrentlyBroadcasting");
			localStorage.removeItem("currentStreamTitle");
		} catch (error) {
			console.error("Error stopping live stream:", error);
		}
	};

	// Removed unused toggleLiveMode function



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
		if (!currentUser) {
			console.error("User not logged in");
			return null;
		}

		try {
			const response = await postAPI.likePost(postId);
			setPosts((prevPosts) =>
				prevPosts.map((post) => {
					if (post.id === postId) {
						const updatedPost = { ...post };
						const currentUserLiked = post.likes.some(like => like.user?.uid === currentUser.uid);

						// Update likes based on response
						if (response.liked && !currentUserLiked) {
							// Add current user to likes
							updatedPost.likes = [...post.likes, { user: { uid: currentUser.uid, name: currentUser.displayName } }];
						} else if (!response.liked && currentUserLiked) {
							// Remove current user from likes
							updatedPost.likes = post.likes.filter(like => like.user?.uid !== currentUser.uid);
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
			return response;
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

				{/* Post Composer */}
				{user && (
					<PostComposer
						currentUser={user}
						onPostCreated={(newPost) => {
							// Ensure the new post has all required properties
							const postWithDefaults = {
								...newPost,
								comments: newPost.comments || [],
								stats: newPost.stats || { comments: 0, likes: 0, shares: 0 },
								likes: newPost.likes || []
							};
							setPosts(prevPosts => [postWithDefaults, ...prevPosts]);
						}}
						placeholder="What's happening?"
					/>
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
							displayedPosts.map((post, index) => (
								<React.Fragment key={`post-${post.id}-${index}`}>
									{/* Show user recommendations at the top for logged-in users */}
									{index === 0 && user && (
										<UserRecommendation 
											key="user-recommendations" 
											currentUser={user} 
											onClose={() => {
												// Could hide recommendations if user dismisses
											}}
										/>
									)}

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
								</React.Fragment>
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
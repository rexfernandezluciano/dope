/** @format */

import { useState, useEffect, useCallback } from "react";
import { useParams, useLoaderData, useNavigate } from "react-router-dom";
import {
	Container,
	Card,
	Image,
	Button,
	Form,
	Alert,
	Spinner,
	Modal,
} from "react-bootstrap";
import {
	ArrowLeft,
	Heart,
	HeartFill,
	ChatDots,
	Share,
	CheckCircleFill,
	Globe,
	Lock,
	PersonFill,
	X,
	ThreeDots,
	ChevronLeft,
	ChevronRight,
} from "react-bootstrap-icons";
import { postAPI, commentAPI } from "../config/ApiConfig";
import AlertDialog from "../components/dialogs/AlertDialog";
import {
	formatTimeAgo,
	deletePost as deletePostUtil,
	sharePost,
} from "../utils/common-utils";
import { parseTextContent } from "../utils/text-utils";
import { updatePageMeta, pageMetaData } from "../utils/meta-utils";
import {
	handleLikeNotification,
	handleCommentNotification,
} from "../utils/notification-helpers";
import { replyAPI, likeAPI } from "../config/ApiConfig";

const PostDetailPage = () => {
	const { postId } = useParams();
	const loaderData = useLoaderData() || {};
	const { user: currentUser } = loaderData; // Renamed to avoid conflict with 'user' in post.author
	const navigate = useNavigate();
	const [post, setPost] = useState(null);
	const [comments, setComments] = useState([]);
	const [newComment, setNewComment] = useState("");
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [showImageViewer, setShowImageViewer] = useState(false);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [currentImages, setCurrentImages] = useState([]);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [postToDelete, setPostToDelete] = useState(null);
	const [showPostOptionsModal, setShowPostOptionsModal] = useState(false);
	const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false);
	const [commentToDelete, setCommentToDelete] = useState(null);
	const [showCommentOptionsModal, setShowCommentOptionsModal] = useState(false);
	const [selectedComment, setSelectedComment] = useState(null);
	const [deletingPost, setDeletingPost] = useState(false);
	const [deletingComment, setDeletingComment] = useState(false);
	const [showReplyForms, setShowReplyForms] = useState({});
	const [replyTexts, setReplyTexts] = useState({});
	const [submittingReply, setSubmittingReply] = useState({});
	const [replies, setReplies] = useState({});
	// State for comment editing
	const [editingCommentId, setEditingCommentId] = useState(null);
	const [editingCommentText, setEditingCommentText] = useState("");

	const loadPost = useCallback(async () => {
		try {
			setLoading(true);
			setError(""); // Clear previous errors

			// Load post first
			const postResponse = await postAPI.getPost(postId);
			if (postResponse && postResponse.post) {
				setPost(postResponse.post);
			} else {
				throw new Error("Post not found");
			}

			// Load comments separately to avoid 404 breaking the entire page
			try {
				const commentsResponse = await commentAPI.getComments(postId);
				if (commentsResponse && Array.isArray(commentsResponse.comments)) {
					setComments(commentsResponse.comments);

					// Load replies for each comment
					const repliesData = {};
					for (const comment of commentsResponse.comments) {
						try {
							const repliesResponse = await replyAPI.getCommentReplies(comment.id);
							repliesData[comment.id] = repliesResponse.replies || [];
						} catch (replyError) {
							console.error(`Failed to load replies for comment ${comment.id}:`, replyError);
							repliesData[comment.id] = [];
						}
					}
					setReplies(repliesData);
				} else if (commentsResponse && Array.isArray(commentsResponse)) {
					setComments(commentsResponse);
				} else {
					setComments([]);
				}
			} catch (commentError) {
				console.error("Failed to load comments:", commentError);
				setComments([]); // Set empty comments on error
			}

			// Track view after successfully loading the post
			try {
				if (postAPI.trackView) {
					await postAPI.trackView(postId);
				}
			} catch (viewError) {
				console.error("Failed to track view:", viewError);
				// Don't throw here as view tracking shouldn't break the page
			}
		} catch (err) {
			console.error("Failed to load post:", err);
			setError(err.message || "Failed to load post");
		} finally {
			setLoading(false);
		}
	}, [postId]);

	useEffect(() => {
		if (postId) {
			loadPost();
		}
	}, [postId, loadPost]);

	// Update page meta data when post loads
	useEffect(() => {
		if (post) {
			updatePageMeta({
				title: `Post by ${post.author.name} - DOPE Network`,
				description: post.content ? `${post.content.substring(0, 160)}...` : "View post on DOPE Network",
				keywords: `post, content, ${post.author.name}, DOPE Network, social media`
			});
		}
	}, [post]);

	const handleLikePost = async () => {
		try {
			const response = await postAPI.likePost(postId);

			// Update post state locally based on the liked response
			setPost((prevPost) => {
				if (!prevPost) return prevPost;

				const isCurrentlyLiked = prevPost.likes.some(
					(like) => like.user.uid === currentUser.uid,
				);

				if (response.liked && !isCurrentlyLiked) {
					// Add like
					return {
						...prevPost,
						likes: [...prevPost.likes, { user: { uid: currentUser.uid } }],
						stats: {
							...prevPost.stats,
							likes: prevPost.stats.likes + 1,
						},
					};
				} else if (!response.liked && isCurrentlyLiked) {
					// Remove like
					return {
						...prevPost,
						likes: prevPost.likes.filter(
							(like) => like.user.uid !== currentUser.uid,
						),
						stats: {
							...prev.stats,
							likes: prevPost.stats.likes - 1,
						},
					};
				}

				return prevPost;
			});

			// Send like notification to post owner only when user actually likes (not unlikes)
			const wasLiked = post.likes.some(
				(like) => like.user.uid === currentUser.uid,
			);
			if (response.liked && !wasLiked) {
				try {
					await handleLikeNotification(postId, post, currentUser);
				} catch (notificationError) {
					console.error("Failed to send like notification:", notificationError);
				}
			}
		} catch (error) {
			console.error("Failed to like post:", error);
		}
	};

	// Replaced handleSharePost with the reusable sharePost utility
	const handleSharePost = async (postId) => {
		const postUrl = `${window.location.origin}/post/${postId}`;
		await sharePost(postUrl);
	};

	const handleHashtagClick = (hashtag) => {
		navigate(`/search?q=%23${encodeURIComponent(hashtag)}&tab=comments`);
	};

	const handleMentionClick = (username) => {
		navigate(`/${username}`);
	};

	const handleLinkClick = (url) => {
		window.open(url, "_blank", "noopener,noreferrer");
	};

	const confirmDeleteComment = async () => {
		if (!commentToDelete) return;

		try {
			setDeletingComment(true);
			await commentAPI.deleteComment(commentToDelete);

			// Remove the comment from local state
			setComments(prevComments =>
				prevComments.filter(comment => comment.id !== commentToDelete)
			);

			// Clean up replies for the deleted comment
			setReplies(prevReplies => {
				const newReplies = { ...prevReplies };
				delete newReplies[commentToDelete];
				return newReplies;
			});

		} catch (err) {
			console.error("Error deleting comment:", err);
			setError("Failed to delete comment");
		} finally {
			setDeletingComment(false);
			setShowDeleteCommentDialog(false);
			setCommentToDelete(null);
		}
	};

	const handleCopyComment = () => {
		if (selectedComment) {
			navigator.clipboard.writeText(selectedComment.content);
			setShowCommentOptionsModal(false);
		}
	};

	const handleReportComment = () => {
		// Implement report functionality here
		console.log("Report comment:", selectedComment?.id);
		setShowCommentOptionsModal(false);
	};

	const handleDeleteCommentFromModal = () => {
		if (selectedComment) {
			setCommentToDelete(selectedComment.id);
			setShowDeleteCommentDialog(true);
			setShowCommentOptionsModal(false);
		}
	};

	const handleDeletePost = (postId) => {
		setPostToDelete(postId);
		setShowDeleteDialog(true);
	};

	// Replaced deleteFromCloudinary with the reusable deletePostUtil
	const confirmDeletePost = async () => {
		if (!postToDelete) return;

		try {
			setDeletingPost(true);
			// Delete associated images from Cloudinary first
			if (post && post.imageUrls && post.imageUrls.length > 0) {
				for (const imageUrl of post.imageUrls) {
					if (imageUrl.includes("cloudinary.com")) {
						await deletePostUtil(imageUrl);
					}
				}
			}

			// Then delete the post
			await postAPI.deletePost(postToDelete);
			navigate(-1); // Go back since post is deleted
		} catch (err) {
			console.error("Error deleting post:", err.message || err);
			// Optionally show user-friendly error message
		} finally {
			setDeletingPost(false);
			setShowDeleteDialog(false);
			setPostToDelete(null);
		}
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

	const canComment = (post) => {
		if (!currentUser) return false;

		// Post owner can always comment
		if (post.author.uid === currentUser.uid) return true;

		// Check privacy settings
		switch (post.privacy) {
			case "public":
				return true;
			case "private":
				return post.author.uid === currentUser.uid;
			case "followers":
				// Check if current user follows the post author
				return post.author.isFollowedByCurrentUser || false;
			default:
				return true;
		}
	};

	const getPrivacyIcon = (privacy) => {
		switch (privacy) {
			case "public":
				return <Globe size={14} className="text-muted" />;
			case "private":
				return <Lock size={14} className="text-muted" />;
			case "followers":
				return <PersonFill size={14} className="text-muted" />;
			default:
				return <Globe size={14} className="text-muted" />;
		}
	};

	const handleSubmitComment = async (e) => {
		e.preventDefault();
		if (!newComment.trim()) return;

		try {
			setSubmitting(true);
			const response = await commentAPI.createComment(postId, {
				content: newComment.trim(),
			});

			// Ensure the comment has a proper author object
			const newCommentObj = {
				...response.comment,
				author: response.comment?.author || {
					uid: currentUser.uid,
					name: currentUser.name,
					username: currentUser.username,
					photoURL: currentUser.photoURL,
					hasBlueCheck: currentUser.hasBlueCheck || false,
				},
				stats: {
					likes: 0,
					replies: 0
				},
				likes: [],
				replies: []
			};

			setComments((prevComments) => [newCommentObj, ...prevComments]);
			setReplies(prevReplies => ({
				...prevReplies,
				[newCommentObj.id]: []
			}));

			// Send comment notification to post owner
			try {
				await handleCommentNotification(postId, post, currentUser, newComment);
			} catch (notificationError) {
				console.error(
					"Failed to send comment notification:",
					notificationError,
				);
			}

			setNewComment("");
		} catch (err) {
			setError(err.message);
		} finally {
			setSubmitting(false);
		}
	};

	const handleLikeComment = async (commentId) => {
		try {
			const response = await likeAPI.likeComment(commentId);

			setComments(prevComments =>
				prevComments.map(comment => {
					if (comment.id === commentId) {
						const isCurrentlyLiked = comment.likes?.some(
							like => like.user.uid === currentUser.uid
						);

						if (response.liked && !isCurrentlyLiked) {
							return {
								...comment,
								likes: [...(comment.likes || []), { user: { uid: currentUser.uid } }],
								stats: {
									...comment.stats,
									likes: (comment.stats?.likes || 0) + 1
								}
							};
						} else if (!response.liked && isCurrentlyLiked) {
							return {
								...comment,
								likes: (comment.likes || []).filter(
									like => like.user.uid !== currentUser.uid
								),
								stats: {
									...comment.stats,
									likes: Math.max(0, (comment.stats?.likes || 0) - 1)
								}
							};
						}
					}
					return comment;
				})
			);
		} catch (error) {
			console.error("Failed to like comment:", error);
		}
	};

	const toggleReplyForm = (commentId) => {
		setShowReplyForms(prev => ({
			...prev,
			[commentId]: !prev[commentId]
		}));
	};

	const handleReplyTextChange = (commentId, text) => {
		setReplyTexts(prev => ({
			...prev,
			[commentId]: text
		}));
	};

	const handleSubmitReply = async (commentId) => {
		const replyText = replyTexts[commentId]?.trim();
		if (!replyText) return;

		try {
			setSubmittingReply(prev => ({ ...prev, [commentId]: true }));

			// Use the reply API, not comment API
			const response = await replyAPI.createReply(commentId, {
				content: replyText
			});

			const newReply = {
				id: response.reply?.id || Date.now().toString(),
				content: replyText,
				createdAt: response.reply?.createdAt || new Date().toISOString(),
				...response.reply,
				author: response.reply?.author || {
					uid: currentUser.uid,
					name: currentUser.name,
					username: currentUser.username,
					photoURL: currentUser.photoURL,
					hasBlueCheck: currentUser.hasBlueCheck || false,
				},
				stats: {
					likes: 0
				},
				likes: []
			};

			// Add to replies, not comments
			setReplies(prev => ({
				...prev,
				[commentId]: [newReply, ...(prev[commentId] || [])]
			}));

			// Update comment reply count
			setComments(prevComments =>
				prevComments.map(comment =>
					comment.id === commentId
						? {
								...comment,
								stats: {
									...comment.stats,
									replies: (comment.stats?.replies || 0) + 1
								}
							}
						: comment
				)
			);

			// Clear form
			setReplyTexts(prev => ({ ...prev, [commentId]: "" }));
			setShowReplyForms(prev => ({ ...prev, [commentId]: false }));

		} catch (error) {
			console.error("Failed to submit reply:", error);
			setError("Failed to submit reply");
		} finally {
			setSubmittingReply(prev => ({ ...prev, [commentId]: false }));
		}
	};

	const handleLikeReply = async (replyId, commentId) => {
		try {
			const response = await likeAPI.likeReply(replyId);

			setReplies(prev => ({
				...prev,
				[commentId]: (prev[commentId] || []).map(reply => {
					if (reply.id === replyId) {
						const isCurrentlyLiked = reply.likes?.some(
							like => like.user.uid === currentUser.uid
						);

						if (response.liked && !isCurrentlyLiked) {
							return {
								...reply,
								likes: [...(reply.likes || []), { user: { uid: currentUser.uid } }],
								stats: {
									...reply.stats,
									likes: (reply.stats?.likes || 0) + 1
								}
							};
						} else if (!response.liked && isCurrentlyLiked) {
							return {
								...reply,
								likes: (reply.likes || []).filter(
									like => like.user.uid !== currentUser.uid
								),
								stats: {
									...reply.stats,
									likes: Math.max(0, (reply.stats?.likes || 0) - 1)
								}
							};
						}
					}
					return reply;
				})
			}));
		} catch (error) {
			console.error("Failed to like reply:", error);
		}
	};

	// formatTimeAgo is now imported from common-utils

	if (loading) {
		return (
			<Container className="text-center py-5">
				<Spinner animation="border" variant="primary" />
			</Container>
		);
	}

	if (error || !post) {
		return (
			<Container className="py-3">
				<Alert variant="danger">{error || "Post not found"}</Alert>
			</Container>
		);
	}

	return (
		<Container className="py-0 px-0">
			{/* Header */}
			<div
				className="d-flex align-items-center gap-3 p-3 border-bottom bg-white sticky-top d-none d-md-block"
				style={{
					top: "112px" /* Below navbar (56px) + tabs (56px) */,
					zIndex: 1018 /* Below tabs but above content */,
				}}
			>
				<Button
					variant="link"
					size="sm"
					className="text-dark p-0"
					onClick={() => navigate(-1)}
				>
					<ArrowLeft size={20} />
				</Button>
				<h5 className="mb-0">Post</h5>
			</div>
			{/* Mobile Header */}
			<div className="d-flex align-items-center gap-3 p-3 border-bottom bg-white sticky-top d-md-none">
				<Button
					variant="link"
					size="sm"
					className="text-dark p-0"
					onClick={() => navigate(-1)}
				>
					<ArrowLeft size={20} />
				</Button>
				<h5 className="mb-0">Post</h5>
			</div>

			{/* Post Card */}
			<Card className="border-0 border-bottom rounded-0">
				<Card.Body className="px-3 py-3">
					<div className="d-flex gap-2">
						<Image
							src={post.author.photoURL || "https://i.pravatar.cc/150?img=10"}
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
						<div className="flex-grow-1">
							<div className="d-flex align-items-center justify-content-between">
								<div className="d-flex align-items-center gap-1">
									<span
										className="fw-bold"
										style={{ cursor: "pointer", color: "inherit" }}
										onClick={() => navigate(`/${post.author.username}`)}
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
									<span className="text-muted">·</span>
									{getPrivacyIcon(post.privacy)}
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
									onClick={() => setShowPostOptionsModal(true)}
								>
									<ThreeDots size={16} />
								</Button>
							</div>

							{post.content && (
								<div className="mb-2 mt-2 fs-5">
									{parseTextContent(post.content, {
										onHashtagClick: handleHashtagClick,
										onMentionClick: handleMentionClick,
										onLinkClick: handleLinkClick,
									})}
								</div>
							)}

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
											onClick={() => openImageViewer(post.imageUrls, 0)}
										/>
									) : (
										// Multiple images - box layout
										<div className="d-flex gap-2" style={{ height: "300px" }}>
											{/* Main image on the left */}
											<div style={{ flex: "2" }}>
												<Image
													src={post.imageUrls[0]}
													className="rounded w-100 h-100"
													style={{
														objectFit: "cover",
														cursor: "pointer",
													}}
													onClick={() => openImageViewer(post.imageUrls, 0)}
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
															onClick={() => openImageViewer(post.imageUrls, 1)}
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
																onClick={() =>
																	openImageViewer(post.imageUrls, 2)
																}
															/>
															{/* Show more indicator */}
															{post.imageUrls.length > 3 && (
																<div
																	className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded"
																	style={{
																		backgroundColor: "rgba(0, 0, 0, 0.7)",
																		cursor: "pointer",
																		color: "white",
																		fontWeight: "bold",
																		fontSize: "1.2rem",
																	}}
																	onClick={() =>
																		openImageViewer(post.imageUrls, 2)
																	}
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

							<div className="d-flex align-items-center justify-content-between">
								<div className="d-flex flex-wrap gap-3 small text-muted">
									{post.likes.length > 0 &&
										(() => {
											const currentUserLiked = post.likes.some(
												(like) => like.user.uid === currentUser.uid,
											);
											const otherLikesCount = currentUserLiked
												? post.likes.length - 1
												: post.likes.length;

											if (currentUserLiked && otherLikesCount > 0) {
												return (
													<span>
														<span className="fw-bold">You</span> &{" "}
														{otherLikesCount} others reacted.
													</span>
												);
											} else if (currentUserLiked && otherLikesCount === 0) {
												return (
													<span>
														<span className="fw-bold">You</span> reacted.
													</span>
												);
											} else if (!currentUserLiked && post.likes.length === 1) {
												return (
													<span>
														<span className="fw-bold">
															{post.likes[0].user.name || "Someone"}
														</span>{" "}
														reacted.
													</span>
												);
											} else if (!currentUserLiked && post.likes.length > 1) {
												return (
													<span>
														<span className="fw-bold">
															{post.likes[0].user.name || "Someone"}
														</span>{" "}
														& {post.likes.length - 1} others reacted.
													</span>
												);
											}
											return null;
										})()}
								</div>
								<div className="d-flex flex-wrap gap-3 small text-muted">
									{post.analytics?.views > 0 && (
										<span>{post.analytics.views} views</span>
									)}
									{post.analytics?.shares > 0 && (
										<span>{post.analytics.shares} shares</span>
									)}
								</div>
							</div>

							<div
								className="d-flex justify-content-around text-muted mt-3 pt-2 border-top"
								style={{ maxWidth: "400px" }}
							>
								<Button
									variant="link"
									size="sm"
									className={`p-2 border-0 d-flex align-items-center gap-1 rounded-circle action-btn ${!canComment(post) ? "opacity-50" : "text-muted"}`}
									style={{
										transition: "all 0.2s",
										minWidth: "40px",
										height: "36px",
									}}
									disabled={!canComment(post)}
									title={
										!canComment(post)
											? "You cannot comment on this post"
											: "Comment"
									}
									onMouseEnter={(e) => {
										if (canComment(post)) {
											e.target.closest(".action-btn").style.backgroundColor =
												"rgba(29, 161, 242, 0.1)";
											e.target.closest(".action-btn").style.color = "#1da1f2";
										}
									}}
									onMouseLeave={(e) => {
										if (canComment(post)) {
											e.target.closest(".action-btn").style.backgroundColor =
												"transparent";
											e.target.closest(".action-btn").style.color = "#6c757d";
										}
									}}
								>
									<ChatDots size={24} style={{ flexShrink: 0 }} />
									{post.stats.comments > 0 && (
										<span className="small">{post.stats.comments}</span>
									)}
								</Button>

								<Button
									variant="link"
									size="sm"
									className="p-2 border-0 d-flex align-items-center gap-1 rounded-circle action-btn"
									style={{
										color: (post.likes || []).some(
											(like) => like.user.uid === currentUser.uid,
										)
											? "#dc3545"
											: "#6c757d",
										transition: "all 0.2s",
										minWidth: "40px",
										height: "36px",
									}}
									onClick={handleLikePost}
									onMouseEnter={(e) => {
										if (
											!(post.likes || []).some(
												(like) => like.user.uid === currentUser.uid,
											)
										) {
											e.target.closest(".action-btn").style.backgroundColor =
												"rgba(220, 53, 69, 0.1)";
											e.target.closest(".action-btn").style.color = "#dc3545";
										}
									}}
									onMouseLeave={(e) => {
										if (
											!(post.likes || []).some(
												(like) => like.user.uid === currentUser.uid,
											)
										) {
											e.target.closest(".action-btn").style.backgroundColor =
												"transparent";
											e.target.closest(".action-btn").style.color = "#6c757d";
										}
									}}
								>
									{(post.likes || []).some(
										(like) => like.user.uid === currentUser.uid,
									) ? (
										<HeartFill size={24} style={{ flexShrink: 0 }} />
									) : (
										<Heart size={24} style={{ flexShrink: 0 }} />
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
									onClick={() => handleSharePost(post.id)}
									onMouseEnter={(e) => {
										e.target.closest(".action-btn").style.backgroundColor =
											"rgba(23, 191, 99, 0.1)";
										e.target.closest(".action-btn").style.color = "#17bf63";
									}}
									onMouseLeave={(e) => {
										e.target.closest(".action-btn").style.backgroundColor =
											"transparent";
										e.target.closest(".action-btn").style.color = "#6c757d";
									}}
								>
									<Share size={24} style={{ flexShrink: 0 }} />
								</Button>
							</div>
						</div>
					</div>
				</Card.Body>
			</Card>

			{/* Comment Form */}
			{canComment(post) ? (
				<Card className="border-0 border-bottom rounded-0">
					<Card.Body className="px-3 py-3">
						<Form onSubmit={handleSubmitComment}>
							<div className="d-flex gap-3">
								<Image
									src={
										currentUser?.photoURL || "https://i.pravatar.cc/150?img=10"
									}
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
								<div className="flex-grow-1">
									<Form.Control
										as="textarea"
										rows={2}
										value={newComment}
										onChange={(e) => setNewComment(e.target.value)}
										placeholder="Post your reply"
										className="border-0 shadow-none resize-none"
										style={{ fontSize: "1.1rem" }}
									/>
									<div className="d-flex justify-content-end mt-2">
										<Button
											type="submit"
											size="sm"
											disabled={!newComment.trim() || submitting}
											className="rounded-pill px-3"
										>
											{submitting ? (
												<Spinner size="sm" animation="border" />
											) : (
												"Reply"
											)}
										</Button>
									</div>
								</div>
							</div>
						</Form>
					</Card.Body>
				</Card>
			) : (
				<Card className="border-0 border-bottom rounded-0">
					<Card.Body className="px-3 py-3 text-center text-muted">
						<div className="d-flex align-items-center justify-content-center gap-2">
							{getPrivacyIcon(post.privacy)}
							<span>
								{post.privacy === "private"
									? "Only the author can comment on this post"
									: post.privacy === "followers"
										? "Only followers can comment on this post"
										: "Comments are restricted"}
							</span>
						</div>
					</Card.Body>
				</Card>
			)}

			{/* Comments */}
			{comments.length === 0 ? (
				<div className="text-center py-5 text-muted">
					<p>No comments yet</p>
				</div>
			) : (
				<div className="comment-thread px-3 py-4">
					{comments.map((comment, index) => {
						// Check if the current comment is being edited
						const isEditing = editingCommentId === comment.id;

						return (
							<div
								key={comment.id}
								className={`comment-item ${index === comments.length - 1 ? "mb-0" : ""} d-flex gap-2 mb-3`}
							>
								<Image
									src={
										comment.author.photoURL || "https://i.pravatar.cc/150?img=10"
									}
									alt="avatar"
									roundedCircle
									width="40"
									height="40"
									className="comment-avatar"
									style={{
										objectFit: "cover",
										minWidth: "40px",
										minHeight: "40px",
									}}
								/>
								<div className="comment-content flex-grow-1">
									<div className="d-flex align-items-center justify-content-between">
										<div className="d-flex align-items-center gap-1 mb-1">
											<span className="fw-bold">
												{comment.author?.name || "Unknown User"}
											</span>
											{comment.author?.hasBlueCheck && (
												<span className="text-primary">
													<CheckCircleFill className="text-primary" size={16} />
												</span>
											)}
											<span className="text-muted">·</span>
											<span className="text-muted small">
												{formatTimeAgo(comment.createdAt)}
											</span>
										</div>
										{comment.author?.uid === currentUser?.uid && (
											<Button
												variant="link"
												className="text-muted p-1 border-0"
												onClick={() => {
													setSelectedComment(comment);
													setShowCommentOptionsModal(true);
												}}
											>
												<ThreeDots size={14} />
											</Button>
										)}
									</div>

									<div className="mb-2">
										{isEditing ? (
											// Editable comment content
											<Form className="d-flex gap-2">
												<Form.Control
													as="textarea"
													rows={2}
													value={editingCommentText}
													onChange={(e) => setEditingCommentText(e.target.value)}
													className="resize-none border-0 shadow-none flex-grow-1"
													style={{ fontSize: "0.9rem", outline: "none", boxShadow: "none" }}
												/>
												<div className="d-flex flex-column gap-1">
													<Button
														variant="success"
														size="sm"
														onClick={() => {
															// Call the update handler with comment ID and new text
															handleUpdateComment(comment.id, editingCommentText);
															setEditingCommentId(null); // Exit editing mode
														}}
													>
														Save
													</Button>
													<Button
														variant="secondary"
														size="sm"
														onClick={() => {
															setEditingCommentId(null); // Cancel editing
														}}
													>
														Cancel
													</Button>
												</div>
											</Form>
										) : (
											// Display comment content
											parseTextContent(comment.content, {
												onHashtagClick: handleHashtagClick,
												onMentionClick: handleMentionClick,
												onLinkClick: handleLinkClick,
											})
										)}
									</div>

									{/* Comment Actions */}
									<div className="d-flex align-items-center gap-3 mb-2">
										<Button
											variant="link"
											size="sm"
											className="p-0 border-0 d-flex align-items-center gap-1"
											style={{
												color: comment.likes?.some(like => like.user.uid === currentUser.uid)
													? "#dc3545" : "#6c757d",
												fontSize: "0.75rem",
											}}
											onClick={() => handleLikeComment(comment.id)}
										>
											{comment.likes?.some(like => like.user.uid === currentUser.uid) ? (
												<HeartFill size={12} />
											) : (
												<Heart size={12} />
											)}
											{comment.stats?.likes > 0 && <span>{comment.stats.likes}</span>}
										</Button>

										<Button
											variant="link"
											size="sm"
											className="p-0 border-0 d-flex align-items-center gap-1 text-muted"
											style={{ fontSize: "0.75rem" }}
											onClick={() => {
												// If already editing, focus the reply form for this comment
												if (isEditing) {
													toggleReplyForm(comment.id);
												} else {
													// Otherwise, start editing
													setEditingCommentId(comment.id);
													setEditingCommentText(comment.content);
													toggleReplyForm(comment.id); // Ensure reply form is closed when editing
												}
											}}
										>
											<ChatDots size={12} />
											Reply
										</Button>

										{comment.stats?.replies > 0 && (
											<span className="text-muted small">
												{comment.stats.replies} {comment.stats.replies === 1 ? 'reply' : 'replies'}
											</span>
										)}
									</div>

									{/* Reply Form */}
									{showReplyForms[comment.id] && !isEditing && ( // Hide reply form if editing
										<div className="mt-2 mb-3">
											<div className="d-flex gap-2">
												<Image
													src={currentUser?.photoURL || "https://i.pravatar.cc/150?img=10"}
													alt="avatar"
													roundedCircle
													width="32"
													height="32"
													style={{ objectFit: "cover" }}
												/>
												<div className="flex-grow-1">
													<Form.Control
														as="textarea"
														rows={2}
														value={replyTexts[comment.id] || ""}
														onChange={(e) => handleReplyTextChange(comment.id, e.target.value)}
														placeholder="Write a reply..."
														className="border-0 shadow-none resize-none"
														style={{ fontSize: "0.9rem" }}
													/>
													<div className="d-flex justify-content-end gap-2 mt-2">
														<Button
															variant="outline-secondary"
															size="sm"
															onClick={() => toggleReplyForm(comment.id)}
														>
															Cancel
														</Button>
														<Button
															size="sm"
															disabled={!replyTexts[comment.id]?.trim() || submittingReply[comment.id]}
															onClick={() => handleSubmitReply(comment.id)}
														>
															{submittingReply[comment.id] ? (
																<Spinner size="sm" animation="border" />
															) : (
																"Reply"
															)}
														</Button>
													</div>
												</div>
											</div>
										</div>
									)}

									{/* Replies */}
									{replies[comment.id] && replies[comment.id].length > 0 && (
										<div className="replies-section mt-2 ms-3 border-start border-2 ps-3">
											{replies[comment.id].map((reply, replyIndex) => (
												<div key={reply.id || `reply-${comment.id}-${replyIndex}`} className="d-flex gap-2 mb-2">
													<Image
														src={reply.author?.photoURL || "https://i.pravatar.cc/150?img=10"}
														alt="avatar"
														roundedCircle
														width="28"
														height="28"
														style={{ objectFit: "cover" }}
													/>
													<div className="flex-grow-1">
														<div className="d-flex align-items-center gap-1 mb-1">
															<span className="fw-bold small">
																{reply.author?.name || "Unknown User"}
															</span>
															{reply.author?.hasBlueCheck && (
																<CheckCircleFill className="text-primary" size={12} />
															)}
															<span className="text-muted">·</span>
															<span className="text-muted small">
																{reply.createdAt ? formatTimeAgo(reply.createdAt) : "just now"}
															</span>
														</div>
														<div className="mb-1" style={{ fontSize: "0.9rem" }}>
															{reply.content ? parseTextContent(reply.content, {
																onHashtagClick: handleHashtagClick,
																onMentionClick: handleMentionClick,
																onLinkClick: handleLinkClick,
															}) : "No content"}
														</div>
														<Button
															variant="link"
															size="sm"
															className="p-0 border-0 d-flex align-items-center gap-1"
															style={{
																color: reply.likes?.some(like => like.user.uid === currentUser.uid)
																	? "#dc3545" : "#6c757d",
																fontSize: "0.7rem",
															}}
															onClick={() => handleLikeReply(reply.id, comment.id)}
														>
															{reply.likes?.some(like => like.user.uid === currentUser.uid) ? (
																<HeartFill size={10} />
															) : (
																<Heart size={10} />
															)}
															{reply.stats?.likes > 0 && <span>{reply.stats.likes}</span>}
														</Button>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
			{/* Image Viewer Modal */}
			{showImageViewer && (
				<Modal
					show={showImageViewer}
					onHide={closeImageViewer}
					centered
					size="lg"
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
				onHide={() => setShowPostOptionsModal(false)}
				centered
			>
				<Modal.Header closeButton>
					<Modal.Title>Post Options</Modal.Title>
				</Modal.Header>
				<Modal.Body className="p-0">
					<div className="list-group list-group-flush">
						<button
							className="list-group-item list-group-item-action border-0"
							onClick={() => {
								navigator.clipboard.writeText(
									`${window.location.origin}/post/${post.id}`,
								);
								setShowPostOptionsModal(false);
							}}
						>
							Copy Link
						</button>
						<button
							className="list-group-item list-group-item-action border-0"
							onClick={() => setShowPostOptionsModal(false)}
						>
							Repost
						</button>
						{post.author.id !== currentUser.uid && (
							<button
								className="list-group-item list-group-item-action border-0 text-danger"
								onClick={() => setShowPostOptionsModal(false)}
							>
								Report
							</button>
						)}
						{post.author.uid === currentUser.uid && (
							<button
								className="list-group-item list-group-item-action border-0 text-danger"
								onClick={() => {
									setShowPostOptionsModal(false);
									handleDeletePost(post.id);
								}}
							>
								Delete Post
							</button>
						)}
					</div>
				</Modal.Body>
			</Modal>

			{/* Delete Post Confirmation Dialog */}
			<AlertDialog
				show={showDeleteDialog}
				onHide={() => {
					if (!deletingPost) {
						setShowDeleteDialog(false);
						setPostToDelete(null);
					}
				}}
				title="Delete Post"
				message="Are you sure you want to delete this post? This action cannot be undone."
				dialogButtonMessage={deletingPost ? "Deleting..." : "Delete"}
				onDialogButtonClick={confirmDeletePost}
				type="danger"
				disabled={deletingPost}
			/>

			{/* Comment Options Modal */}
			<Modal
				show={showCommentOptionsModal}
				onHide={() => {
					setShowCommentOptionsModal(false);
					setSelectedComment(null);
				}}
				centered
			>
				<Modal.Header closeButton>
					<Modal.Title>Comment Options</Modal.Title>
				</Modal.Header>
				<Modal.Body className="p-0 pb-2">
					<div className="list-group list-group-flush">
						<button
							className="list-group-item list-group-item-action border-0"
							onClick={handleCopyComment}
						>
							Copy Comment
						</button>
						{selectedComment?.author.uid !== currentUser.uid && (
							<button
								className="list-group-item list-group-item-action border-0 text-warning"
								onClick={handleReportComment}
							>
								Report Comment
							</button>
						)}
						{selectedComment?.author.uid === currentUser.uid && (
							<button
								className="list-group-item list-group-item-action border-0 text-danger"
								onClick={handleDeleteCommentFromModal}
							>
								Delete Comment
							</button>
						)}
					</div>
				</Modal.Body>
			</Modal>

			{/* Delete Comment Confirmation Dialog */}
			<AlertDialog
				show={showDeleteCommentDialog}
				onHide={() => {
					if (!deletingComment) {
						setShowDeleteDialog(false);
						setCommentToDelete(null);
					}
				}}
				title="Delete Comment"
				message="Are you sure you want to delete this comment? This action cannot be undone."
				dialogButtonMessage={deletingComment ? "Deleting..." : "Delete"}
				onDialogButtonClick={confirmDeleteComment}
				type="danger"
				disabled={deletingComment}
			/>
		</Container>
	);
};

export default PostDetailPage;
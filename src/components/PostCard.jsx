/** @format */

import React, {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { Card, Image, Button, Modal, Spinner, Badge } from "react-bootstrap";
import {
	Heart,
	HeartFill,
	ChatDots,
	Share,
	ThreeDots,
	CheckCircleFill,
	Globe,
	Lock,
	PersonFill,
} from "react-bootstrap-icons";

import {
	postAPI,
	commentAPI,
	replyAPI,
	businessAPI,
} from "../config/ApiConfig";
import {
	formatTimeAgo,
	deletePost as deletePostUtil,
} from "../utils/common-utils";
import { parseTextContent } from "../utils/text-utils";
import { handleLikeNotification } from "../utils/notification-helpers";
import CommentItem from "./CommentItem";
import PollView from "./PollView";
import RepostModal from "./RepostModal";
import ImageViewer from "./ImageViewer";
import NProgress from "nprogress";

const PostCard = ({
	post,
	currentUser,
	onLike,
	onShare,
	onDeletePost,
	showComments: propShowComments = false, // Renamed prop to avoid conflict
	comments = [],
}) => {
	// Check if this is an ad post
	const isAdPost = post.isAd && post.adCampaign;
	const isProfileUpdate = post.postType === "profile_update";
	const navigate = useNavigate();
	const [showImageViewer, setShowImageViewer] = useState(false);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [currentImages, setCurrentImages] = useState([]);
	const [showPostOptionsModal, setShowPostOptionsModal] = useState(false);
	const [showRepostModal, setShowRepostModal] = useState(false); // State for repost modal
	const cardRef = useRef(null);
	const [viewTracked, setViewTracked] = useState(false);
	const [showComments, setShowComments] = useState(false); // Local state for comments visibility
	const [localComments, setLocalComments] = useState([]);
	const [likingPost, setLikingPost] = useState(false); // Loading state for like button
	const hasTrackedView = useRef(false); // Ref to track if view has been tracked

	// Initialize local comments and showComments state based on props
	useEffect(() => {
		setLocalComments(comments);
		setShowComments(propShowComments);
	}, [comments, propShowComments, post.poll, currentUser]);

	// Track post view for analytics and ad impressions
	useEffect(() => {
		if (viewTracked && hasTrackedView.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !viewTracked && !hasTrackedView.current) {
						setViewTracked(true); // Mark as viewed to prevent re-triggering
						hasTrackedView.current = true; // Mark as tracked

						// Track view
						const trackView = async () => {
							try {
								await postAPI.trackView(post.id);

								// Also track ad impression if this is an ad post
								if (isAdPost && post.adCampaign) {
									await businessAPI.trackAdInteraction({
										campaignId: post.adCampaign.id,
										action: "impression",
										userId: currentUser?.uid || "anonymous",
									});
									console.log("Advertisement impression tracked");
								}
							} catch (error) {
								console.error(
									"Failed to track post view or ad impression:",
									error,
								);
							}
						};

						// Delay tracking slightly to ensure genuine view
						const timer = setTimeout(trackView, 1000); // Wait 1 second before tracking
						return () => {
							clearTimeout(timer);
							// Reset viewTracked when component unmounts or before next observation if needed
							// setViewTracked(false); // Re-evaluate if this reset is necessary based on component lifecycle
						};
					}
				});
			},
			{ threshold: 0.5 }, // Trigger when at least 50% of the element is visible
		);

		if (cardRef.current) {
			observer.observe(cardRef.current);
		}

		return () => {
			observer.disconnect();
		};
	}, [post.id, viewTracked, isAdPost, post.adCampaign, currentUser]);

	const canComment = useMemo(() => {
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
	}, [
		currentUser,
		post.author.uid,
		post.privacy,
		post.author.isFollowedByCurrentUser,
	]);

	const privacyIcon = useMemo(() => {
		switch (post.privacy) {
			case "public":
				return <Globe size={14} className="text-muted" />;
			case "private":
				return <Lock size={14} className="text-muted" />;
			case "followers":
				return <PersonFill size={14} className="text-muted" />;
			default:
				return <Globe size={14} className="text-muted" />;
		}
	}, [post.privacy]);

	const currentUserLiked = useMemo(
		() =>
			currentUser
				? post.likes.some((like) => like.user?.uid === currentUser.uid)
				: false,
		[post.likes, currentUser],
	);

	const openImageViewer = useCallback((images, startIndex = 0) => {
		setCurrentImages(images);
		setCurrentImageIndex(startIndex);
		setShowImageViewer(true);
	}, []);

	const closeImageViewer = useCallback(() => {
		setShowImageViewer(false);
		setCurrentImages([]);
		setCurrentImageIndex(0);
	}, []);

	const handlePostClickView = useCallback(
		async (e) => {
			// Prevent default behavior and stop propagation
			e.preventDefault();
			e.stopPropagation();

			// Don't navigate if clicking on interactive elements
			const target = e.target;
			if (!target || typeof target.closest !== "function") return;

			const isButton = target.closest("button");
			const isLink = target.closest("a");
			const isModal = target.closest(".modal");
			const isImage = target.closest("img");
			const isInput = target.closest("input, textarea");

			if (isButton || isLink || isModal || isImage || isInput) {
				return;
			}

			// Start NProgress and navigate
			NProgress.start();
			navigate(`/post/${post.id}`);
		},
		[post.id, navigate],
	);

	const handleLike = useCallback(
		async (e) => {
			e.stopPropagation();
			if (onLike && currentUser && !likingPost) {
				setLikingPost(true);
				try {
					const wasLiked = post.likes.some(
						(like) => like.user?.uid === currentUser.uid,
					);
					const response = await onLike(post.id);

					// Send like notification to post owner only when user actually likes (not unlikes)
					if (response && response.liked && !wasLiked && post.author.uid !== currentUser.uid) {
						try {
							await handleLikeNotification(post.id, post, currentUser);
						} catch (error) {
							console.error("Failed to send like notification:", error);
						}
					}
				} catch (error) {
					console.error("Failed to like post:", error);
				} finally {
					setLikingPost(false);
				}
			}
		},
		[onLike, currentUser, likingPost, post],
	);

	const handleShare = useCallback(
		(e) => {
			e.stopPropagation();
			setShowRepostModal(true); // Open repost modal instead of sharing
		},
		[],
	);

	const handleCommentToggle = useCallback(() => {
		setShowComments((prev) => !prev);
	}, []);

	const handleDeletePost = async (postId) => {
		await deletePostUtil(postId, postAPI.deletePost); // Use the utility function
		onDeletePost?.(postId);
	};

	const handleHashtagClick = useCallback(
		(hashtag) => {
			navigate(`/search?q=%23${encodeURIComponent(hashtag)}&tab=comments`);
		},
		[navigate],
	);

	const handleMentionClick = useCallback(
		(username) => {
			navigate(`/${username}`);
		},
		[navigate],
	);

	const handleLinkClick = useCallback((url) => {
		window.open(url, "_blank", "noopener,noreferrer");
	}, []);

	const openPostOptionsModal = useCallback((e) => {
		e.stopPropagation();
		setShowPostOptionsModal(true);
	}, []);

	const closePostOptionsModal = useCallback(() => {
		setShowPostOptionsModal(false);
	}, []);

	const handleRepost = useCallback(
		async (content = "", specificPostId = null) => {
			try {
				// Use the specific post ID if provided, otherwise use the current post's ID
				const postIdToRepost = specificPostId || post.id;
				const response = await postAPI.repost(postIdToRepost, content);
				console.log("Reposted successfully:", response);
				setShowRepostModal(false);
				return response;
			} catch (error) {
				console.error("Failed to repost:", error);
				// Let the modal handle the error display
				throw error;
			}
		},
		[post.id],
	);

	const handleAdClick = useCallback(async () => {
		if (!isAdPost || !post.adCampaign) return;

		try {
			// Track ad click using actual API
			await businessAPI.trackAdInteraction({
				campaignId: post.adCampaign.id,
				action: "click",
				userId: currentUser?.uid || "anonymous",
			});

			console.log("Advertisement click tracked successfully");

			// Navigate based on ad target type
			if (post.adCampaign.targetType === "profile") {
				navigate(`/${post.adCampaign.targetId}`);
			} else if (post.adCampaign.targetType === "url") {
				if (post.adCampaign.targetId.startsWith("http")) {
					window.open(
						post.adCampaign.targetId,
						"_blank",
						"noopener,noreferrer",
					);
				} else {
					navigate(post.adCampaign.targetId);
				}
			}
		} catch (error) {
			console.error("Failed to track ad click:", error);
		}
	}, [isAdPost, post.adCampaign, currentUser, navigate]);

	return (
		<>
			<Card
				ref={cardRef}
				className={`border-0 border-bottom rounded-0 mb-0 ${isAdPost ? "bg-white" : ""}`}
				style={{ cursor: "pointer" }}
				onClick={isAdPost ? handleAdClick : handlePostClickView}
			>
				<Card.Body className="px-3">
					{/* Ad Banner */}
					{isAdPost && (
						<div className="d-flex justify-content-between align-items-center mb-2">
							<div className="d-flex align-items-center gap-2">
								<Badge bg="secondary" className="small">
									Sponsored
								</Badge>
								<small className="text-muted">
									Advertisement • {post.adCampaign.title}
								</small>
							</div>
						</div>
					)}
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
								<div className="d-flex align-items-center gap-1 flex-grow-1 min-width-0">
									<div className="d-flex align-items-center gap-1 flex-shrink-0">
										<span
											className="fw-bold text-truncate"
											style={{ cursor: "pointer", color: "inherit", maxWidth: "120px" }}
											onClick={(e) => {
												e.stopPropagation();
												navigate(`/${post.author.username}`);
											}}
										>
											{post.author.name}
										</span>
										{post.author.hasBlueCheck && (
											<CheckCircleFill className="text-primary" size={16} />
										)}
										{isProfileUpdate && (
											<small className="text-muted text-truncate" style={{ maxWidth: "100px" }}>
												updated {post.author.gender === "male" ? "his" :
												post.author.gender === "female" ? "her" : "their"} avatar
											</small>
										)}
									</div>
									<div className="d-flex align-items-center gap-1 text-muted small text-nowrap flex-shrink-0">
										<span>·</span>
										<span>{formatTimeAgo(post.createdAt)}</span>
										<span>·</span>
										{privacyIcon}
									</div>
								</div>
								<Button
									variant="link"
									className="text-muted p-1 border-0 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
									style={{
										width: "32px",
										height: "32px",
										background: "none",
										border: "none !important",
										boxShadow: "none !important",
									}}
									onClick={openPostOptionsModal}
								>
									<ThreeDots size={16} />
								</Button>
							</div>

							{post.content && (
								<div className="mb-2">
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
											onClick={(e) => {
												e.stopPropagation();
												openImageViewer(post.imageUrls, 0);
											}}
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
																		backgroundColor: "rgba(0, 0, 0, 0.7)",
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

							{/* Poll Display */}
							{post.poll && (
								<PollView
									post={post}
									currentUser={currentUser}
									onClick={(e) => e.stopPropagation()}
								/>
							)}

							{/* Original Post Display for Reposts */}
							{post.isRepost && post.originalPost && (
								<div className="mb-2">
									<div className="border rounded-3 p-3 bg-white">
										<div className="d-flex gap-2">
											<Image
												src={
													post.originalPost.author.photoURL ||
													"https://i.pravatar.cc/150?img=10"
												}
												alt="original author avatar"
												roundedCircle
												width="32"
												height="32"
												style={{
													objectFit: "cover",
													minWidth: "32px",
													minHeight: "32px",
												}}
											/>
											<div className="flex-grow-1">
												<div className="d-flex align-items-center gap-1 mb-2">
													<span
														className="fw-bold"
														style={{ cursor: "pointer", color: "inherit" }}
														onClick={(e) => {
															e.stopPropagation();
															navigate(`/${post.originalPost.author.username}`);
														}}
													>
														{post.originalPost.author.name}
													</span>
													{post.originalPost.author.hasBlueCheck && (
														<CheckCircleFill className="text-primary" size={16} />
													)}
													<span className="text-muted">·</span>
													<span className="text-muted small">
														{formatTimeAgo(post.originalPost.createdAt)}
													</span>
													<span className="text-muted">·</span>
													{post.originalPost.privacy === "public" ? (
														<Globe size={14} className="text-muted" />
													) : post.originalPost.privacy === "private" ? (
														<Lock size={14} className="text-muted" />
													) : (
														<PersonFill size={14} className="text-muted" />
													)}
												</div>

												{post.originalPost.content && (
													<div className="mb-2">
														{parseTextContent(post.originalPost.content, {
															onHashtagClick: handleHashtagClick,
															onMentionClick: handleMentionClick,
															onLinkClick: handleLinkClick,
														})}
													</div>
												)}

												{post.originalPost.imageUrls && post.originalPost.imageUrls.length > 0 && (
													<div className="mb-2">
														{post.originalPost.imageUrls.length === 1 ? (
															<Image
																src={post.originalPost.imageUrls[0]}
																className="rounded w-100"
																style={{
																	height: "200px",
																	objectFit: "cover",
																	cursor: "pointer",
																}}
																onClick={(e) => {
																	e.stopPropagation();
																	openImageViewer(post.originalPost.imageUrls, 0);
																}}
															/>
														) : (
															<div className="d-flex gap-2" style={{ height: "200px" }}>
																<div style={{ flex: "2" }}>
																	<Image
																		src={post.originalPost.imageUrls[0]}
																		className="rounded w-100 h-100"
																		style={{
																			objectFit: "cover",
																			cursor: "pointer",
																		}}
																		onClick={(e) => {
																			e.stopPropagation();
																			openImageViewer(post.originalPost.imageUrls, 0);
																		}}
																	/>
																</div>
																{post.originalPost.imageUrls.length > 1 && (
																	<div className="d-flex flex-column gap-2" style={{ flex: "1" }}>
																		<div style={{ height: post.originalPost.imageUrls.length > 2 ? "calc(50% - 4px)" : "100%" }}>
																			<Image
																				src={post.originalPost.imageUrls[1]}
																				className="rounded w-100 h-100"
																				style={{
																					objectFit: "cover",
																					cursor: "pointer",
																				}}
																				onClick={(e) => {
																					e.stopPropagation();
																					openImageViewer(post.originalPost.imageUrls, 1);
																				}}
																			/>
																		</div>
																		{post.originalPost.imageUrls.length > 2 && (
																			<div style={{ height: "calc(50% - 4px)" }} className="position-relative">
																				<Image
																					src={post.originalPost.imageUrls[2]}
																					className="rounded w-100 h-100"
																					style={{
																						objectFit: "cover",
																						cursor: "pointer",
																					}}
																					onClick={(e) => {
																						e.stopPropagation();
																						openImageViewer(post.originalPost.imageUrls, 2);
																					}}
																				/>
																				{post.originalPost.imageUrls.length > 3 && (
																					<div
																						className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded"
																						style={{
																							backgroundColor: "rgba(0, 0, 0, 0.7)",
																							cursor: "pointer",
																							color: "white",
																							fontWeight: "bold",
																							fontSize: "1rem",
																						}}
																						onClick={(e) => {
																							e.stopPropagation();
																							openImageViewer(post.originalPost.imageUrls, 2);
																						}}
																					>
																						+{post.originalPost.imageUrls.length - 3}
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
											</div>
										</div>
									</div>
								</div>
							)}

							{post.postType === "live_video" && post.liveVideoUrl && (
								<div className="mb-2">
									<div className="position-relative rounded overflow-hidden bg-dark">
										{post.isLiveStreaming ? (
											<div className="text-center p-4 text-white">
												<div className="d-flex align-items-center justify-content-center gap-2 mb-2">
													<span
														style={{
															width: "8px",
															height: "8px",
															borderRadius: "50%",
															backgroundColor: "#dc3545",
															display: "inline-block",
															animation: "pulse 1s infinite",
														}}
													></span>
													<span className="fw-bold text-danger">LIVE NOW</span>
												</div>
												<p className="mb-2">🔴 Live Stream in Progress</p>
												<Button
													variant="outline-light"
													size="sm"
													onClick={() =>
														window.open(post.liveVideoUrl, "_blank")
													}
												>
													Watch Live Stream
												</Button>
											</div>
										) : (
											<div className="text-center p-4 text-white">
												<p className="mb-2">📹 Live Stream Ended</p>
												<small className="text-muted">
													Stream URL: {post.liveVideoUrl}
												</small>
											</div>
										)}
									</div>
								</div>
							)}

							<div className="d-flex align-items-center justify-content-between">
								<div className="d-flex flex-wrap gap-3 small text-muted">
									{post.likes.length > 0 &&
										currentUser &&
										(() => {
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
									{post.likes.length > 0 && !currentUser && (
										<span>
											{post.likes.length}{" "}
											{post.likes.length === 1 ? "reaction" : "reactions"}
										</span>
									)}
								</div>
								<div className="d-flex flex-wrap gap-2 small text-muted">
									{post.stats?.views > 0 && (
										<span>{post.stats.views} views</span>
									)}
									{post.stats?.shares > 0 && (
										<span>{post.stats.shares} shares</span>
									)}
									{post.stats?.reposts > 0 && (
										<span
											style={{ cursor: "pointer" }}
											onClick={(e) => {
												e.stopPropagation();
												navigate(`/post/${post.id}/reposts`);
											}}
										>
											{post.stats.reposts} reposts
										</span>
									)}
								</div>
							</div>

							{/* Ad Call-to-Action */}
							{isAdPost && (
								<div className="mt-2 pt-2 border-top bg-white">
									<div className="d-flex justify-content-between align-items-center">
										<Button
											variant="outline-primary"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												handleAdClick();
											}}
										>
											{post.adCampaign.targetType === "profile"
												? "Visit Profile"
												: "Learn More"}
										</Button>
										<small className="text-muted">
											<a
												href="/policies/privacy"
												className="text-decoration-none text-muted"
												target="_blank"
												rel="noopener noreferrer"
												onClick={(e) => e.stopPropagation()}
											>
												Why am I seeing this?
											</a>
										</small>
									</div>
								</div>
							)}

							<div className="d-flex justify-content-between text-muted mt-3 pt-2 border-top">
								<Button
									variant="link"
									size="sm"
									className={`p-2 border-0 d-flex align-items-center gap-1 rounded-circle action-btn ${!canComment ? "opacity-50" : "text-muted"}`}
									style={{
										transition: "all 0.2s",
										flex: "1",
										maxWidth: "120px",
										height: "36px",
										justifyContent: "center",
									}}
									onClick={handleCommentToggle} // Use toggle handler
									disabled={!canComment}
									title={
										!canComment ? "You cannot comment on this post" : "Comment"
									}
									onMouseEnter={(e) => {
										if (canComment) {
											e.target.closest(".action-btn").style.backgroundColor =
												"rgba(29, 161, 242, 0.1)";
											e.target.closest(".action-btn").style.color = "#1da1f2";
										}
									}}
									onMouseLeave={(e) => {
										if (canComment) {
											e.target.closest(".action-btn").style.backgroundColor =
												"transparent";
											e.target.closest(".action-btn").style.color = "#6c757d";
										}
									}}
								>
									<ChatDots size={20} style={{ flexShrink: 0 }} />
									{post.stats?.comments > 0 && (
										<span className="small d-none d-sm-inline">
											{post.stats?.comments}
										</span>
									)}
								</Button>

								<Button
									variant="link"
									size="sm"
									className="p-2 border-0 d-flex align-items-center gap-1 rounded-circle action-btn"
									style={{
										color: currentUserLiked ? "#dc3545" : "#6c757d",
										transition: "all 0.2s",
										flex: "1",
										maxWidth: "120px",
										height: "36px",
										justifyContent: "center",
									}}
									onClick={handleLike}
									disabled={likingPost || !currentUser}
									onMouseEnter={(e) => {
										if (!currentUserLiked && !likingPost && currentUser) {
											e.target.closest(".action-btn").style.backgroundColor =
												"rgba(220, 53, 69, 0.1)";
											e.target.closest(".action-btn").style.color = "#dc3545";
										}
									}}
									onMouseLeave={(e) => {
										if (!currentUserLiked && !likingPost && currentUser) {
											e.target.closest(".action-btn").style.backgroundColor =
												"transparent";
											e.target.closest(".action-btn").style.color = "#6c757d";
										}
									}}
								>
									{likingPost ? (
										<Spinner
											size="sm"
											animation="border"
											style={{ width: "20px", height: "20px" }}
										/>
									) : currentUserLiked ? (
										<HeartFill size={20} style={{ flexShrink: 0 }} />
									) : (
										<Heart size={20} style={{ flexShrink: 0 }} />
									)}
									{!likingPost && post.stats?.likes > 0 && (
										<span className="small d-none d-sm-inline">
											{post.stats?.likes}
										</span>
									)}
								</Button>

								<Button
									variant="link"
									size="sm"
									className="text-muted p-2 border-0 rounded-circle action-btn"
									style={{
										transition: "all 0.2s",
										flex: "1",
										maxWidth: "120px",
										height: "36px",
										justifyContent: "center",
									}}
									onClick={handleShare}
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
									<Share size={20} style={{ flexShrink: 0 }} />
								</Button>
							</div>

							{/* Threaded Comments - show when enabled and post has comment capability */}
							{showComments && (
								<div className="mt-3 pt-2 border-top comment-thread">
									{(localComments || []).map((comment, index) => (
										<CommentItem
											key={comment.id}
											comment={comment}
											currentUser={currentUser}
											onLike={async (commentId) => {
												try {
													const response =
														await commentAPI.likeComment(commentId);
													// Update local comment state
													setLocalComments((prev) =>
														prev.map((c) =>
															c.id === commentId
																? {
																		...c,
																		likes: response.likes,
																		isLiked: response.liked,
																	}
																: c,
														),
													);
													return response;
												} catch (error) {
													console.error("Failed to like comment:", error);
												}
											}}
											onReply={async (commentId, replyContent) => {
												try {
													const response = await replyAPI.createReply(
														commentId,
														{ content: replyContent },
													);
													// Update local comment state with new reply
													setLocalComments((prev) =>
														prev.map((c) =>
															c.id === commentId
																? {
																		...c,
																		replies: [
																			...(c.replies || []),
																			response.reply,
																		],
																	}
																: c,
														),
													);
													return response;
												} catch (error) {
													console.error("Failed to create reply:", error);
												}
											}}
											onHashtagClick={handleHashtagClick}
											onMentionClick={handleMentionClick}
											onLinkClick={handleLinkClick}
											navigate={navigate}
											isLast={index === localComments.length - 1}
										/>
									))}
								</div>
							)}
						</div>
					</div>
				</Card.Body>
			</Card>

			{/* Image Viewer */}
			<ImageViewer
				show={showImageViewer}
				onHide={closeImageViewer}
				images={currentImages}
				initialIndex={currentImageIndex}
				post={post}
				currentUser={currentUser}
				onLike={handleLike}
				onComment={handleCommentToggle}
				onShare={handleShare}
				onPostOptions={openPostOptionsModal}
				onHashtagClick={handleHashtagClick}
				onMentionClick={handleMentionClick}
				onLinkClick={handleLinkClick}
				onNavigateToProfile={(username) => navigate(`/${username}`)}
			/>

			{/* Post Options Modal */}
			<Modal
				show={showPostOptionsModal}
				onHide={closePostOptionsModal}
				centered
			>
				<Modal.Header closeButton>
					<Modal.Title>Post Options</Modal.Title>
				</Modal.Header>
				<Modal.Body className="px-0 pt-0 pb-2">
					<div className="list-group list-group-flush">
						<button
							className="list-group-item list-group-item-action border-0"
							onClick={() => {
								navigator.clipboard.writeText(
									`${window.location.origin}/post/${post.id}`,
								);
								closePostOptionsModal();
							}}
						>
							Copy Link
						</button>
						<button
							className="list-group-item list-group-item-action border-0"
							onClick={() => {
								setShowRepostModal(true);
								closePostOptionsModal();
							}}
						>
							Repost
						</button>
						{currentUser && post.author.uid !== currentUser.uid && (
							<button
								className="list-group-item list-group-item-action border-0 text-danger"
								onClick={closePostOptionsModal}
							>
								Report
							</button>
						)}
						{currentUser && post.author.uid === currentUser.uid && (
							<button
								className="list-group-item list-group-item-action border-0 text-danger"
								onClick={() => handleDeletePost(post.id)}
							>
								Delete Post
							</button>
						)}
					</div>
				</Modal.Body>
			</Modal>

			{/* Repost Modal */}
			<RepostModal
				show={showRepostModal}
				onHide={() => setShowRepostModal(false)}
				onRepost={handleRepost}
				post={post}
				currentUser={currentUser}
				loading={false}
			/>
		</>
	);
};

export default PostCard;
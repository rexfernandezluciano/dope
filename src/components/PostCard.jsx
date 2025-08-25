/** @format */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Image, Button, Modal } from "react-bootstrap";
import {
	Heart,
	HeartFill,
	ChatDots,
	Share,
	X,
	ThreeDots,
	CheckCircleFill,
	Globe,
	Lock,
	PersonFill,
	ChevronLeft,
	ChevronRight,
} from "react-bootstrap-icons";

import { postAPI, commentAPI, replyAPI } from "../config/ApiConfig";
import {
	formatTimeAgo,
	deletePost as deletePostUtil,
	sharePost,
} from "../utils/common-utils";
import { parseTextContent } from "../utils/text-utils";
import { handleLikeNotification } from "../utils/notification-helpers";
import CommentItem from "./CommentItem";

const PostCard = ({
	post,
	currentUser,
	onLike,
	onShare,
	onDeletePost,
	showComments: propShowComments = false, // Renamed prop to avoid conflict
	comments = [],
}) => {
	const navigate = useNavigate();
	const [showImageViewer, setShowImageViewer] = useState(false);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [currentImages, setCurrentImages] = useState([]);
	const [showPostOptionsModal, setShowPostOptionsModal] = useState(false);
	const cardRef = useRef(null);
	const [viewTracked, setViewTracked] = useState(false);
	const [showComments, setShowComments] = useState(false); // Local state for comments visibility
	const [localComments, setLocalComments] = useState([]);
	const [userVotedOption, setUserVotedOption] = useState(null);

	// Initialize local comments and showComments state based on props
	useEffect(() => {
		setLocalComments(comments);
		// Set initial showComments state based on prop, but allow it to be toggled by user action
		setShowComments(propShowComments);
		
		// Initialize poll voting state
		if (post.poll && currentUser) {
			// Check if user has voted based on hasUserVoted flag or find user's choice
			if (post.poll.hasUserVoted) {
				const userChoice = post.poll.options.findIndex(option => option.isUserChoice);
				setUserVotedOption(userChoice >= 0 ? userChoice : null);
			} else {
				setUserVotedOption(null);
			}
		}
	}, [comments, propShowComments, post.poll, currentUser]);

	// Track view when post comes into view
	useEffect(() => {
		if (viewTracked) return;

		const trackView = async () => {
			try {
				if (postAPI.trackView) {
					await postAPI.trackView(post.id);
					setViewTracked(true);
				}
			} catch (error) {
				console.error("Failed to track view for post:", post.id, error);
				// Don't set viewTracked to true on error to allow retry
			}
		};

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !viewTracked) {
						trackView();
					}
				});
			},
			{ threshold: 0.5 },
		);

		if (cardRef.current) {
			observer.observe(cardRef.current);
		}

		return () => observer.disconnect();
	}, [post.id, viewTracked]);

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
	}, [currentUser, post.author.uid, post.privacy, post.author.isFollowedByCurrentUser]);

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

	const currentUserLiked = useMemo(() => 
		currentUser ? post.likes.some(like => like.user?.uid === currentUser.uid) : false,
		[post.likes, currentUser]
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

	const handlePostClickView = useCallback(async (e) => {
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

		// Navigate directly instead of using utility function
		navigate(`/post/${post.id}`);
	}, [post.id, navigate]);

	const handleLike = useCallback(async (e) => {
		e.stopPropagation();
		if (onLike && currentUser) {
			const wasLiked = post.likes.some(like => like.user?.uid === currentUser.uid);
			const response = await onLike(post.id);

			// Send like notification to post owner only when user actually likes (not unlikes)
			if (response && response.liked && !wasLiked) {
				try {
					await handleLikeNotification(post.id, post, currentUser);
				} catch (error) {
					console.error('Failed to send like notification:', error);
				}
			}
		}
	}, [onLike, post, currentUser]);

	const handleShare = useCallback((e) => {
		e.stopPropagation();
		sharePost(post.id); // Use the utility function
		if (onShare) {
			onShare(post.id);
		}
	}, [post.id, onShare]);

	const handleCommentToggle = useCallback(() => {
		setShowComments(prev => !prev);
	}, []);

	const handleDeletePost = async (postId) => {
		await deletePostUtil(postId, postAPI.deletePost); // Use the utility function
		onDeletePost?.(postId);
	};

	const handleHashtagClick = useCallback((hashtag) => {
		navigate(`/search?q=%23${encodeURIComponent(hashtag)}&tab=comments`);
	}, [navigate]);

	const handleMentionClick = useCallback((username) => {
		navigate(`/${username}`);
	}, [navigate]);

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

	const handlePollVote = useCallback(async (optionIndex) => {
		if (!currentUser || post.poll.hasUserVoted || post.poll.isExpired) return;
		
		try {
			const response = await postAPI.votePoll(post.id, optionIndex);
			if (response && response.success) {
				// Update the post poll data with the response
				// This would typically be handled by a parent component or state management
				console.log('Poll vote successful:', response);
			}
		} catch (error) {
			console.error('Failed to vote on poll:', error);
		}
	}, [currentUser, post.poll.hasUserVoted, post.poll.isExpired, post.id]);

	return (
		<>
			<Card
				ref={cardRef}
				className="border-0 border-bottom rounded-0 mb-0 post-card"
				style={{ cursor: "pointer" }}
				onClick={handlePostClickView}
			>
				<Card.Body className="px-3">
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
									<span className="text-muted">·</span>
									<span className="text-muted small">
										{formatTimeAgo(post.createdAt)}
									</span>
									<span className="text-muted">·</span>
									{privacyIcon}
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
								<div className="mb-2">
									<div className="border rounded-3 p-3" style={{ backgroundColor: "#f8f9fa" }}>
										<div className="d-flex align-items-center justify-content-between mb-3">
											<h6 className="mb-0">Poll</h6>
											<small className="text-muted">
												{(() => {
													if (post.poll.isExpired) {
														return "Poll ended";
													}
													
													const now = new Date();
													const endTime = new Date(post.poll.expiresAt);
													const timeLeft = endTime - now;
													
													if (timeLeft <= 0) {
														return "Poll ended";
													}
													
													const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
													const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
													
													if (hoursLeft > 0) {
														return `${hoursLeft}h ${minutesLeft}m left`;
													} else {
														return `${minutesLeft}m left`;
													}
												})()}
											</small>
										</div>
										
										{post.poll.options.map((option, index) => {
											const canVote = currentUser && !post.poll.hasUserVoted && !post.poll.isExpired;
											
											return (
												<div
													key={option.id || index}
													className={`position-relative border rounded-3 p-2 mb-2 ${
														canVote ? "cursor-pointer" : ""
													} ${
														option.isUserChoice ? "border-primary bg-primary bg-opacity-10" : "border-secondary"
													}`}
													style={{ 
														cursor: canVote ? "pointer" : "default",
														overflow: "hidden"
													}}
													onClick={() => canVote && handlePollVote(index)}
												>
													{/* Progress bar background */}
													<div
														className="position-absolute top-0 start-0 h-100 bg-light"
														style={{
															width: `${option.percentage}%`,
															opacity: 0.3,
															zIndex: 1,
														}}
													/>
													
													<div className="position-relative d-flex justify-content-between align-items-center" style={{ zIndex: 2 }}>
														<span className={`${option.isUserChoice ? "fw-bold text-primary" : ""}`}>
															{option.text}
															{option.isUserChoice && " ✓"}
														</span>
														<span className="text-muted small">
															{option.percentage}% ({option.votes})
														</span>
													</div>
												</div>
											);
										})}
										
										<div className="text-muted small mt-2">
											{post.poll.totalVotes} votes
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
									{post.likes.length > 0 && currentUser && (() => {
										const otherLikesCount = currentUserLiked ? post.likes.length - 1 : post.likes.length;

										if (currentUserLiked && otherLikesCount > 0) {
											return (
												<span>
													<span className="fw-bold">You</span> & {otherLikesCount} others reacted.
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
													<span className="fw-bold">{post.likes[0].user.name || 'Someone'}</span> reacted.
												</span>
											);
										} else if (!currentUserLiked && post.likes.length > 1) {
											return (
												<span>
													<span className="fw-bold">{post.likes[0].user.name || 'Someone'}</span> & {post.likes.length - 1} others reacted.
												</span>
											);
										}
										return null;
									})()}
									{post.likes.length > 0 && !currentUser && (
										<span>
											{post.likes.length} {post.likes.length === 1 ? 'reaction' : 'reactions'}
										</span>
									)}
								</div>
								<div className="d-flex flex-wrap gap-3 small text-muted">
									{post.stats?.views > 0 && (
										<span>{post.stats.views} views</span>
									)}
									{post.stats?.shares > 0 && (
										<span>{post.stats.shares} shares</span>
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
									className={`p-2 border-0 d-flex align-items-center gap-1 rounded-circle action-btn ${!canComment ? "opacity-50" : "text-muted"}`}
									style={{
										transition: "all 0.2s",
										minWidth: "40px",
										height: "36px",
									}}
									onClick={handleCommentToggle} // Use toggle handler
									disabled={!canComment}
									title={
										!canComment
											? "You cannot comment on this post"
											: "Comment"
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
										<span className="small">{post.stats?.comments}</span>
									)}
								</Button>

								<Button
									variant="link"
									size="sm"
									className="p-2 border-0 d-flex align-items-center gap-1 rounded-circle action-btn"
									style={{
										color: currentUserLiked
											? "#dc3545"
											: "#6c757d",
										transition: "all 0.2s",
										minWidth: "40px",
										height: "36px",
									}}
									onClick={handleLike}
									onMouseEnter={(e) => {
										if (!currentUserLiked) {
											e.target.closest(".action-btn").style.backgroundColor =
												"rgba(220, 53, 69, 0.1)";
											e.target.closest(".action-btn").style.color = "#dc3545";
										}
									}}
									onMouseLeave={(e) => {
										if (!currentUserLiked) {
											e.target.closest(".action-btn").style.backgroundColor =
												"transparent";
											e.target.closest(".action-btn").style.color = "#6c757d";
										}
									}}
								>
									{currentUserLiked ? (
										<HeartFill size={20} style={{ flexShrink: 0 }} />
									) : (
										<Heart size={20} style={{ flexShrink: 0 }} />
									)}
									{post.stats?.likes > 0 && (
										<span className="small">{post.stats?.likes}</span>
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
													const response = await commentAPI.likeComment(commentId);
													// Update local comment state
													setLocalComments(prev => prev.map(c => 
														c.id === commentId 
															? { ...c, likes: response.likes, isLiked: response.liked }
															: c
													));
													return response;
												} catch (error) {
													console.error('Failed to like comment:', error);
												}
											}}
											onReply={async (commentId, replyContent) => {
												try {
													const response = await replyAPI.createReply(commentId, { content: replyContent });
													// Update local comment state with new reply
													setLocalComments(prev => prev.map(c => 
														c.id === commentId 
															? { ...c, replies: [...(c.replies || []), response.reply] }
															: c
													));
													return response;
												} catch (error) {
													console.error('Failed to create reply:', error);
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
							onClick={closePostOptionsModal}
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
		</>
	);
};

export default PostCard;
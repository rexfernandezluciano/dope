
/** @format */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Image, Button, Collapse } from "react-bootstrap";
import {
	Heart,
	HeartFill,
	ChatDots,
	Share,
	ChevronDown,
	ChevronUp,
	CheckCircleFill,
} from "react-bootstrap-icons";
import { commentAPI } from "../config/ApiConfig";
import { formatTimeAgo } from "../utils/common-utils";
import { parseTextContent } from "../utils/text-utils";
import { handleLikeNotification } from "../utils/notification-helpers";

const ThreadedPost = ({ post, currentUser, onLike, onShare, maxComments = 3 }) => {
	const navigate = useNavigate();
	const [comments, setComments] = useState([]);
	const [showAllComments, setShowAllComments] = useState(false);
	useEffect(() => {
		const loadComments = async () => {
			try {
				const response = await commentAPI.getComments(post.id);
				setComments(response.comments || []);
			} catch (error) {
				console.error("Failed to load comments:", error);
				setComments([]); // Set empty array on error
			}
		};

		// Always try to load comments, don't rely on stats
		if (post.id) {
			loadComments();
		}
	}, [post.id]);

	

	const handleHashtagClick = (hashtag) => {
		navigate(`/search?q=%23${encodeURIComponent(hashtag)}&tab=comments`);
	};

	const handleMentionClick = (username) => {
		navigate(`/${username}`);
	};

	const handleLinkClick = (url) => {
		window.open(url, "_blank", "noopener,noreferrer");
	};

	const displayedComments = showAllComments ? comments : comments.slice(0, maxComments);
	const hasMoreComments = comments.length > maxComments;

	return (
		<Card className="border-0 border-bottom rounded-0 mb-0">
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
						<div className="d-flex align-items-center gap-1 mb-1">
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

						{/* Post images if any */}
						{post.imageUrls && post.imageUrls.length > 0 && (
							<div className="mb-2">
								<Image
									src={post.imageUrls[0]}
									className="rounded w-100"
									style={{
										height: "200px",
										objectFit: "cover",
										cursor: "pointer",
									}}
									onClick={() => navigate(`/post/${post.id}`)}
								/>
								{post.imageUrls.length > 1 && (
									<div className="mt-1 text-muted small">
										+{post.imageUrls.length - 1} more images
									</div>
								)}
							</div>
						)}

						{/* Post analytics */}
						<div className="d-flex align-items-center justify-content-between mb-2">
							<div className="d-flex flex-wrap gap-3 small text-muted">
								{post.likes?.length > 0 && (
									<span>
										{post.likes.some(like => like.user.uid === currentUser?.uid) ? (
											<span>
												<span className="fw-bold">You</span>{" "}
												{post.likes.length > 1
													? `& ${post.likes.length - 1} reacted.`
													: " reacted."}
											</span>
										) : (
											<span>{post.likes.length} likes</span>
										)}
									</span>
								)}
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

						{/* Action buttons */}
						<div className="d-flex justify-content-around text-muted pt-2 border-top" style={{ maxWidth: "400px" }}>
							<Button
								variant="link"
								size="sm"
								className="p-2 border-0 d-flex align-items-center gap-1 rounded-circle action-btn text-muted"
								onClick={() => navigate(`/post/${post.id}`)}
							>
								<ChatDots size={20} />
								{post.stats?.comments > 0 && (
									<span className="small">{post.stats.comments}</span>
								)}
							</Button>

							<Button
								variant="link"
								size="sm"
								className="p-2 border-0 d-flex align-items-center gap-1 rounded-circle action-btn"
								style={{
									color: post.likes?.some(like => like.user.uid === currentUser?.uid)
										? "#dc3545"
										: "#6c757d",
								}}
								onClick={async () => {
									onLike?.(post.id);
									
									// Send like notification
									try {
										await handleLikeNotification(post.id, post, currentUser);
									} catch (error) {
										console.error('Failed to send like notification:', error);
									}
								}}
							>
								{post.likes?.some(like => like.user.uid === currentUser?.uid) ? (
									<HeartFill size={20} />
								) : (
									<Heart size={20} />
								)}
								{post.stats?.likes > 0 && (
									<span className="small">{post.stats.likes}</span>
								)}
							</Button>

							<Button
								variant="link"
								size="sm"
								className="text-muted p-2 border-0 rounded-circle action-btn"
								onClick={() => onShare?.(post.id)}
							>
								<Share size={20} />
							</Button>
						</div>

						{/* Threaded Comments */}
						{comments.length > 0 && (
							<div className="mt-3 pt-2 border-top">
								<Collapse in={true}>
									<div className="comment-thread">
										{displayedComments.map((comment, index) => (
											<div key={comment.id} className={`comment-item ${index === displayedComments.length - 1 ? "mb-0" : "mb-2"} d-flex gap-2`}>
												<Image
													src={comment.author?.photoURL || "https://i.pravatar.cc/150?img=10"}
													alt="avatar"
													roundedCircle
													width="32"
													height="32"
													style={{ objectFit: "cover", minWidth: "32px", minHeight: "32px" }}
												/>
												<div className="flex-grow-1">
													<div className="d-flex align-items-center gap-1 mb-1">
														<span
															className="fw-bold small"
															style={{ cursor: "pointer" }}
															onClick={() => {
																if (comment.author?.username) {
																	navigate(`/${comment.author.username}`);
																}
															}}
														>
															{comment.author?.name || 'Unknown User'}
														</span>
														{comment.author?.hasBlueCheck && (
															<CheckCircleFill className="text-primary" size={12} />
														)}
														<span className="text-muted small">·</span>
														<span className="text-muted small">
															{formatTimeAgo(comment.createdAt)}
														</span>
													</div>
													<div className="small">
														{parseTextContent(comment.content, {
															onHashtagClick: handleHashtagClick,
															onMentionClick: handleMentionClick,
															onLinkClick: handleLinkClick,
														})}
													</div>
												</div>
											</div>
										))}

										{/* Show more/less button */}
										{hasMoreComments && (
											<div className="text-center mt-2">
												<Button
													variant="link"
													size="sm"
													className="text-muted p-1"
													onClick={() => setShowAllComments(!showAllComments)}
												>
													{showAllComments ? (
														<>
															<ChevronUp size={16} className="me-1" />
															Show less
														</>
													) : (
														<>
															<ChevronDown size={16} className="me-1" />
															Show {comments.length - maxComments} more comments
														</>
													)}
												</Button>
											</div>
										)}

										{/* View full post button */}
										<div className="text-center mt-2">
											<Button
												variant="link"
												size="sm"
												className="text-primary p-1"
												onClick={() => navigate(`/post/${post.id}`)}
											>
												View full conversation
											</Button>
										</div>
									</div>
								</Collapse>
							</div>
						)}
					</div>
				</div>
			</Card.Body>
		</Card>
	);
};

export default ThreadedPost;


/** @format */

import { useState, useEffect } from "react";
import { useParams, useLoaderData, useNavigate } from "react-router-dom";
import { Container, Image, Button, Card, Form, Spinner, Alert } from "react-bootstrap";
import { Heart, HeartFill, ChatDots, Share, ArrowLeft } from "react-bootstrap-icons";

import { postAPI, commentAPI } from "../config/ApiConfig";

const PostDetailPage = () => {
	const { postId } = useParams();
	const loaderData = useLoaderData() || {};
	const { user } = loaderData;
	const navigate = useNavigate();
	const [post, setPost] = useState(null);
	const [comments, setComments] = useState([]);
	const [newComment, setNewComment] = useState("");
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		loadPostAndComments();
	}, [postId]);

	const loadPostAndComments = async () => {
		try {
			setLoading(true);
			const [postResponse, commentsResponse] = await Promise.all([
				postAPI.getPost(postId),
				commentAPI.getComments(postId)
			]);
			
			setPost(postResponse);
			setComments(commentsResponse.comments || []);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleLikePost = async () => {
		try {
			await postAPI.likePost(postId);
			setPost(prev => {
				if (!prev) return prev;
				const isLiked = (prev.likes || []).some(like => like.userId === user.uid);
				return {
					...prev,
					likes: isLiked
						? prev.likes.filter(like => like.userId !== user.uid)
						: [...(prev.likes || []), { userId: user.uid }],
					_count: {
						...prev._count,
						likes: isLiked ? (prev._count?.likes || 1) - 1 : (prev._count?.likes || 0) + 1
					}
				};
			});
		} catch (err) {
			console.error('Error liking post:', err);
		}
	};

	const handleSubmitComment = async (e) => {
		e.preventDefault();
		if (!newComment.trim()) return;

		try {
			setSubmitting(true);
			const response = await commentAPI.createComment(postId, {
				content: newComment
			});

			setComments(prev => [...prev, response]);
			setNewComment("");
			
			// Update post comment count
			setPost(prev => ({
				...prev,
				_count: {
					...prev._count,
					comments: (prev._count?.comments || 0) + 1
				}
			}));
		} catch (err) {
			setError(err.message);
		} finally {
			setSubmitting(false);
		}
	};

	const formatTimeAgo = (dateString) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now - date;
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'now';
		if (diffMins < 60) return `${diffMins}m`;
		if (diffHours < 24) return `${diffHours}h`;
		return `${diffDays}d`;
	};

	if (loading) {
		return (
			<Container className="text-center py-5">
				<Spinner animation="border" />
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
			<div className="d-flex align-items-center gap-3 p-3 border-bottom bg-white sticky-top">
				<Button
					variant="link"
					size="sm"
					className="text-dark p-0"
					onClick={() => navigate(-1)}>
					<ArrowLeft size={20} />
				</Button>
				<h5 className="mb-0">Post</h5>
			</div>

			{/* Post */}
			<Card className="border-0 border-bottom rounded-0">
				<Card.Body className="px-3 py-3">
					<div className="d-flex gap-3">
						<Image
							src={post.author.photoURL || "https://i.pravatar.cc/150?img=10"}
							alt="avatar"
							roundedCircle
							width="50"
							height="50"
						/>
						<div className="flex-grow-1">
							<div className="d-flex align-items-center gap-1">
								<span className="fw-bold">{post.author.name}</span>
								{post.author.hasBlueCheck && (
									<span className="text-primary">✓</span>
								)}
								<span className="text-muted">@{post.author.username}</span>
								<span className="text-muted">·</span>
								<span className="text-muted small">{formatTimeAgo(post.createdAt)}</span>
							</div>

							{post.content && (
								<p className="mb-3 mt-2 fs-5">{post.content}</p>
							)}

							{post.imageUrls && post.imageUrls.length > 0 && (
								<div className="mb-3">
									{post.imageUrls.map((url, idx) => (
										<Image
											key={idx}
											src={url}
											className="rounded mb-2 w-100"
											style={{ maxHeight: "500px", objectFit: "cover" }}
										/>
									))}
								</div>
							)}

							<div className="d-flex justify-content-between text-muted mt-3 py-2 border-top">
								<Button
									variant="link"
									size="sm"
									className="text-muted p-0 border-0 d-flex align-items-center gap-1">
									<ChatDots size={18} />
									<span>{post._count?.comments || 0}</span>
								</Button>

								<Button
									variant="link"
									size="sm"
									className="p-0 border-0 d-flex align-items-center gap-1"
									style={{ 
										color: (post.likes || []).some(like => like.userId === user.uid) ? '#dc3545' : '#6c757d'
									}}
									onClick={handleLikePost}>
									{(post.likes || []).some(like => like.userId === user.uid) ? (
										<HeartFill size={18} />
									) : (
										<Heart size={18} />
									)}
									<span>{post._count?.likes || 0}</span>
								</Button>

								<Button
									variant="link"
									size="sm"
									className="text-muted p-0 border-0">
									<Share size={18} />
								</Button>
							</div>
						</div>
					</div>
				</Card.Body>
			</Card>

			{/* Comment Form */}
			<Card className="border-0 border-bottom rounded-0">
				<Card.Body className="px-3 py-3">
					<Form onSubmit={handleSubmitComment}>
						<div className="d-flex gap-3">
							<Image
								src={user?.photoURL || "https://i.pravatar.cc/150?img=10"}
								alt="avatar"
								roundedCircle
								width="40"
								height="40"
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
										className="rounded-pill px-3">
										{submitting ? <Spinner size="sm" animation="border" /> : "Reply"}
									</Button>
								</div>
							</div>
						</div>
					</Form>
				</Card.Body>
			</Card>

			{/* Comments */}
			{comments.length === 0 ? (
				<div className="text-center py-5 text-muted">
					<p>No comments yet</p>
				</div>
			) : (
				comments.map((comment) => (
					<Card key={comment.id} className="border-0 border-bottom rounded-0">
						<Card.Body className="px-3 py-3">
							<div className="d-flex gap-3">
								<Image
									src={comment.author.photoURL || "https://i.pravatar.cc/150?img=10"}
									alt="avatar"
									roundedCircle
									width="40"
									height="40"
								/>
								<div className="flex-grow-1">
									<div className="d-flex align-items-center gap-1">
										<span className="fw-bold">{comment.author.name}</span>
										{comment.author.hasBlueCheck && (
											<span className="text-primary">✓</span>
										)}
										<span className="text-muted">@{comment.author.username}</span>
										<span className="text-muted">·</span>
										<span className="text-muted small">{formatTimeAgo(comment.createdAt)}</span>
									</div>

									<p className="mb-2 mt-1">{comment.content}</p>

									<div className="d-flex gap-4 text-muted">
										<Button
											variant="link"
											size="sm"
											className="text-muted p-0 border-0 d-flex align-items-center gap-1">
											<ChatDots size={14} />
										</Button>

										<Button
											variant="link"
											size="sm"
											className="text-muted p-0 border-0 d-flex align-items-center gap-1">
											<Heart size={14} />
										</Button>
									</div>
								</div>
							</div>
						</Card.Body>
					</Card>
				))
			)}
		</Container>
	);
};

export default PostDetailPage;

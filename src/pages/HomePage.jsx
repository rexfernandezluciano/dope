
/** @format */

import { useState, useRef, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import { Container, Image, Modal, Form, Button, Dropdown, InputGroup, Card, Spinner, Alert } from "react-bootstrap";
import { Globe, People, Lock, Camera, EmojiSmile, CameraVideo, X, Search, Heart, HeartFill, ChatDots, Share } from "react-bootstrap-icons";

import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";

import { postAPI, commentAPI } from "../config/ApiConfig";

const HomePage = () => {
	const [showComposerModal, setShowComposerModal] = useState(false);
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
	const textareaRef = useRef(null);
	const fileInputRef = useRef(null);

	const { user } = useLoaderData();

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
				setPosts(prev => [...prev, ...response.posts]);
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

	const handleInput = e => {
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

	const handleFileChange = e => {
		const files = Array.from(e.target.files);
		if (files.length) {
			setPhotos(prev => [...(prev || []), ...files]);
		}
	};

	const handleRemovePhoto = index => {
		setPhotos(prev => prev.filter((_, i) => i !== index));
	};

	const handleStickerClick = () => {
		setShowStickerModal(true);
	};

	const handleSelectGif = gif => {
		const imageUrl = gif.images.fixed_height.url;
		setPhotos(prev => [...(prev || []), imageUrl]);
		setShowStickerModal(false);
	};

	const handleCreatePost = async () => {
		if (!postText.trim() && (!photos || photos.length === 0)) {
			return;
		}

		try {
			setSubmitting(true);
			const imageUrls = photos ? photos.filter(p => typeof p === 'string') : [];
			
			await postAPI.createPost({
				content: postText.trim(),
				imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
				postType: "text"
			});

			setPostText("");
			setPhotos(null);
			setShowComposerModal(false);
			loadPosts(); // Reload posts
		} catch (err) {
			setError(err.message);
		} finally {
			setSubmitting(false);
		}
	};

	const handleLikePost = async (postId) => {
		try {
			await postAPI.likePost(postId);
			// Update posts state to reflect like change
			setPosts(prev => prev.map(post => {
				if (post.id === postId) {
					const isLiked = post.likes.some(like => like.userId === user.uid);
					return {
						...post,
						likes: isLiked 
							? post.likes.filter(like => like.userId !== user.uid)
							: [...post.likes, { userId: user.uid }],
						_count: {
							...post._count,
							likes: isLiked ? post._count.likes - 1 : post._count.likes + 1
						}
					};
				}
				return post;
			}));
		} catch (err) {
			console.error('Error liking post:', err);
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

	const privacyOptions = {
		Public: <Globe size={14} className="me-1" />,
		Followers: <People size={14} className="me-1" />,
		"Only Me": <Lock size={14} className="me-1" />,
	};

	const gf = new GiphyFetch("BXvRq8D03IHvybiQ6Fjls2pkPJLXjx9x");
	const fetchGifs = offset => (searchTerm ? gf.search(searchTerm, { offset, limit: 12 }) : gf.trending({ offset, limit: 12 }));

	const handleSearchChange = e => {
		setSearchTerm(e.target.value);
	};

	return (
		<>
			<div className="mt-2">
				<div
					className="d-flex align-items-center gap-2 pb-2 px-3 border-bottom"
					onClick={() => setShowComposerModal(true)}
					style={{ cursor: "pointer" }}>
					<Image
						src={user?.photoURL ?? "https://i.pravatar.cc/150?img=10"}
						alt="avatar"
						roundedCircle
						width="35"
						height="35"
					/>
					<div className="d-grid">
						<span className="fw-bold small">{user?.name}</span>
						<span className="text-muted">What's on your mind?</span>
					</div>
				</div>
			</div>

			<Container className="px-0 px-md-3">
				{error && (
					<Alert variant="danger" dismissible onClose={() => setError("")} className="mx-3 mt-3">
						{error}
					</Alert>
				)}

				{loading && posts.length === 0 ? (
					<div className="text-center py-5">
						<Spinner animation="border" />
					</div>
				) : (
					<>
						{posts.map((post) => (
							<Card key={post.id} className="border-0 border-bottom rounded-0 mb-0">
								<Card.Body className="px-3">
									<div className="d-flex gap-2">
										<Image
											src={post.author.photoURL || "https://i.pravatar.cc/150?img=10"}
											alt="avatar"
											roundedCircle
											width="40"
											height="40"
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
												<p className="mb-2">{post.content}</p>
											)}

											{post.imageUrls && post.imageUrls.length > 0 && (
												<div className="mb-2">
													{post.imageUrls.map((url, idx) => (
														<Image
															key={idx}
															src={url}
															className="rounded mb-2 w-100"
															style={{ maxHeight: "400px", objectFit: "cover" }}
														/>
													))}
												</div>
											)}

											<div className="d-flex justify-content-between text-muted mt-2">
												<Button
													variant="link"
													size="sm"
													className="text-muted p-0 border-0 d-flex align-items-center gap-1">
													<ChatDots size={16} />
													<span className="small">{post._count.comments}</span>
												</Button>
												
												<Button
													variant="link"
													size="sm"
													className={`p-0 border-0 d-flex align-items-center gap-1 ${
														post.likes.some(like => like.userId === user.uid) 
															? 'text-danger' 
															: 'text-muted'
													}`}
													onClick={() => handleLikePost(post.id)}>
													{post.likes.some(like => like.userId === user.uid) ? (
														<HeartFill size={16} />
													) : (
														<Heart size={16} />
													)}
													<span className="small">{post._count.likes}</span>
												</Button>
												
												<Button
													variant="link"
													size="sm"
													className="text-muted p-0 border-0">
													<Share size={16} />
												</Button>
											</div>
										</div>
									</div>
								</Card.Body>
							</Card>
						))}

						{hasMore && (
							<div className="text-center py-3">
								<Button
									variant="outline-primary"
									onClick={() => loadPosts(nextCursor)}
									disabled={loading}>
									{loading ? <Spinner size="sm" animation="border" /> : "Load More"}
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
					centered>
					<Modal.Header closeButton>
						<Modal.Title>Create Post</Modal.Title>
					</Modal.Header>

					<Modal.Body className="overflow-x-hidden">
						<div className="d-flex gap-2">
							<Image
								src={user?.photoURL ?? "https://i.pravatar.cc/150?img=10"}
								alt="avatar"
								roundedCircle
								width="35"
								height="35"
							/>

							<div className="flex-grow-1">
								<div className="mb-1">
									<span className="fw-bold small">{user?.name}</span>
									<Dropdown onSelect={value => setPrivacy(value)} align="end">
										<Dropdown.Toggle
											variant="light"
											size="sm"
											className="border rounded-pill px-2 py-0 d-flex align-items-center"
											style={{
												fontSize: "0.75rem",
												backgroundColor: "#f0f2f5",
											}}>
											{privacyOptions[privacy]} {privacy}
										</Dropdown.Toggle>

										<Dropdown.Menu>
											{Object.keys(privacyOptions).map(opt => (
												<Dropdown.Item key={opt} eventKey={opt}>
													{privacyOptions[opt]} {opt}
												</Dropdown.Item>
											))}
										</Dropdown.Menu>
									</Dropdown>
								</div>
							</div>
						</div>

						<Form.Control
							as="textarea"
							ref={textareaRef}
							value={postText}
							onInput={handleInput}
							placeholder="What's on your mind?"
							className="px-0 border-0 rounded-0 shadow-none"
							rows={1}
							style={{ overflow: "hidden", resize: "none" }}
						/>

						{photos?.length > 0 && (
							<div className="d-flex align-items-center gap-2 overflow-x-auto mt-2">
								{photos.map((file, idx) => {
									const url = typeof file === "string" ? file : URL.createObjectURL(file);
									return (
										<div key={idx} className="position-relative" style={{ display: "inline-block" }}>
											<Image
												src={url}
												width={200}
												height={200}
												className="rounded-3 border bg-light"
												style={{ objectFit: "cover" }}
											/>
											<Button
												variant="danger"
												size="sm"
												onClick={() => handleRemovePhoto(idx)}
												className="position-absolute top-0 end-0 m-1 p-0 rounded-circle"
												style={{ width: "24px", height: "24px", lineHeight: "20px" }}>
												<X size={20} />
											</Button>
										</div>
									);
								})}
							</div>
						)}

						<input
							type="file"
							ref={fileInputRef}
							onChange={handleFileChange}
							accept="image/*"
							multiple
							style={{ display: "none" }}
						/>

						<div className="d-flex align-items-center gap-3 pt-3 mt-2 border-top flex-nowrap pe-2 overflow-auto"
							style={{ fontSize: "0.85rem", WebkitOverflowScrolling: "touch" }}>
							<Button
								variant="light"
								size="sm"
								className="d-flex align-items-center gap-1 border-0 flex-shrink-0"
								onClick={handlePhotoClick}>
								<Camera size={18} className="text-success" />
								Photos
							</Button>
							<Button
								variant="light"
								size="sm"
								className="d-flex align-items-center gap-1 border-0 flex-shrink-0"
								onClick={handleStickerClick}>
								<EmojiSmile size={18} className="text-warning" />
								Stickers
							</Button>
						</div>
					</Modal.Body>

					<Modal.Footer>
						<Button
							className="w-100"
							onClick={handleCreatePost}
							disabled={submitting || (!postText.trim() && (!photos || photos.length === 0))}>
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
					centered>
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
		</>
	);
};

export default HomePage;

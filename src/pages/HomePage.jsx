/** @format */

import { useState, useRef } from "react";
import { useLoaderData } from "react-router-dom";
import { Container, Image, Modal, Form, Button, Dropdown, InputGroup } from "react-bootstrap";
import { Globe, People, Lock, Camera, EmojiSmile, CameraVideo, X, Search } from "react-bootstrap-icons";

import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";

const HomePage = () => {
	const [showComposerModal, setShowComposerModal] = useState(false);
	const [postText, setPostText] = useState("");
	const [privacy, setPrivacy] = useState("Public");
	const [showStickerModal, setShowStickerModal] = useState(false);
	const [photos, setPhotos] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const textareaRef = useRef(null);
	const fileInputRef = useRef(null);

	const { user } = useLoaderData();

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
		// Turn gif into File-like object for photos state
		const imageUrl = gif.images.fixed_height.url;
		setPhotos(prev => [...(prev || []), imageUrl]); // Save URL directly
		setShowStickerModal(false);
	};

	const handleLiveClick = () => {
		alert("Going live! (Placeholder functionality)");
	};

	const privacyOptions = {
		Public: (
			<Globe
				size={14}
				className="me-1"
			/>
		),
		Followers: (
			<People
				size={14}
				className="me-1"
			/>
		),
		"Only Me": (
			<Lock
				size={14}
				className="me-1"
			/>
		),
	};

	// Giphy API
	const gf = new GiphyFetch("BXvRq8D03IHvybiQ6Fjls2pkPJLXjx9x");
	const fetchGifs = offset => (searchTerm ? gf.search(searchTerm, { offset, limit: 12 }) : gf.trending({ offset, limit: 12 }));

	// Handle search
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
						<span className="fw-bold small">{user?.username}</span>
						<span className="text-muted">What's on your mind?</span>
					</div>
				</div>
			</div>

			<Container>
				<p className="mt-3">Content will show here.</p>
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
									<span className="fw-bold small">{user?.username}</span>
									<Dropdown
										onSelect={value => setPrivacy(value)}
										align="end">
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
												<Dropdown.Item
													key={opt}
													eventKey={opt}>
													{privacyOptions[opt]} {opt}
												</Dropdown.Item>
											))}
										</Dropdown.Menu>
									</Dropdown>
								</div>
							</div>
						</div>

						{/* Text area */}
						<Form.Control
							as="textarea"
							ref={textareaRef}
							value={postText}
							onInput={handleInput}
							placeholder="What's on your mind?"
							className="px-0 border-0 rounded-0 shadow-none"
							rows={1}
							style={{
								overflow: "hidden",
								resize: "none",
							}}
						/>

						{/* Selected media */}
						{photos?.length > 0 && (
							<div className="d-flex align-items-center gap-2 overflow-x-auto mt-2">
								{photos.map((file, idx) => {
									const url = typeof file === "string" ? file : URL.createObjectURL(file);
									return (
										<div
											key={idx}
											className="position-relative"
											style={{ display: "inline-block" }}>
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
												style={{
													width: "24px",
													height: "24px",
													lineHeight: "20px",
												}}>
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

						{/* Media Buttons */}
						<div
							className="d-flex align-items-center gap-3 pt-3 mt-2 border-top flex-nowrap pe-2 overflow-auto"
							style={{
								fontSize: "0.85rem",
								WebkitOverflowScrolling: "touch",
							}}>
							<Button
								variant="light"
								size="sm"
								className="d-flex align-items-center gap-1 border-0 flex-shrink-0"
								onClick={handlePhotoClick}>
								<Camera
									size={18}
									className="text-success"
								/>
								Photos
							</Button>
							<Button
								variant="light"
								size="sm"
								className="d-flex align-items-center gap-1 border-0 flex-shrink-0"
								onClick={handleStickerClick}>
								<EmojiSmile
									size={18}
									className="text-warning"
								/>
								Stickers
							</Button>
							<Button
								variant="light"
								size="sm"
								className="d-flex align-items-center gap-1 border-0 flex-shrink-0"
								onClick={handleLiveClick}>
								<CameraVideo
									size={18}
									className="text-danger"
								/>
								Live
							</Button>
						</div>
					</Modal.Body>

					<Modal.Footer>
						<Button
							className="w-100"
							onClick={() => setShowComposerModal(false)}>
							Post
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
						{/* Search bar */}
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

						{/* Giphy grid */}
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


/** @format */

import { useState, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import { Container, Card, Form, Button, Alert, Row, Col } from "react-bootstrap";
import { Person, Camera } from "react-bootstrap-icons";

import { userAPI } from "../../config/ApiConfig";

const ProfileSettingsPage = () => {
	const loaderData = useLoaderData() || {};
	const { user } = loaderData;
	const [settings, setSettings] = useState({
		name: "",
		bio: "",
		photoURL: "",
		birthday: "",
		gender: ""
	});
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState("success");
	const [profileImagePreview, setProfileImagePreview] = useState("");
	const [uploadingProfileImage, setUploadingProfileImage] = useState(false);

	useEffect(() => {
		if (user) {
			setSettings({
				name: user.name || "",
				bio: user.bio || "",
				photoURL: user.photoURL || "",
				birthday: user.birthday || "",
				gender: user.gender || ""
			});
		}
	}, [user]);

	if (!user) {
		return (
			<Container className="text-center py-5">
				<div>Loading...</div>
			</Container>
		);
	}

	const checkNameChangeLimit = (lastChange) => {
		if (!lastChange) return false;
		const fourteenDaysAgo = new Date();
		fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
		return new Date(lastChange) > fourteenDaysAgo;
	};

	const uploadProfileImageToCloudinary = async (file) => {
		// Handle HEIC files
		let finalFile = file;
		if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
			try {
				const heic2any = (await import("heic2any")).default;
				const blob = await heic2any({ blob: file, toType: "image/jpeg" });
				finalFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" });
			} catch (err) {
				console.error("Error converting HEIC:", err);
				throw new Error("Failed to convert HEIC image");
			}
		}

		// Validate file size (5MB limit)
		if (finalFile.size > 5 * 1024 * 1024) {
			throw new Error("Image size must be less than 5MB");
		}

		const formData = new FormData();
		formData.append("file", finalFile);
		formData.append("upload_preset", "dope-network");
		formData.append("folder", "profile_pictures");

		try {
			console.log("Uploading image to Cloudinary...", finalFile.name);
			const response = await fetch(
				"https://api.cloudinary.com/v1_1/zxpic/image/upload",
				{
					method: "POST",
					body: formData,
				},
			);
			
			if (!response.ok) {
				throw new Error(`Cloudinary upload failed: ${response.status} ${response.statusText}`);
			}
			
			const data = await response.json();
			console.log("Cloudinary upload successful:", data.secure_url);
			
			if (!data.secure_url) {
				throw new Error("No secure URL returned from Cloudinary");
			}
			
			return data.secure_url;
		} catch (error) {
			console.error("Error uploading to Cloudinary:", error);
			throw new Error(`Failed to upload image: ${error.message}`);
		}
	};

	const handleSaveSettings = async () => {
		try {
			setLoading(true);
			setUploadingProfileImage(true);
			let updateData = { ...settings };

			// Check name change limit
			if (settings.name !== user.name && checkNameChangeLimit(user.lastNameChange)) {
				const daysLeft = Math.ceil((new Date(user.lastNameChange).getTime() + (14 * 24 * 60 * 60 * 1000) - Date.now()) / (24 * 60 * 60 * 1000));
				setMessage(`You can only change your name once every 14 days. Please wait ${daysLeft} more days.`);
				setMessageType("warning");
				setLoading(false);
				setUploadingProfileImage(false);
				return;
			}

			// Add timestamp if name was changed
			if (settings.name !== user.name) {
				updateData.lastNameChange = new Date().toISOString();
			}

			// Upload profile image if a new file was selected
			if (settings.profileImageFile) {
				try {
					const uploadedUrl = await uploadProfileImageToCloudinary(settings.profileImageFile);
					updateData.photoURL = uploadedUrl;
					// Remove the file from update data
					delete updateData.profileImageFile;
				} catch (uploadError) {
					setMessage(`Image upload failed: ${uploadError.message}`);
					setMessageType("danger");
					setLoading(false);
					setUploadingProfileImage(false);
					return;
				}
			}

			await userAPI.updateUser(user.username, updateData);
			setMessage("Profile updated successfully!");
			setMessageType("success");
			setProfileImagePreview("");
		} catch (err) {
			console.error('Error updating profile:', err);
			setMessage(err.message || 'Failed to update profile');
			setMessageType("danger");
		} finally {
			setLoading(false);
			setUploadingProfileImage(false);
		}
	};

	const handleProfileImageUpload = (e) => {
		const file = e.target.files[0];
		if (file) {
			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				setProfileImagePreview(e.target.result);
			};
			reader.readAsDataURL(file);

			// Store file for later upload
			setSettings((prev) => ({ ...prev, profileImageFile: file }));
		}
	};

	return (
		<div className="py-3">
			{message && (
				<Alert
					variant={messageType}
					dismissible
					onClose={() => setMessage("")}
					className="mb-4">
					{message}
				</Alert>
			)}

			{/* Profile Settings */}
			<Card className="mb-4">
				<Card.Header className="d-flex align-items-center gap-2">
					<Person size={20} />
					<h5 className="mb-0">Profile Information</h5>
				</Card.Header>
				<Card.Body>
					<Form>
						<Row>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label>Display Name</Form.Label>
									<Form.Control
										type="text"
										value={settings.name}
										onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
										placeholder="Your display name"
									/>
									<Form.Text className="text-muted">
										You can change your display name once every 14 days
									</Form.Text>
								</Form.Group>
							</Col>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label>Profile Picture</Form.Label>
									<div className="d-flex flex-column align-items-center gap-3">
										<div className="position-relative">
											<img
												src={profileImagePreview || settings.photoURL || "https://i.pravatar.cc/150?img=10"}
												alt="Profile Preview"
												className="rounded-circle"
												width={80}
												height={80}
												style={{ objectFit: "cover", cursor: "pointer" }}
												onClick={() => document.getElementById("profile-upload").click()}
											/>
											<Button
												variant="primary"
												size="sm"
												className="position-absolute bottom-0 end-0 rounded-circle p-1"
												style={{ width: "25px", height: "25px", fontSize: "12px" }}
												onClick={() => document.getElementById("profile-upload").click()}
											>
												<Camera size={12} />
											</Button>
										</div>
										<Button
											variant="outline-primary"
											size="sm"
											onClick={() => document.getElementById("profile-upload").click()}
										>
											Change Photo
										</Button>
									</div>
									<input
										id="profile-upload"
										type="file"
										accept="image/*,.heic"
										onChange={handleProfileImageUpload}
										style={{ display: "none" }}
									/>
								</Form.Group>
							</Col>
						</Row>

						<Form.Group className="mb-3">
							<Form.Label>Bio</Form.Label>
							<Form.Control
								as="textarea"
								rows={3}
								value={settings.bio}
								onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
								placeholder="Tell us about yourself"
								maxLength={160}
							/>
							<Form.Text className="text-muted">
								{settings.bio.length}/160 characters
							</Form.Text>
						</Form.Group>

						<Row>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label>Birthday</Form.Label>
									<Form.Control
										type="date"
										value={settings.birthday}
										onChange={(e) => setSettings(prev => ({ ...prev, birthday: e.target.value }))}
										max={new Date().toISOString().split('T')[0]}
									/>
									<Form.Text className="text-muted">
										Your birthday information
									</Form.Text>
								</Form.Group>
							</Col>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label>Gender</Form.Label>
									<Form.Select
										value={settings.gender}
										onChange={(e) => setSettings(prev => ({ ...prev, gender: e.target.value }))}
									>
										<option value="">Select Gender</option>
										<option value="male">Male</option>
										<option value="female">Female</option>
										<option value="non_binary">Non-binary</option>
										<option value="prefer_not_to_say">Prefer not to say</option>
									</Form.Select>
									<Form.Text className="text-muted">
										Your gender identity
									</Form.Text>
								</Form.Group>
							</Col>
						</Row>
					</Form>
				</Card.Body>
			</Card>

			{/* Save Button */}
			<div className="d-grid">
				<Button
					variant="primary"
					size="md"
					onClick={handleSaveSettings}
					disabled={loading || uploadingProfileImage}>
					{uploadingProfileImage ? "Uploading..." : loading ? "Saving..." : "Save Profile"}
				</Button>
			</div>
		</div>
	);
};

export default ProfileSettingsPage;

/** @format */

import { useState, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { Eye, Globe, People, Lock, Shield } from "react-bootstrap-icons";

import { userAPI } from "../../config/ApiConfig";

const PrivacySettingsPage = () => {
	const loaderData = useLoaderData() || {};
	const { user } = loaderData;
	const [settings, setSettings] = useState({
		privacy: {
			profile: "public",
			comments: "public",
			sharing: true,
			chat: "public",
		},
	});
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState("success");

	useEffect(() => {
		if (user) {
			setSettings({
				privacy: user.privacy || {
					profile: "public",
					comments: "public",
					sharing: true,
					chat: "public",
				},
				isProfilePrivate: user.isProfilePrivate || false,
				allowFollowRequests: user.allowFollowRequests !== false,
				showOnlineStatus: user.showOnlineStatus !== false,
				allowDirectMessages: user.allowDirectMessages !== false,
				allowTagging: user.allowTagging !== false,
				showBirthday: user.showBirthday || false,
				federatedDiscoverable: user.federatedDiscoverable || false,
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

	const handleSaveSettings = async () => {
		try {
			setLoading(true);
			await userAPI.updateUser(user.username, settings);
			setMessage("Privacy settings updated successfully!");
			setMessageType("success");
		} catch (err) {
			console.error("Error updating privacy settings:", err);
			setMessage(err.message || "Failed to update privacy settings");
			setMessageType("danger");
		} finally {
			setLoading(false);
		}
	};

	const privacyOptions = [
		{ value: "public", label: "Public", icon: <Globe size={16} /> },
		{ value: "followers", label: "Followers only", icon: <People size={16} /> },
		{ value: "private", label: "Private", icon: <Lock size={16} /> },
	];

	return (
		<div className="py-3">
			{message && (
				<Alert
					variant={messageType}
					dismissible
					onClose={() => setMessage("")}
					className="mb-4"
				>
					{message}
				</Alert>
			)}

			{/* Privacy Settings */}
			<Card className="mb-4">
				<Card.Header className="d-flex align-items-center gap-2">
					<Eye size={20} />
					<h5 className="mb-0">Privacy & Visibility</h5>
				</Card.Header>
				<Card.Body>
					<Form>
						<Form.Group className="mb-4">
							<Form.Label className="fw-bold">Profile Visibility</Form.Label>
							<Form.Select
								value={settings.privacy.profile}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										privacy: { ...prev.privacy, profile: e.target.value },
									}))
								}
							>
								{privacyOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Form.Select>
							<Form.Text className="text-muted">
								Who can see your profile and posts
							</Form.Text>
						</Form.Group>

						<Form.Group className="mb-4">
							<Form.Label className="fw-bold">Comment Visibility</Form.Label>
							<Form.Select
								value={settings.privacy.comments}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										privacy: { ...prev.privacy, comments: e.target.value },
									}))
								}
							>
								{privacyOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Form.Select>
							<Form.Text className="text-muted">
								Who can comment on your posts
							</Form.Text>
						</Form.Group>

						<Form.Group className="mb-4">
							<Form.Label className="fw-bold">Direct Messages</Form.Label>
							<Form.Select
								value={settings.privacy.chat}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										privacy: { ...prev.privacy, chat: e.target.value },
									}))
								}
							>
								{privacyOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Form.Select>
							<Form.Text className="text-muted">
								Who can send you direct messages
							</Form.Text>
						</Form.Group>

						<Form.Group className="mb-4">
							<Form.Check
								type="checkbox"
								label="Allow others to share your posts"
								checked={settings.privacy.sharing}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										privacy: { ...prev.privacy, sharing: e.target.checked },
									}))
								}
							/>
							<Form.Text className="text-muted d-block">
								When enabled, other users can repost your content
							</Form.Text>
						</Form.Group>

						{/* Federated Discovery */}
						<Form.Group className="mb-4">
							<Form.Label className="fw-bold">Federated Discovery</Form.Label>
							<Form.Check
								type="switch"
								id="federatedDiscoverable"
								label="Federated Discovery (Fediverse/ActivityPub)"
								checked={settings.federatedDiscoverable}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										federatedDiscoverable: e.target.checked,
									}))
								}
								className="mb-3"
							/>
							<Form.Text className="text-muted d-block mb-3">
								Allow your profile to be discoverable from other
								ActivityPub/Fediverse platforms like Mastodon, Pleroma, and
								others. When enabled, your profile can be found using webfinger
								lookups.
							</Form.Text>
						</Form.Group>
					</Form>
				</Card.Body>
			</Card>

			{/* Save Button */}
			<div className="d-grid">
				<Button
					variant="primary"
					size="md"
					onClick={handleSaveSettings}
					disabled={loading}
				>
					{loading ? "Saving..." : "Save Privacy Settings"}
				</Button>
			</div>
			{/* <!-- banner_ad --> */}
			<ins
				class="adsbygoogle"
				style="display:block"
				data-ad-client="ca-pub-1106169546112879"
				data-ad-slot="2596463814"
				data-ad-format="auto"
				data-full-width-responsive="true"
			></ins>
			<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
		</div>
	);
};

export default PrivacySettingsPage;


/** @format */

import { useState, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { Bell } from "react-bootstrap-icons";

import { userAPI } from "../../config/ApiConfig.js";

const NotificationSettingsPage = () => {
	const loaderData = useLoaderData() || {};
	const { user } = loaderData;
	const [settings, setSettings] = useState({
		notifications: {
			likes: true,
			comments: true,
			follows: true,
			mentions: true,
			reposts: true,
			email: false,
			push: true
		}
	});
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState("success");

	useEffect(() => {
		if (user) {
			setSettings({
				notifications: user.notifications || {
					likes: true,
					comments: true,
					follows: true,
					mentions: true,
					reposts: true,
					email: false,
					push: true
				}
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
			setMessage("Notification settings updated successfully!");
			setMessageType("success");
		} catch (err) {
			console.error('Error updating notification settings:', err);
			setMessage(err.message || 'Failed to update notification settings');
			setMessageType("danger");
		} finally {
			setLoading(false);
		}
	};

	const handleNotificationChange = (key, value) => {
		setSettings(prev => ({
			...prev,
			notifications: {
				...prev.notifications,
				[key]: value
			}
		}));
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

			{/* Notification Preferences */}
			<Card className="mb-4">
				<Card.Header className="d-flex align-items-center gap-2">
					<Bell size={20} />
					<h5 className="mb-0">Notification Preferences</h5>
				</Card.Header>
				<Card.Body>
					<Form>
						<div className="mb-4">
							<h6 className="mb-3">Activity Notifications</h6>
							
							<Form.Group className="mb-3">
								<Form.Check
									type="checkbox"
									label="Likes on your posts"
									checked={settings.notifications.likes}
									onChange={(e) => handleNotificationChange('likes', e.target.checked)}
								/>
								<Form.Text className="text-muted d-block ms-4">
									Get notified when someone likes your posts
								</Form.Text>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Check
									type="checkbox"
									label="Comments on your posts"
									checked={settings.notifications.comments}
									onChange={(e) => handleNotificationChange('comments', e.target.checked)}
								/>
								<Form.Text className="text-muted d-block ms-4">
									Get notified when someone comments on your posts
								</Form.Text>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Check
									type="checkbox"
									label="New followers"
									checked={settings.notifications.follows}
									onChange={(e) => handleNotificationChange('follows', e.target.checked)}
								/>
								<Form.Text className="text-muted d-block ms-4">
									Get notified when someone follows you
								</Form.Text>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Check
									type="checkbox"
									label="Mentions"
									checked={settings.notifications.mentions}
									onChange={(e) => handleNotificationChange('mentions', e.target.checked)}
								/>
								<Form.Text className="text-muted d-block ms-4">
									Get notified when someone mentions you
								</Form.Text>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Check
									type="checkbox"
									label="Reposts of your content"
									checked={settings.notifications.reposts}
									onChange={(e) => handleNotificationChange('reposts', e.target.checked)}
								/>
								<Form.Text className="text-muted d-block ms-4">
									Get notified when someone reposts your content
								</Form.Text>
							</Form.Group>
						</div>

						<hr />

						<div className="mb-4">
							<h6 className="mb-3">Delivery Methods</h6>
							
							<Form.Group className="mb-3">
								<Form.Check
									type="checkbox"
									label="Push notifications"
									checked={settings.notifications.push}
									onChange={(e) => handleNotificationChange('push', e.target.checked)}
								/>
								<Form.Text className="text-muted d-block ms-4">
									Receive notifications on your device
								</Form.Text>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Check
									type="checkbox"
									label="Email notifications"
									checked={settings.notifications.email}
									onChange={(e) => handleNotificationChange('email', e.target.checked)}
								/>
								<Form.Text className="text-muted d-block ms-4">
									Receive notifications via email
								</Form.Text>
							</Form.Group>
						</div>
					</Form>
				</Card.Body>
			</Card>

			{/* Save Button */}
			<div className="d-grid">
				<Button
					variant="primary"
					size="md"
					onClick={handleSaveSettings}
					disabled={loading}>
					{loading ? "Saving..." : "Save Notification Settings"}
				</Button>
			</div>
		</div>
	);
};

export default NotificationSettingsPage;

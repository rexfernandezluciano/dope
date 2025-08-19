
import React, { useState } from 'react';
import { Dropdown, Badge, ListGroup } from 'react-bootstrap';
import { Bell, MessageCircle, Heart, UserPlus } from 'lucide-react';
import { markNotificationAsRead, getUserNotifications } from '../utils/messaging-utils';

const NotificationsDropdown = ({ notifications = [], unreadCount = 0, user }) => {
	const [allNotifications, setAllNotifications] = useState([]);
	const [loading, setLoading] = useState(false);

	const handleNotificationClick = async (notification) => {
		if (!notification.read) {
			await markNotificationAsRead(notification.id);
		}
		
		// Navigate to the relevant page based on notification type
		if (notification.url) {
			window.location.href = notification.url;
		}
	};

	const loadAllNotifications = async () => {
		if (!user || loading) return;
		
		setLoading(true);
		try {
			const allNotifs = await getUserNotifications(user.uid, 50);
			setAllNotifications(allNotifs);
		} catch (error) {
			console.error('Error loading notifications:', error);
		} finally {
			setLoading(false);
		}
	};

	const getNotificationIcon = (type) => {
		switch (type) {
			case 'new_post':
				return <MessageCircle size={16} className="text-primary" />;
			case 'like':
				return <Heart size={16} className="text-danger" />;
			case 'follow':
				return <UserPlus size={16} className="text-success" />;
			default:
				return <Bell size={16} className="text-secondary" />;
		}
	};

	const formatNotificationTime = (createdAt) => {
		if (!createdAt) return '';
		
		const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
		const now = new Date();
		const diff = now - date;
		
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);
		
		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return `${days}d ago`;
	};

	const displayNotifications = allNotifications.length > 0 ? allNotifications : notifications;

	return (
		<Dropdown align="end" onToggle={(isOpen) => {
			if (isOpen) loadAllNotifications();
		}} style={{ position: 'relative', zIndex: 1040 }}>
			<Dropdown.Toggle variant="link" className="text-dark position-relative p-2 border-0 bg-transparent">
				<Bell size={20} />
				{unreadCount > 0 && (
					<Badge 
						bg="danger" 
						pill 
						className="position-absolute top-0 start-100 translate-middle"
						style={{ fontSize: '0.65rem', minWidth: '18px', height: '18px' }}
					>
						{unreadCount > 99 ? '99+' : unreadCount}
					</Badge>
				)}
			</Dropdown.Toggle>

			<Dropdown.Menu className="shadow-sm border-0" style={{ width: '350px', maxHeight: '400px', zIndex: 9999, position: 'absolute' }}>
				<div className="px-3 py-2 border-bottom">
					<h6 className="mb-0 fw-bold">Notifications</h6>
				</div>
				
				<div style={{ maxHeight: '300px', overflowY: 'auto' }}>
					{loading ? (
						<div className="text-center py-3">
							<div className="spinner-border spinner-border-sm" role="status">
								<span className="visually-hidden">Loading...</span>
							</div>
						</div>
					) : displayNotifications.length === 0 ? (
						<div className="text-center py-4 text-muted">
							<Bell size={32} className="mb-2 opacity-50" />
							<p className="mb-0">No notifications yet</p>
						</div>
					) : (
						<ListGroup variant="flush">
							{displayNotifications.slice(0, 10).map((notification) => (
								<ListGroup.Item
									key={notification.id}
									action
									onClick={() => handleNotificationClick(notification)}
									className={`border-0 ${!notification.read ? 'bg-light' : ''}`}
									style={{ cursor: 'pointer' }}
								>
									<div className="d-flex align-items-start gap-2">
										<div className="flex-shrink-0 mt-1">
											{getNotificationIcon(notification.type)}
										</div>
										<div className="flex-grow-1 min-w-0">
											<p className="mb-1 fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>
												{notification.title}
											</p>
											<p className="mb-1 text-muted" style={{ fontSize: '0.8rem' }}>
												{notification.message}
											</p>
											<small className="text-muted">
												{formatNotificationTime(notification.createdAt)}
											</small>
										</div>
										{!notification.read && (
											<div className="flex-shrink-0">
												<div 
													className="bg-primary rounded-circle"
													style={{ width: '8px', height: '8px' }}
												></div>
											</div>
										)}
									</div>
								</ListGroup.Item>
							))}
						</ListGroup>
					)}
				</div>
				
				{displayNotifications.length > 10 && (
					<div className="px-3 py-2 border-top text-center">
						<small className="text-muted">
							Showing latest 10 notifications
						</small>
					</div>
				)}
			</Dropdown.Menu>
		</Dropdown>
	);
};

export default NotificationsDropdown;

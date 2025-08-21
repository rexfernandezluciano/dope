/** @format */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Nav, Button } from "react-bootstrap";
import { ChevronLeft, Person, Eye, Bell, X, Clock, Activity, Shield } from "react-bootstrap-icons";
import { Link, useLocation } from "react-router-dom";


import { updatePageMeta, pageMetaData } from "../utils/meta-utils";
import AccountSettingsPage from "./settings/AccountSettingsPage";
import ProfileSettingsPage from "./settings/ProfileSettingsPage";
import PrivacySettingsPage from "./settings/PrivacySettingsPage";
import NotificationSettingsPage from "./settings/NotificationSettingsPage";
import SessionSettingsPage from "./settings/SessionSettingsPage";
import { authAPI } from "../config/ApiConfig";
import { removeAuthToken } from "../config/ApiConfig";

const SettingsPage = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [activeTab, setActiveTab] = useState("account");

	const handleLogout = async () => {
		await authAPI.logout();
		removeAuthToken();
		navigate("/");
	};

	const settingsTabs = useMemo(() => [
		{
			key: "account",
			label: "Account",
			icon: <Person size={20} />,
			component: <AccountSettingsPage />
		},
		{
			key: "profile",
			label: "Profile",
			icon: <Person size={20} />,
			component: <ProfileSettingsPage />
		},
		{
			key: "privacy",
			label: "Privacy and safety",
			icon: <Eye size={20} />,
			component: <PrivacySettingsPage />
		},
		{
			key: "notifications",
			label: "Notifications",
			icon: <Bell size={20} />,
			component: <NotificationSettingsPage />
		},
		{
			key: "sessions",
			label: "Sessions",
			icon: <Shield size={20} />,
			component: <SessionSettingsPage />
		}
	], []);

	const currentTab = settingsTabs.find(tab => tab.key === activeTab);

	useEffect(() => {
		// Update page meta data based on active section
		const metaKey = `${activeTab}Settings`;
		if (pageMetaData[metaKey]) {
			updatePageMeta(pageMetaData[metaKey]);
		} else {
			updatePageMeta(pageMetaData.settings);
		}

		// Parse URL to determine active section
		if (location.pathname.includes("/settings/")) {
			const pathSegments = location.pathname.split("/");
			const lastSegment = pathSegments[pathSegments.length - 1];
			if (settingsTabs.find(tab => tab.key === lastSegment)) {
				setActiveTab(lastSegment);
			}
		} else if (location.pathname === "/settings") {
			setActiveTab("account"); // Default to account tab
		}
	}, [activeTab, location.pathname]);

	return (
		<Container className="py-0 px-0">
			{/* Header */}
			<div className="d-flex align-items-center justify-content-between p-3 border-bottom bg-white sticky-top" style={{ zIndex: 100 }}>
				<div className="d-flex align-items-center gap-3">
					<Button
						variant="link"
						className="p-0 text-dark"
						onClick={() => navigate(-1)}
					>
						<ChevronLeft size={20} />
					</Button>
					<h4 className="mb-0">Settings</h4>
				</div>
				<Button
					variant="link"
					className="p-0 text-dark d-md-none"
					onClick={() => navigate(-1)}
				>
					<X size={20} />
				</Button>
			</div>

			<div className="row g-0">
				{/* Sidebar Navigation */}
				<div className="col-md-4 col-lg-3 border-end bg-light">
					<Nav className="flex-column">
						{settingsTabs.map((tab) => (
							<Nav.Link
								key={tab.key}
								as={Link}
								to={`/settings/${tab.key}`}
								className={`d-flex align-items-center gap-3 px-4 py-3 text-dark border-0 ${
									activeTab === tab.key ? 'bg-primary bg-opacity-10 border-end border-primary border-3' : ''
								}`}
								onClick={() => setActiveTab(tab.key)}
								style={{ cursor: 'pointer' }}
							>
								{tab.icon}
								<span className="fw-medium">{tab.label}</span>
							</Nav.Link>
						))}

						<hr className="mx-3" />

						<Link
							to="/waiting-list"
							className="list-group-item list-group-item-action border-0 d-flex align-items-center"
						>
							<Clock className="me-3 text-warning" />
							<div>
								<div className="fw-medium">Waiting List</div>
								<small className="text-muted">Join our waiting list</small>
							</div>
						</Link>
						<Link
							to="/network-test"
							className="list-group-item list-group-item-action border-0 d-flex align-items-center"
						>
							<Activity className="me-3 text-info" />
							<div>
								<div className="fw-medium">Network Diagnostics</div>
								<small className="text-muted">Test connectivity and troubleshoot issues</small>
							</div>
						</Link>

						<hr className="mx-3" />

						<Nav.Link
							className="d-flex align-items-center gap-3 px-4 py-3 text-danger border-0"
							onClick={handleLogout}
							style={{ cursor: 'pointer' }}
						>
							<X size={20} />
							<span className="fw-medium">Logout</span>
						</Nav.Link>
					</Nav>
				</div>

				{/* Main Content */}
				<div className="col-md-8 col-lg-9">
					<div className="p-4">
						<div className="d-flex align-items-center gap-2 mb-4">
							{currentTab?.icon}
							<h5 className="mb-0">{currentTab?.label}</h5>
						</div>

						{currentTab?.component}
					</div>
				</div>
			</div>
		</Container>
	);
};

export default SettingsPage;
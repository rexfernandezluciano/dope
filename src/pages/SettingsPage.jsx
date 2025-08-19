/** @format */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Nav, Button } from "react-bootstrap";
import { ChevronLeft, Person, Eye, Bell, X } from "react-bootstrap-icons";

import { updatePageMeta, pageMetaData } from "../utils/meta-utils";
import AccountSettingsPage from "./settings/AccountSettingsPage";
import ProfileSettingsPage from "./settings/ProfileSettingsPage";
import PrivacySettingsPage from "./settings/PrivacySettingsPage";
import NotificationSettingsPage from "./settings/NotificationSettingsPage";
import { authAPI } from "../config/ApiConfig";
import { removeAuthToken } from "../config/ApiConfig";

const SettingsPage = () => {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState("account");

	const handleLogout = () => {
		authAPI.logout();
		removeAuthToken();
		navigate("/");
	};

	const settingsTabs = [
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
		}
	];

	const currentTab = settingsTabs.find(tab => tab.key === activeTab);

	useEffect(() => {
		// Update page meta data based on active section
		const metaKey = `${activeTab}Settings`;
		if (pageMetaData[metaKey]) {
			updatePageMeta(pageMetaData[metaKey]);
		} else {
			updatePageMeta(pageMetaData.settings);
		}

		// Parse URL parameters to determine active section
		const params = new URLSearchParams(window.location.search);
		const section = params.get('section');
		if (section && settingsTabs.find(tab => tab.key === section)) {
			setActiveTab(section);
		}
	}, [activeTab, settingsTabs]);

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
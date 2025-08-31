/** @format */

import { useState, useEffect } from "react";
import {
	useNavigate,
	useLocation,
	useLoaderData,
	Link,
} from "react-router-dom";
import NProgress from "nprogress";
import {
	Navbar,
	Container,
	Image,
	Dropdown,
	Nav,
	Row,
	Col,
	Form,
	InputGroup,
	Button,
} from "react-bootstrap";
import { BoxArrowRight, Search } from "react-bootstrap-icons";
import {
	GoHome,
	GoSearch,
	GoPerson,
	GoStar,
	GoBriefcase,
	GoHeart,
	GoGear,
} from "react-icons/go";
import { TbBrandGoogleAnalytics } from "react-icons/tb";
import { businessAPI } from "../../config/ApiConfig";

import {
	initializeNotifications,
	requestNotificationPermission,
	setupNotificationListener,
	getUnreadNotificationCount,
} from "../../utils/messaging-utils";
import { getUser } from "../../utils/app-utils";
import { centavosToPesos } from "../../utils/common-utils";

import logo from "../../assets/images/dope.png";
import AlertDialog from "../dialogs/AlertDialog";
import NotificationsDropdown from "../NotificationsDropdown";

const NavigationView = ({ children }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const loaderData = useLoaderData() || {};
	const { user: loaderUserData } = loaderData; // Renamed to avoid conflict

	const [searchQuery, setSearchQuery] = useState("");
	const [showLogoutDialog, setShowLogoutDialog] = useState(false);
	const [, setNotificationsEnabled] = useState(false);
	const [user, setUser] = useState(null);
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [credits, setCredits] = useState({
		credits: 0,
		creditsDisplay: "₱0.00",
	});

	// Handle NProgress completion for navigation
	useEffect(() => {
		// Ensure NProgress completes when component mounts
		NProgress.done();

		// Add click listeners to all navigation links
		const handleLinkClick = (e) => {
			const target = e.target.closest("a");
			const isTabClick =
				target &&
				(target.closest(".nav-tabs") ||
					target.closest(".nav-pills") ||
					target.hasAttribute("data-bs-toggle"));

			if (
				target &&
				target.href &&
				!target.href.startsWith("mailto:") &&
				!target.href.startsWith("tel:") &&
				!isTabClick
			) {
				NProgress.start();
			}
		};

		// Add event listener to document for all link clicks
		document.addEventListener("click", handleLinkClick);

		// Initialize user and notifications
		if (loaderUserData && loaderUserData.uid) {
			setUser(loaderUserData);
			initializeNotifications(loaderUserData.uid);
			requestNotificationPermission().then((granted) => {
				setNotificationsEnabled(granted);
			});
		} else {
			// If user data is not available from loader, attempt to fetch it
			const initializeUser = async () => {
				try {
					const userData = await getUser();
					if (userData) {
						setUser(userData);

						// Initialize notifications for the user
						await initializeNotifications(userData.uid);

						// Setup real-time notification listener
						const unsubscribe = setupNotificationListener(
							userData.uid,
							(newNotifications) => {
								setNotifications(newNotifications);
								setUnreadCount(newNotifications.length);
							},
						);

						// Get initial unread count
						const initialUnreadCount = await getUnreadNotificationCount(
							userData.uid,
						);
						setUnreadCount(initialUnreadCount);

						// Cleanup listener on unmount
						return () => {
							if (unsubscribe) unsubscribe();
						};
					}
				} catch (error) {
					console.error("Error initializing user:", error);
				}
			};
			initializeUser();
		}

		// Check current notification permission
		if ("Notification" in window) {
			setNotificationsEnabled(Notification.permission === "granted");
		}

		// Load credits for authenticated user
		const loadCredits = async () => {
			if (loaderUserData && loaderUserData.uid) {
				try {
					const creditsData = await businessAPI.getCredits();
					setCredits(creditsData);
				} catch (error) {
					console.error("Failed to load credits:", error);
				}
			}
		};
		loadCredits();

		// Cleanup function
		return () => {
			document.removeEventListener("click", handleLinkClick);
		};
	}, [location, loaderUserData]); // Dependency on loaderUserData

	// Effect to setup notification listener if user is available from loader
	useEffect(() => {
		if (loaderUserData && loaderUserData.uid) {
			setUser(loaderUserData);
			initializeNotifications(loaderUserData.uid);

			// Setup real-time notification listener
			const unsubscribe = setupNotificationListener(
				loaderUserData.uid,
				(newNotifications) => {
					setNotifications(newNotifications);
					setUnreadCount(newNotifications.length);
				},
			);

			// Get initial unread count
			getUnreadNotificationCount(loaderUserData.uid).then(
				(initialUnreadCount) => {
					setUnreadCount(initialUnreadCount);
				},
			);

			return () => {
				if (unsubscribe) unsubscribe();
			};
		}
	}, [loaderUserData]);

	useEffect(() => {
		if (user && user.uid) {
			// Load unread notification count
			const loadNotificationCount = async () => {
				const count = await getUnreadNotificationCount(user.uid);
				setUnreadCount(count);
			};
			loadNotificationCount();

			// Setup real-time notification listener
			const unsubscribe = setupNotificationListener(
				user.uid,
				(newNotifications) => {
					setNotifications(newNotifications);
					setUnreadCount(newNotifications.length);

					// Play notification sound for new notifications (optional)
					if (newNotifications.length > 0) {
						// You can add a notification sound here
						console.log(
							`${newNotifications.length} new notifications received`,
						);
					}
				},
			);

			return () => {
				if (unsubscribe) unsubscribe();
			};
		}
	}, [user]);

	const handleLogout = () => {
		setShowLogoutDialog(true);
	};

	const confirmLogout = async () => {
		try {
			// Call the logout API endpoint to end the session
			const { authAPI } = await import("../../config/ApiConfig.js");
			await authAPI.logout();
		} catch (error) {
			console.error("Logout API error:", error);
			// Continue with local logout even if API call fails
		}

		try {
			// Clear auth token using secure method
			const { removeAuthToken } = await import("../../utils/app-utils.js");
			removeAuthToken();

			// Also clear from ApiConfig
			const { removeAuthToken: removeApiAuthToken } = await import(
				"../../config/ApiConfig.js"
			);
			removeApiAuthToken();

			// Clear any localStorage/sessionStorage items
			localStorage.clear();
			sessionStorage.clear();
		} catch (tokenError) {
			console.error("Failed to remove auth token:", tokenError);
		}

		// Hide the dialog first
		setShowLogoutDialog(false);

		// Force a complete page reload to clear all state
		window.location.replace("/");
	};

	const mobileMenuItems = [
		{
			label: "Home",
			href: "/",
			icon: <GoHome size={20} />,
		},
		{
			label: "Search",
			href: "/search",
			icon: <GoSearch size={20} />,
		},
		{
			label: "Subscription",
			href: "/account/billing/subscription",
			icon: <GoStar size={20} />,
		},
		{
			label: "Analytics",
			href: "/dashboard/analytics",
			icon: <TbBrandGoogleAnalytics size={20} />,
		},
		{
			label: "Profile",
			href: `/${user?.username}`,
			icon: <GoPerson size={20} />,
		},
	];

	const menuItems = [
		{
			label: "Home",
			href: "/",
			icon: <GoHome size={18} />,
		},
		{
			label: "Profile",
			href: `/${user?.username}`,
			icon: <GoPerson size={18} />,
		},
		{
			label: "Settings",
			href: "/settings/account",
			icon: <GoGear size={18} />,
		},
		{
			label: "Subscription",
			href: "/account/billing/subscription",
			icon: <GoStar size={18} />,
		},
		{
			label: "My Subscriptions",
			href: "/manage/creators/subscription",
			icon: <GoHeart size={18} />,
		},
		{
			label: "Analytics",
			href: "/dashboard/analytics",
			icon: <TbBrandGoogleAnalytics size={18} />,
		},
		{
			label: "Business",
			href: "/dashboard/business",
			icon: <GoBriefcase size={18} />,
		},
	];

	const navItemClass = (href) => {
		const isActive = location.pathname === href;
		return `nav-link px-3 py-2 rounded-end-5 ${isActive ? "bg-primary text-white" : "text-dark"}`;
	};

	const mobileNavItemClass = (href) => {
		const isActive = location.pathname === href;
		return `nav-link mobile-nav-bar px-3 py-2 rounded-5 ${isActive ? "bg-primary text-white" : "text-dark"}`;
	};

	const handleSearch = (e) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			NProgress.start();
			navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
		}
	};

	const handleNavigate = (href) => {
		NProgress.start();
		navigate(href);
	};

	if (!user) {
		return (
			<div className="d-flex justify-content-center align-items-center vh-100">
				<div>Loading...</div>
			</div>
		);
	}

	return (
		<>
			{/* MobileNavbar */}
			<div className="d-md-none">
				<Navbar expand={false} className="bg-white border-bottom sticky-top">
					<Container fluid>
						<Navbar.Brand as={Link} to="/" className="text-primary">
							<div
								style={{
									width: "50px",
									height: "30px",
									backgroundColor: "#0069B5",
									WebkitMaskImage: `url(${logo})`,
									WebkitMaskRepeat: "no-repeat",
									WebkitMaskPosition: "center",
									WebkitMaskSize: "contain",
									maskImage: `url(${logo})`,
									maskRepeat: "no-repeat",
									maskPosition: "center",
									maskSize: "contain",
								}}
							></div>
						</Navbar.Brand>

						<div className="d-none">Center</div>

						<div className="d-flex align-items-center justify-content-center">
							{/* Mobile Notification Icon */}
							<NotificationsDropdown
								notifications={notifications}
								unreadCount={unreadCount}
								user={user}
							/>

							<Dropdown>
								<Dropdown.Toggle variant="link" id="dropdown-profile">
									<Image
										width={30}
										height={30}
										src={user?.photoURL}
										roundedCircle
										className="border border-1"
										style={{ objectFit: "cover" }}
									/>
								</Dropdown.Toggle>
								<Dropdown.Menu align="end">
									<span className="small fw-bold px-3 mb-2">Credits</span>
									<p className="text-muted rounded-5 py-1 bg-light mt-2 mb-2 mx-3 px-3 fw-bold d-flex align-items-center justify-content-between gap-2">
										${credits.credits.toFixed(2)}{" "}
										<span className="text-primary fw-bold small">
											Buy Credits
										</span>
									</p>
									<span className="small fw-bold px-3 mt-2 mb-2">Billing</span>
									<Dropdown.Item as={Link} to="/account/billing/subscription">
										<GoStar size={18} className="me-2" />
										Subscription
									</Dropdown.Item>
									<span className="small fw-bold px-3 my-2">Membership</span>
									<Dropdown.Item as={Link} to="/manage/creators/subscription">
										<GoHeart size={18} className="me-2" />
										My Subscriptions
									</Dropdown.Item>
									<Dropdown.Divider />
									<span className="small fw-bold px-3 mb-2">Dashboard</span>
									<Dropdown.Item as={Link} to="/dashboard/analytics">
										<TbBrandGoogleAnalytics size={18} className="me-2" />
										Analytics
									</Dropdown.Item>
									<Dropdown.Item as={Link} to="/dashboard/business">
										<GoBriefcase size={18} className="me-2" />
										Business
									</Dropdown.Item>
									<Dropdown.Divider />
									<span className="small fw-bold px-3 mb-2">Account</span>
									<Dropdown.Item as={Link} to="/settings/account">
										<GoGear size={18} className="me-2" />
										Settings & Privacy
									</Dropdown.Item>
									<Dropdown.Item onClick={handleLogout} className="text-danger">
										<BoxArrowRight size={18} className="me-2" />
										Logout
									</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown>
						</div>
					</Container>
				</Navbar>
				<div style={{ marginBottom: "60px" }}>{children}</div>
				<div className="fixed-bottom d-flex justify-content-between border-top flex-grow-1 py-2 bg-white gap-3 px-2">
					{mobileMenuItems.map((item, idx) => (
						<Link
							key={idx}
							to={item.href}
							className={mobileNavItemClass(item.href)}
							style={{ textDecoration: "none" }}
							onClick={() => handleNavigate(item.href)}
						>
							{item.icon}
						</Link>
					))}
				</div>
			</div>

			{/* Desktop Sidebar */}
			<div className="d-none d-md-block">
				<Navbar expand={false} className="bg-white border-bottom sticky-top">
					{/* Live Broadcasting Top Bar */}
					{window.location.pathname === "/" &&
						localStorage.getItem("isCurrentlyBroadcasting") === "true" && (
							<div
								className="w-100 bg-danger text-white text-center py-1"
								style={{ fontSize: "0.875rem" }}
							>
								<span
									style={{
										width: "8px",
										height: "8px",
										borderRadius: "50%",
										backgroundColor: "#fff",
										display: "inline-block",
										marginRight: "6px",
										animation: "pulse 1.5s infinite",
									}}
								></span>
								🔴 LIVE BROADCASTING IN PROGRESS
							</div>
						)}
					<Container fluid>
						<Navbar.Brand as={Link} to="/" className="fw-bold fs-4">
							<div
								style={{
									width: "200px",
									height: "30px",
									backgroundColor: "#0069B5",
									WebkitMaskImage: `url(${logo})`,
									WebkitMaskRepeat: "no-repeat",
									WebkitMaskPosition: "center",
									WebkitMaskSize: "contain",
									maskImage: `url(${logo})`,
									maskRepeat: "no-repeat",
									maskPosition: "center",
									maskSize: "contain",
								}}
							></div>
						</Navbar.Brand>

						{/* Search Bar */}
						<div className="d-none d-md-flex flex-grow-1 mx-4">
							<Form
								onSubmit={handleSearch}
								className="w-100"
								style={{ maxWidth: "400px" }}
							>
								<InputGroup>
									<Form.Control
										type="text"
										placeholder="Search posts, users..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="rounded-start-pill border-end-0 shadow-none"
									/>
									<Button
										variant="outline-secondary"
										type="submit"
										className="rounded-end-pill border-start-0"
										style={{ borderColor: "#ced4da" }}
									>
										<Search size={16} />
									</Button>
								</InputGroup>
							</Form>
						</div>

						<div className="d-flex align-items-center">
							{/* Notification Icon */}
							<NotificationsDropdown
								notifications={notifications}
								unreadCount={unreadCount}
								user={user}
							/>
						</div>
					</Container>
				</Navbar>
				<div
					className="bg-white border-end vh-100 shadow-sm desktop-nav-sidebar"
					style={{ width: "250px", position: "fixed", overflowY: "auto" }}
				>
					<Container className="ps-0 pe-3 py-4">
						<Row className="justify-content-center mb-3">
							<Col xs="auto">
								<Image
									src={user?.photoURL || "https://i.pravatar.cc/150?img=10"}
									roundedCircle
									width={80}
									height={80}
								/>
							</Col>
						</Row>
						<h5 className="text-center">{user?.name}</h5>
						<p className="text-center text-muted small">
							{user?.username}{" "}
							{(user?.membership?.subscription || user?.subscription) &&
								(user?.membership?.subscription || user?.subscription) !==
									"free" && (
									<span
										className={`ms-1 badge ${
											(user?.membership?.subscription || user?.subscription) ===
											"premium"
												? "bg-warning text-dark"
												: (user?.membership?.subscription ||
															user?.subscription) === "pro"
													? "bg-primary"
													: "bg-secondary"
										}`}
										style={{ fontSize: "0.7rem" }}
									>
										{(
											user?.membership?.subscription || user?.subscription
										).toUpperCase()}
									</span>
								)}
						</p>
						<p className="text-center">
							<small className="text-success fw-bold d-flex align-items-center justify-content-center">
								<GoStar size={14} className="me-1" />
								<span className="text-truncate">
									$
									{centavosToPesos(
										credits?.creditsInCentavos || "0.00",
									).toFixed(2)}
								</span>{" "}
								<span
									className="bg-light px-1 py-1 rounded-5 ms-2"
									style={{ fontSize: "12px" }}
								>
									Credits
								</span>
							</small>
						</p>
					</Container>
					<Nav className="flex-column gap-1 pe-3">
						{menuItems.map((item, idx) => (
							<Link
								key={idx}
								to={item.href}
								className={navItemClass(item.href)}
								style={{ textDecoration: "none" }}
							>
								{item.icon}
								<span className="ms-2">{item.label}</span>
							</Link>
						))}
						<Nav.Link
							onClick={handleLogout}
							className="nav-link text-danger px-3 py-2 rounded-pill"
							style={{ cursor: "pointer" }}
						>
							<BoxArrowRight size={18} className="me-2" />
							Logout
						</Nav.Link>
					</Nav>
				</div>
				<div style={{ marginLeft: "250px" }}>{children}</div>
			</div>

			{showLogoutDialog && (
				<AlertDialog
					show={showLogoutDialog}
					onHide={() => setShowLogoutDialog(false)}
					title="Logout Confirmation"
					message="Are you sure you want to logout?"
					onDialogButtonClick={confirmLogout}
					dialogButtonMessage="Logout"
					type="danger"
				/>
			)}
		</>
	);
};

export default NavigationView;

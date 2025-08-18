/** @format */

import { useState, useEffect } from "react";
import { useNavigate, useLocation, useLoaderData, Link } from "react-router-dom";
import NProgress from "nprogress";
import {
	Navbar,
	Container,
	Image,
	Offcanvas,
	Nav,
	Row,
	Col,
	Form,
	InputGroup,
	Button,
	Badge,
} from "react-bootstrap";
import {
	House,
	Person,
	Gear,
	BoxArrowRight,
	Search,
	Star,
	BarChart,
	Bell,
	BellFill,
} from "react-bootstrap-icons";
import { Search as LucideSearch, MessageCircle, User as LucideUser, Settings as LucideSettings, BarChart3 as LucideBarChart3, CreditCard as LucideCreditCard, Home as LucideHome } from "lucide-react";


import { authAPI } from "../../config/ApiConfig";
import { removeAuthToken } from "../../utils/app-utils";
import { initializeNotifications, requestNotificationPermission, setupNotificationListener, getUnreadNotificationCount } from "../../utils/messaging-utils";
import { getUser } from "../../utils/auth-utils";

import logo from "../../assets/images/dope.png";
import dopeImage from "../../assets/images/dope.png";
import AlertDialog from "../dialogs/AlertDialog";
import NotificationsDropdown from '../NotificationsDropdown';

const NavigationView = ({ children }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const loaderData = useLoaderData() || {};
	const { user: loaderUserData } = loaderData; // Renamed to avoid conflict
	const [showModal, setShowModal] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [showLogoutDialog, setShowLogoutDialog] = useState(false);
	const [filterBy, setFilterBy] = useState("for-you"); // Assuming this state is needed for the tabs
	const [notificationsEnabled, setNotificationsEnabled] = useState(false);
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [selectedTab, setSelectedTab] = useState('for-you');
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);


	// Handle NProgress for all navigation including browser back/forward
	useEffect(() => {
		const handleStart = () => NProgress.start();
		const handleComplete = () => NProgress.done();

		// Listen to React Router navigation events
		window.addEventListener("beforeunload", handleStart);

		// Initialize OneSignal with user ID when navigation loads
		// This block will be updated to handle Firestore initialization
		if (loaderUserData && loaderUserData.uid) {
			setUser(loaderUserData); // Set user from loader data initially
			initializeNotifications(loaderUserData.uid).then((success) => {
				if (success) {
					requestNotificationPermission().then((granted) => {
						setNotificationsEnabled(granted);
					});
				}
			});
		} else {
			// If user data is not available from loader, attempt to fetch it
			const initializeUser = async () => {
				try {
					setLoading(true);
					const userData = await getUser();
					if (userData) {
						setUser(userData);

						// Initialize notifications for the user
						await initializeNotifications(userData.uid);

						// Setup real-time notification listener
						const unsubscribe = setupNotificationListener(userData.uid, (newNotifications) => {
							setNotifications(newNotifications);
							setUnreadCount(newNotifications.length);
						});

						// Get initial unread count
						const initialUnreadCount = await getUnreadNotificationCount(userData.uid);
						setUnreadCount(initialUnreadCount);

						// Cleanup listener on unmount
						return () => {
							if (unsubscribe) unsubscribe();
						};
					}
				} catch (error) {
					console.error('Error initializing user:', error);
				} finally {
					setLoading(false);
				}
			};
			initializeUser();
		}

		// Check current notification permission
		if ('Notification' in window) {
			setNotificationsEnabled(Notification.permission === 'granted');
		}

		return () => {
			window.removeEventListener("beforeunload", handleStart);
			handleComplete();
		};
	}, [location, loaderUserData]); // Dependency on loaderUserData


	// Effect to setup notification listener if user is available from loader
	useEffect(() => {
		if (loaderUserData && loaderUserData.uid) {
			setUser(loaderUserData);
			initializeNotifications(loaderUserData.uid).then((success) => {
				if (success) {
					requestNotificationPermission().then((granted) => {
						setNotificationsEnabled(granted);
					});
				}
			});

			// Setup real-time notification listener
			const unsubscribe = setupNotificationListener(loaderUserData.uid, (newNotifications) => {
				setNotifications(newNotifications);
				setUnreadCount(newNotifications.length);
			});

			// Get initial unread count
			getUnreadNotificationCount(loaderUserData.uid).then(initialUnreadCount => {
				setUnreadCount(initialUnreadCount);
			});

			return () => {
				if (unsubscribe) unsubscribe();
			};
		}
	}, [loaderUserData]);


	const handleLogout = () => {
		setShowLogoutDialog(true);
	};

	const confirmLogout = () => {
		authAPI.logout();
		removeAuthToken();
		setShowLogoutDialog(false);
		NProgress.start();
		navigate("/");
	};

	const menuItems = [
		{
			label: "Home",
			href: "/home",
			icon: <House size={18} className="me-2" />,
		},
		{
			label: "Profile",
			href: `/${user?.username}`,
			icon: <Person size={18} className="me-2" />,
		},
		{
			label: "Settings",
			href: `/${user?.username}/settings`,
			icon: <Gear size={18} className="me-2" />,
		},
		{
			label: "Subscription",
			href: "/subscription",
			icon: <Star size={18} className="me-2" />,
		},
		{
			label: "Analytics",
			href: "/analytics",
			icon: <BarChart size={18} className="me-2" />,
		},
	];

	const navItemClass = (href) => {
		const isActive = location.pathname === href;
		return `nav-link px-3 py-2 rounded-end-5 ${isActive ? "bg-primary text-white" : "text-dark"}`;
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
		setShowModal(false);
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
			{/* Mobile Navbar */}
			<div className="d-md-none">
				<Navbar expand={false} className="bg-white border-bottom sticky-top">
					<Container fluid>
						<Navbar.Toggle
							aria-controls="offcanvasNavbar"
							className="shadow-none border-0"
							onClick={() => setShowModal(true)}
						/>
						<Navbar.Brand as={Link} to="/home" className="text-primary">
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

						{/* Mobile Search Icon */}
						<Button
							variant="link"
							className="p-0 me-1"
							onClick={() => navigate("/search")}
						>
							<Search size={24} className="text-primary" />
						</Button>

						<Navbar.Offcanvas
							id="offcanvasNavbar"
							aria-labelledby="offcanvasNavbarLabel"
							placement="start"
							backdrop="static"
							style={{ maxWidth: "260px" }}
							show={showModal}
							onHide={() => setShowModal(false)}
						>
							<Offcanvas.Header closeButton>
								<Offcanvas.Title id="offcanvasNavbarLabel">
									Menu
								</Offcanvas.Title>
							</Offcanvas.Header>
							<Offcanvas.Body className="ps-0 pe-3">
								<div className="text-center mb-4">
									<Image
										src={user?.photoURL || "https://i.pravatar.cc/150?img=10"}
										roundedCircle
										width={70}
										height={70}
									/>
									<h6 className="mt-2">{user?.name}</h6>
									<small className="text-muted">@{user?.username}
									{((user?.membership?.subscription || user?.subscription) && 
									  (user?.membership?.subscription || user?.subscription) !== "free") && (
										<span
											className={`ms-1 badge ${
												(user?.membership?.subscription || user?.subscription) === "premium"
													? "bg-warning text-dark"
													: (user?.membership?.subscription || user?.subscription) === "pro"
														? "bg-primary"
														: "bg-secondary"
											}`}
											style={{ fontSize: "0.7rem" }}
										>
											{(user?.membership?.subscription || user?.subscription).toUpperCase()}
										</span>
									)}</small>
								</div>
								<Nav className="flex-column">
									{menuItems.map((item, idx) => (
										<Link
											key={idx}
											to={item.href}
											className={navItemClass(item.href)}
											style={{ textDecoration: 'none' }}
											onClick={() => handleNavigate(item.href)}
										>
											{item.icon}
											{item.label}
										</Link>
									))}
									<Nav.Link
										onClick={handleLogout}
										className="nav-link px-3 text-danger"
										style={{ cursor: "pointer" }}
									>
										<BoxArrowRight size={18} className="me-2" />
										Logout
									</Nav.Link>
								</Nav>
							</Offcanvas.Body>
						</Navbar.Offcanvas>
					</Container>
				</Navbar>
				{children}
			</div>

			{/* Desktop Sidebar */}
			<div className="d-none d-md-block">
				<Navbar expand={false} className="bg-white border-bottom sticky-top">
					<Container fluid>
						<Navbar.Brand
							as={Link}
							to="/home"
							className="fw-bold d-flex align-items-center gap-2"
						>
							<Image
								src={dopeImage}
								alt="DOPE Network"
								width={32}
								height={32}
							/>
							<span className="d-none d-sm-inline">DOPE Network</span>
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

							<div className="dropdown ms-3">
								<Image
									src={user?.photoURL || "https://i.pravatar.cc/150?img=10"}
									alt="avatar"
									roundedCircle
									width="40"
									height="40"
									style={{ cursor: "pointer" }}
									data-bs-toggle="dropdown"
									aria-expanded="false"
								/>
								<ul className="dropdown-menu dropdown-menu-end">
									<li>
										<Link className="dropdown-item" to={`/${user?.username}`}>
											<Person size={16} className="me-2" />
											Profile
										</Link>
									</li>
									<li>
										<Link
											className="dropdown-item"
											to={`/${user?.username}/settings`}
										>
											<Gear size={16} className="me-2" />
											Settings
										</Link>
									</li>
									<li>
										<Link
											className="dropdown-item"
											to={`/${user?.username}/subscription`}
										>
											<Star size={16} className="me-2" />
											Subscription
										</Link>
									</li>
									<li>
										<Link
											className="dropdown-item"
											to={`/${user?.username}/analytics`}
										>
											<BarChart size={16} className="me-2" />
											Analytics
										</Link>
									</li>
									<li>
										<hr className="dropdown-divider" />
									</li>
									<li>
										<button
											className="dropdown-item px-3 text-danger"
											onClick={handleLogout}
										>
											<BoxArrowRight size={16} className="me-2" />
											Logout
										</button>
									</li>
								</ul>
							</div>
						</div>
					</Container>
				</Navbar>
				<div
					className="bg-white border-end vh-100 shadow-sm"
					style={{ width: "250px", position: "fixed" }}
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
							{((user?.membership?.subscription || user?.subscription) && 
							  (user?.membership?.subscription || user?.subscription) !== "free") && (
								<span
									className={`ms-1 badge ${
										(user?.membership?.subscription || user?.subscription) === "premium"
											? "bg-warning text-dark"
											: (user?.membership?.subscription || user?.subscription) === "pro"
												? "bg-primary"
												: "bg-secondary"
									}`}
									style={{ fontSize: "0.7rem" }}
								>
									{(user?.membership?.subscription || user?.subscription).toUpperCase()}
								</span>
							)}
						</p>
					</Container>
					<Nav className="flex-column gap-1">
						{menuItems.map((item, idx) => (
							<Link
								key={idx}
								to={item.href}
								className={navItemClass(item.href)}
								style={{ textDecoration: 'none' }}
							>
								{item.icon}
								{item.label}
							</Link>
						))}
						<Nav.Link
							onClick={handleLogout}
							className="nav-link text-danger mt-3 px-3 py-2 rounded-pill"
							style={{ cursor: "pointer" }}
						>
							<BoxArrowRight size={18} className="me-2" />
							Logout
						</Nav.Link>
					</Nav>
				</div>
				{/* The following div contains the tabs that need to be sticky */}
				<div
					className="d-flex align-items-center justify-content-center px-0 pt-2 border-bottom bg-white sticky-top"
					style={{ 
						top: '56px', /* Height of the navbar */
						zIndex: 1019 /* Below navbar but above content */
					}}
				>
					<div className="d-flex w-100">
						<Button
							variant="link"
							className={`flex-fill px-4 py-2 fw-bold text-decoration-none border-0 ${
								filterBy === "for-you"
									? "text-primary border-bottom border-primary pb-3 border-2"
									: "text-muted"
							}`}
							onClick={() => setFilterBy("for-you")}
							style={{ borderRadius: 0 }}
						>
							For you
						</Button>
						<Button
							variant="link"
							className={`flex-fill px-4 py-2 fw-bold text-decoration-none border-0 ${
								filterBy === "following"
									? "text-primary border-bottom border-primary pb-3 border-2"
									: "text-muted"
							}`}
							onClick={() => setFilterBy("following")}
							style={{ borderRadius: 0 }}
						>
							Following
						</Button>
					</div>
				</div>
				<div style={{ marginLeft: "250px" }}>{children}</div>
			</div>
			<AlertDialog
				show={showLogoutDialog}
				onHide={() => setShowLogoutDialog(false)}
				title="Logout Confirmation"
				message="Are you sure you want to logout?"
				onDialogButtonClick={confirmLogout}
				dialogButtonMessage="Logout"
				type="danger"
			/>
		</>
	);
};

export default NavigationView;
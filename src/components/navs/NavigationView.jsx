/** @format */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
} from "react-bootstrap";
import {
	House,
	Person,
	Gear,
	BoxArrowRight,
	Search,
	Star,
} from "react-bootstrap-icons";

import { authAPI } from "../../config/ApiConfig";
import { removeAuthToken } from "../../utils/app-utils";

import logo from "../../assets/images/dope.png";
import dopeImage from "../../assets/images/dope.png";

const NavigationView = ({ children, user }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const [showModal, setShowModal] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const handleLogout = async () => {
		try {
			await authAPI.logout();
			removeAuthToken();
			navigate("/");
		} catch (err) {
			console.error("Logout error:", err);
			// Force logout even if API call fails
			removeAuthToken();
			navigate("/");
		}
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
			href: `/${user?.username}/subscription`,
			icon: <Star size={18} className="me-2" />,
		},
	];

	const navItemClass = (href) => {
		const isActive = location.pathname === href;
		return `nav-link px-3 py-2 rounded-end-5 ${isActive ? "bg-primary text-white" : "text-dark"}`;
	};

	const handleSearch = (e) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
		}
	};

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
						<Navbar.Brand href="/" className="text-primary">
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
									<small className="text-muted">@{user?. username}</small>
									{user.subscription && user.subscription !== "free" && (
										<span
											className={`ms-1 badge ${
												user.subscription === "premium"
													? "bg-warning text-dark"
													: user.subscription === "pro"
														? "bg-primary"
														: "bg-secondary"
											}`}
											style={{ fontSize: "0.7rem" }}
										>
											{user.subscription.toUpperCase()}
										</span>
									)}
								</div>
								<Nav className="flex-column">
									{menuItems.map((item, idx) => (
										<Nav.Link
											key={idx}
											href={item.href}
											className={navItemClass(item.href)}
										>
											{item.icon}
											{item.label}
										</Nav.Link>
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
							href="/home"
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
										className="rounded-start-pill border-end-0"
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

						<div className="dropdown">
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
									<a className="dropdown-item" href={`/${user?.username}`}>
										<Person size={16} className="me-2" />
										Profile
									</a>
								</li>
								<li>
									<a
										className="dropdown-item"
										href={`/${user?.username}/settings`}
									>
										<Gear size={16} className="me-2" />
										Settings
									</a>
								</li>
								<li>
									<a
										className="dropdown-item"
										href={`/${user?.username}/subscription`}
									>
										<Star size={16} className="me-2" />
										Subscription
									</a>
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
						<p className="text-center text-muted small">{user?.email}</p>
						{user?.hasBlueCheck && (
							<p className="text-center text-primary small">✓ Verified</p>
						)}
						<Nav className="flex-column gap-1">
							{menuItems.map((item, idx) => (
								<Nav.Link
									key={idx}
									href={item.href}
									className={navItemClass(item.href)}
								>
									{item.icon}
									{item.label}
								</Nav.Link>
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
					</Container>
				</div>
				<div style={{ marginLeft: "250px" }}>{children}</div>
			</div>
		</>
	);
};

export default NavigationView;

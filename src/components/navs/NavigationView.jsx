/** @format */

import { useNavigate, useLocation } from "react-router-dom";
import { Navbar, Container, Image, Offcanvas, Nav, Row, Col } from "react-bootstrap";
import { House, Person, Gear, BoxArrowRight } from "react-bootstrap-icons";

import { authAPI } from "../../config/ApiConfig";
import { removeAuthToken } from "../../utils/app-utils";

const NavigationView = ({ children, user }) => {
	const navigate = useNavigate();
	const location = useLocation();

	const handleLogout = async () => {
		try {
			await authAPI.logout();
			removeAuthToken();
			navigate("/");
		} catch (err) {
			console.error('Logout error:', err);
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
	];

	const navItemClass = href => {
		const isActive = location.pathname === href;
		return `nav-link ${isActive ? "active" : ""}`;
	};

	return (
		<>
			{/* Mobile Navbar */}
			<div className="d-md-none">
				<Navbar expand={false} className="bg-white border-bottom">
					<Container fluid>
						<Navbar.Toggle
							aria-controls="offcanvasNavbar"
							className="shadow-none border-0"
						/>
						<Navbar.Brand href="/" className="text-primary">
							DOPE
						</Navbar.Brand>
						<Image
							src={user?.photoURL || "https://i.pravatar.cc/150?img=10"}
							alt="avatar"
							roundedCircle
							width="35"
							height="35"
						/>
						<Navbar.Offcanvas
							id="offcanvasNavbar"
							aria-labelledby="offcanvasNavbarLabel"
							placement="start"
							backdrop="static"
							style={{ maxWidth: "260px" }}>
							<Offcanvas.Header closeButton>
								<Offcanvas.Title id="offcanvasNavbarLabel">Menu</Offcanvas.Title>
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
									<small className="text-muted">{user?.email}</small>
									{user?.hasBlueCheck && (
										<div className="mt-1">
											<span className="text-primary">✓ Verified</span>
										</div>
									)}
								</div>
								<Nav className="flex-column">
									{menuItems.map((item, idx) => (
										<Nav.Link
											key={idx}
											href={item.href}
											className={navItemClass(item.href)}>
											{item.icon}
											{item.label}
										</Nav.Link>
									))}
									<Nav.Link
										onClick={handleLogout}
										className="nav-link text-danger"
										style={{ cursor: "pointer" }}>
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
				<Navbar expand={false} className="bg-white border-bottom">
					<Container fluid>
						<Navbar.Brand href="/" className="text-primary">
							DOPE Network
						</Navbar.Brand>
					</Container>
				</Navbar>
				<div
					className="bg-white border-end vh-100 shadow-sm"
					style={{ width: "250px", position: "fixed" }}>
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
						<Nav className="flex-column">
							{menuItems.map((item, idx) => (
								<Nav.Link
									key={idx}
									href={item.href}
									className={navItemClass(item.href)}>
									{item.icon}
									{item.label}
								</Nav.Link>
							))}
							<Nav.Link
								onClick={handleLogout}
								className="nav-link text-danger mt-3"
								style={{ cursor: "pointer" }}>
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
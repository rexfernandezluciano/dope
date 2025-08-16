/** @format */

import React, { useState, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Navbar, Nav, Container, Offcanvas, Image, Row, Col, Spinner } from "react-bootstrap";
import { HouseDoor, Person, Gear, BoxArrowRight } from "react-bootstrap-icons";

import { getUser } from "../../utils/app-utils";

const NavigationView = ({ children }) => {
	const { pathname } = useLocation();
	
	const { user } = useLoaderData();

	const isActive = path => pathname === path || pathname === user.username;
	const navItemClass = path => `nav-link px-4 ${isActive(path) ? "active rounded-end-3 bg-primary px-sm-4 fw-bold" : "text-black"}`;

	const menuItems = [
		{ icon: <HouseDoor className="me-2" />, label: "Home", href: "/" },
		{ icon: <Person className="me-2" />, label: "Profile", href: `/${user?.username}` },
		{ icon: <Gear className="me-2" />, label: "Settings", href: "/settings" },
		{ icon: <BoxArrowRight className="me-2" />, label: "Logout", href: "/logout" },
	];

	if (!user) {
		return (
			<div className="d-flex align-items-center justify-content-center min-vh-100">
				<Spinner
					animation="border"
					variant="primary"
				/>
			</div>
		);
	}

	return (
		<>
			{/* Mobile Navbar */}
			<div className="d-md-none">
				<Navbar
					expand={false}
					className="bg-white border-bottom">
					<Container fluid>
						<Navbar.Toggle
							aria-controls="offcanvasNavbar"
							className="shadow-none border-0"
						/>
						<Navbar.Brand
							href="/"
							className="text-primary">
							DOPE
						</Navbar.Brand>
						<Image
							src={user.photoURL}
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
										src={user.photoURL}
										roundedCircle
										width={70}
										height={70}
									/>
									<h6 className="mt-2">{user.name}</h6>
									<small>{user.email}</small>
								</div>
								<Nav className="flex-column">
									{menuItems.map((item, idx) => (
										<Nav.Link
											href={item.href}
											key={idx}
											className={navItemClass(item.href)}>
											{item.icon}
											{item.label}
										</Nav.Link>
									))}
								</Nav>
							</Offcanvas.Body>
						</Navbar.Offcanvas>
					</Container>
				</Navbar>
				<div>{children}</div>
			</div>

			{/* Desktop Sidebar */}
			<div className="d-none d-md-block">
				<Navbar
					expand={false}
					className="bg-white border-bottom">
					<Container fluid>
						<Navbar.Brand
							href="#"
							className="text-primary">
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
									src={user.photoURL}
									roundedCircle
									width={80}
									height={80}
								/>
							</Col>
						</Row>
						<h5 className="text-center">{user.name}</h5>
						<p className="text-center text-muted small">{user.email}</p>
						<Nav className="flex-column">
							{menuItems.map((item, idx) => (
								<Nav.Link
									href={item.href}
									key={idx}
									className={navItemClass(item.href)}>
									{item.icon}
									{item.label}
								</Nav.Link>
							))}
						</Nav>
					</Container>
				</div>
				<div style={{ marginLeft: "250px" }}>{children}</div>
			</div>
		</>
	);
};

export default NavigationView;

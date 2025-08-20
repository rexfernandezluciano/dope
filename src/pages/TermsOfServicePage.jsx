
/** @format */

import React, { useEffect } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { updatePageMeta } from "../utils/meta-utils";

const TermsOfServicePage = () => {
	useEffect(() => {
		updatePageMeta({
			title: "Terms of Service - DOPE Network",
			description: "Terms of Service for DOPE Network",
			keywords: "terms, service, agreement, conditions, DOPE Network"
		});
	}, []);

	return (
		<Container className="py-5">
			<Row className="justify-content-center">
				<Col lg={8}>
					<Card className="shadow-sm border-0">
						<Card.Body className="px-3 p-5">
							<h1 className="display-4 fw-bold text-primary mb-4 text-center">
								Terms of Service
							</h1>
							<p className="text-muted text-center mb-5">
								Last updated: August 20, 2025
							</p>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">1. Acceptance of Terms</h2>
								<p className="text-muted">
									By accessing and using DOPE Network, you accept and agree to be bound by the terms 
									and provision of this agreement. These Terms of Service govern your use of our platform 
									and services.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">2. Description of Service</h2>
								<p className="text-muted">
									DOPE Network is a social networking platform that allows users to connect, share content, 
									and interact with other users. We provide various features including posting, messaging, 
									live streaming, and analytics.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">3. User Accounts</h2>
								<p className="text-muted">
									You are responsible for maintaining the confidentiality of your account and password. 
									You agree to accept responsibility for all activities that occur under your account. 
									You must provide accurate and complete information when creating an account.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">4. Acceptable Use</h2>
								<p className="text-muted">
									You agree not to use the service to:
								</p>
								<ul className="text-muted">
									<li>Post content that is illegal, harmful, threatening, abusive, or discriminatory</li>
									<li>Harass, abuse, or harm other users</li>
									<li>Spam or send unsolicited messages</li>
									<li>Violate any applicable laws or regulations</li>
									<li>Infringe on intellectual property rights</li>
									<li>Attempt to gain unauthorized access to our systems</li>
								</ul>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">5. Content Policy</h2>
								<p className="text-muted">
									You retain ownership of content you post on our platform. However, by posting content, 
									you grant us a non-exclusive, royalty-free license to use, display, and distribute 
									your content on our platform. We reserve the right to remove content that violates 
									our community guidelines.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">6. Privacy</h2>
								<p className="text-muted">
									Your privacy is important to us. Please review our Privacy Policy, which also governs 
									your use of the service, to understand our practices regarding the collection and use 
									of your information.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">7. Termination</h2>
								<p className="text-muted">
									We may terminate or suspend your account and access to the service immediately, without 
									prior notice, for conduct that we believe violates these Terms of Service or is harmful 
									to other users, us, or third parties.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">8. Disclaimers</h2>
								<p className="text-muted">
									The service is provided "as is" without warranty of any kind. We do not guarantee 
									that the service will be uninterrupted, secure, or error-free. We disclaim all 
									warranties, express or implied, including warranties of merchantability and fitness 
									for a particular purpose.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">9. Limitation of Liability</h2>
								<p className="text-muted">
									In no event shall DOPE Network be liable for any indirect, incidental, special, 
									consequential, or punitive damages arising out of or relating to your use of the service.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">10. Changes to Terms</h2>
								<p className="text-muted">
									We reserve the right to modify these terms at any time. We will notify users of any 
									material changes by posting the updated terms on our platform. Your continued use 
									of the service after such changes constitutes acceptance of the new terms.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">11. Contact Information</h2>
								<p className="text-muted">
									If you have any questions about these Terms of Service, please contact us at:
								</p>
								<ul className="text-muted">
									<li>Email: security@dopp.eu.org</li>
									<li>Address: 75 Purok Rosal, Sampaguita, General Tinio, Nueva Ecija, Philippines</li>
								</ul>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Container>
	);
};

export default TermsOfServicePage;

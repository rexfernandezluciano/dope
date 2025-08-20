
/** @format */

import React, { useEffect } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { updatePageMeta, pageMetaData } from "../utils/meta-utils";

const PrivacyPolicyPage = () => {
	useEffect(() => {
		updatePageMeta({
			title: "Privacy Policy - DOPE Network",
			description: "Privacy Policy for DOPE Network",
			keywords: "privacy, policy, data protection, DOPE Network"
		});
	}, []);

	return (
		<Container className="py-5">
			<Row className="justify-content-center">
				<Col lg={8}>
					<Card className="shadow-sm border-0">
						<Card.Body className="p-5">
							<h1 className="display-4 fw-bold text-primary mb-4 text-center">
								Privacy Policy
							</h1>
							<p className="text-muted text-center mb-5">
								Last updated: {new Date().toLocaleDateString()}
							</p>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">1. Information We Collect</h2>
								<p className="text-muted">
									We collect information you provide directly to us, such as when you create an account, 
									update your profile, post content, or communicate with us. This may include your name, 
									email address, profile information, and any content you choose to share.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">2. How We Use Your Information</h2>
								<p className="text-muted">
									We use the information we collect to provide, maintain, and improve our services, 
									communicate with you, and ensure the security of our platform. We may also use your 
									information to personalize your experience and show you relevant content.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">3. Information Sharing</h2>
								<p className="text-muted">
									We do not sell, trade, or otherwise transfer your personal information to third parties 
									without your consent, except as described in this policy. We may share information with 
									service providers who assist us in operating our platform, conducting our business, or 
									serving our users.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">4. Data Security</h2>
								<p className="text-muted">
									We implement appropriate security measures to protect your personal information against 
									unauthorized access, alteration, disclosure, or destruction. However, no method of 
									transmission over the Internet or electronic storage is 100% secure.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">5. Cookies and Tracking</h2>
								<p className="text-muted">
									We use cookies and similar tracking technologies to enhance your experience on our platform. 
									You can control cookies through your browser settings, but disabling cookies may affect 
									the functionality of our services.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">6. Your Rights</h2>
								<p className="text-muted">
									You have the right to access, update, or delete your personal information. You may also 
									request that we limit or stop processing your information. To exercise these rights, 
									please contact us using the information provided below.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">7. Children's Privacy</h2>
								<p className="text-muted">
									Our services are not intended for children under 13 years of age. We do not knowingly 
									collect personal information from children under 13. If we become aware that we have 
									collected such information, we will take steps to delete it.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">8. Changes to This Policy</h2>
								<p className="text-muted">
									We may update this privacy policy from time to time. We will notify you of any changes 
									by posting the new policy on this page and updating the "Last updated" date above.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">9. Contact Us</h2>
								<p className="text-muted">
									If you have any questions about this privacy policy, please contact us at:
								</p>
								<ul className="text-muted">
									<li>Email: privacy@dopenetwork.com</li>
									<li>Address: [Your Business Address]</li>
								</ul>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Container>
	);
};

export default PrivacyPolicyPage;

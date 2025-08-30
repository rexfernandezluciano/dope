/** @format */

import React, { useEffect } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { updatePageMeta } from "../utils/meta-utils";

const TermsOfServicePage = () => {
	useEffect(() => {
		updatePageMeta({
			title: "Terms of Service - DOPE Network",
			description:
				"Read DOPE Network's terms of service to understand the rules and guidelines for using our platform.",
			keywords: "terms of service, rules, guidelines, DOPE Network, legal",
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
								<h2 className="h4 fw-bold text-dark mb-3">
									1. Acceptance of Terms
								</h2>
								<p className="text-muted">
									By accessing andnbsp;using DOPE Network, you accept and agree
									to be bound by the terms andnbsp;provision of this agreement.
									These Terms of Service govern your use of our platform
									andnbsp;services.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">
									2. Description of Service
								</h2>
								<p className="text-muted">
									DOPE Network is a social networking platform that allows users
									to connect, share content, andnbsp;interact with other users.
									We provide various features including posting, messaging, live
									streaming, andnbsp;analytics.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">3. User Accounts</h2>
								<p className="text-muted">
									You are responsible for maintaining the confidentiality of
									your account andnbsp;password. You agree to accept
									responsibility for all activities that occur under your
									account. You must provide accurate andnbsp;complete
									information when creating an account.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">4. Acceptable Use</h2>
								<p className="text-muted">
									You agree not to use the service to:
								</p>
								<ul className="text-muted">
									<li>
										Post content that is illegal, harmful, threatening, abusive,
										ornbsp;discriminatory
									</li>
									<li>Harass, abuse, ornbsp;harm other users</li>
									<li>Spam ornbsp;send unsolicited messages</li>
									<li>Violate any applicable laws ornbsp;regulations</li>
									<li>Infringe on intellectual propertynbsp;rights</li>
									<li>
										Attempt to gain unauthorized access to ournbsp;systems
									</li>
								</ul>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">5. Content Policy</h2>
								<p className="text-muted">
									You retain ownership of content you post on our platform.
									However, by posting content, you grant us a non-exclusive,
									royalty-free license to use, display, andnbsp;distribute your
									content on our platform. We reserve the right to remove
									content thatnbsp;violates our community guidelines.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">6. Privacy</h2>
								<p className="text-muted">
									Your privacy is important to us. Please review our Privacy
									Policy, which also governs your use of the service, to
									understand our practices regarding the collection andnbsp;use
									of your information.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">7. Termination</h2>
								<p className="text-muted">
									We may terminate or suspend your account andnbsp;access to the
									service immediately, without prior notice, for conduct that we
									believe violates these Terms of Service ornbsp;is harmful to
									other users, us, ornbsp;third parties.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">8. Disclaimers</h2>
								<p className="text-muted">
									The service is provided "as is" without warranty of any kind.
									We do not guarantee that the service will be uninterrupted,
									secure, ornbsp;error-free. We disclaim all warranties, express
									ornbsp;implied, including warranties of merchantability
									andnbsp;fitness for a particular purpose.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">
									9. Limitation of Liability
								</h2>
								<p className="text-muted">
									In no event shall DOPE Network be liable for any indirect,
									incidental, special, consequential, ornbsp;punitive damages
									arising out of ornbsp;relating to your use of the service.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">
									10. Changes to Terms
								</h2>
								<p className="text-muted">
									We reserve the right to modify these terms at any time. We
									will notify users ofnbsp;any material changes by posting the
									updated terms on our platform. Your continued use of the
									service after suchnbsp;changes constitutes acceptance of the
									new terms.
								</p>
							</div>

							<div className="mb-4">
								<h2 className="h4 fw-bold text-dark mb-3">
									11. Contact Information
								</h2>
								<p className="text-muted">
									If you have any questions about these Terms of Service, please
									contact usnbsp;at:
								</p>
								<ul className="text-muted">
									<li>Email: security@dopp.eu.org</li>
									<li>
										Address: 75 Purok Rosal, Sampaguita, General Tinio, Nueva
										Ecija, Philippines
									</li>
								</ul>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
			{/* <!-- banner_ad --> */}
			<ins
				class="adsbygoogle"
				style="display:block"
				data-ad-client="ca-pub-1106169546112879"
				data-ad-slot="2596463814"
				data-ad-format="auto"
				data-full-width-responsive="true"
			></ins>
			<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
		</Container>
	);
};

export default TermsOfServicePage;


/** @format */

import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Container, Card, Alert, Button, Spinner } from "react-bootstrap";
import { CheckCircle, Star, ArrowLeft } from "react-bootstrap-icons";
import { userAPI } from "../../config/ApiConfig";
import { updatePageMeta } from "../../utils/meta-utils";

const CreditsSuccessPage = () => {
	const [searchParams] = useSearchParams();
	const [loading, setLoading] = useState(true);
	const [message, setMessage] = useState("");
	const [creditsAdded, setCreditsAdded] = useState(0);
	const [currentBalance, setCurrentBalance] = useState(0);

	useEffect(() => {
		updatePageMeta({
			title: "Credits Added Successfully",
			description: "Your credits have been added to your account",
		});

		const processCredits = async () => {
			try {
				// Get credits amount from URL parameters
				const credits = searchParams.get("credits");
				const paymentId = searchParams.get("paymentId");

				if (credits) {
					setCreditsAdded(parseInt(credits));
				}

				// Fetch updated user balance
				const userResponse = await userAPI.getCurrentUser();
				if (userResponse.user) {
					setCurrentBalance(userResponse.user.credits || 0);
				}

				setMessage("Credits have been successfully added to your account!");
			} catch (error) {
				console.error("Credits processing error:", error);
				setMessage("Credits added, but failed to fetch updated balance");
			} finally {
				setLoading(false);
			}
		};

		processCredits();
	}, [searchParams]);

	if (loading) {
		return (
			<Container className="py-5 text-center">
				<Spinner animation="border" variant="primary" />
				<div className="mt-3">Processing credits...</div>
			</Container>
		);
	}

	return (
		<Container className="py-5">
			<div className="row justify-content-center">
				<div className="col-md-6">
					<Card className="text-center">
						<Card.Body className="py-5">
							<CheckCircle size={64} className="text-success mb-4" />

							<h2 className="mb-3">Credits Added!</h2>

							<Alert variant="success" className="mb-4">
								{message}
							</Alert>

							{creditsAdded > 0 && (
								<div className="mb-4">
									<div className="bg-light p-3 rounded">
										<h5 className="mb-2">
											<Star className="text-warning me-2" />
											+{creditsAdded} Credits Added
										</h5>
										<div className="text-muted">
											Current Balance: {currentBalance} credits
										</div>
									</div>
								</div>
							)}

							<div className="mb-4">
								<p className="text-muted">
									You can now use your credits for premium features, tips, and
									more!
								</p>
							</div>

							<div className="d-grid gap-2">
								<Button as={Link} to="/dashboard/analytics" variant="primary">
									<Star className="me-2" />
									View Dashboard
								</Button>
								<Button as={Link} to="/home" variant="outline-secondary">
									<ArrowLeft className="me-2" />
									Back to Home
								</Button>
							</div>
						</Card.Body>
					</Card>
				</div>
			</div>
		</Container>
	);
};

export default CreditsSuccessPage;

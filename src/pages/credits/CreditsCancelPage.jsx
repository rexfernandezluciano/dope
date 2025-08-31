
/** @format */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Container, Card, Alert, Button } from "react-bootstrap";
import { XCircle, ArrowLeft, Star } from "react-bootstrap-icons";
import { updatePageMeta } from "../../utils/meta-utils";

const CreditsCancelPage = () => {
	useEffect(() => {
		updatePageMeta({
			title: "Credits Purchase Cancelled",
			description: "Your credits purchase was cancelled",
		});
	}, []);

	return (
		<Container className="py-5">
			<div className="row justify-content-center">
				<div className="col-md-6">
					<Card className="text-center">
						<Card.Body className="py-5">
							<XCircle size={64} className="text-warning mb-4" />

							<h2 className="mb-3">Purchase Cancelled</h2>

							<Alert variant="warning" className="mb-4">
								Your credits purchase was cancelled. No charges have been made
								to your account.
							</Alert>

							<div className="mb-4">
								<p className="text-muted">
									You can try purchasing credits again or explore other ways to
									earn credits on the platform.
								</p>
							</div>

							<div className="d-grid gap-2">
								<Button as={Link} to="/dashboard/business" variant="primary">
									<Star className="me-2" />
									Buy Credits
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

export default CreditsCancelPage;

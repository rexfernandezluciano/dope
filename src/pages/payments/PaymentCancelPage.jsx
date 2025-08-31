
/** @format */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Container, Card, Alert, Button } from "react-bootstrap";
import { XCircle, ArrowLeft, CreditCard } from "react-bootstrap-icons";
import { updatePageMeta } from "../../utils/meta-utils";

const PaymentCancelPage = () => {
	useEffect(() => {
		updatePageMeta({
			title: "Payment Cancelled",
			description: "Your payment was cancelled",
		});
	}, []);

	return (
		<Container className="py-5">
			<div className="row justify-content-center">
				<div className="col-md-6">
					<Card className="text-center">
						<Card.Body className="py-5">
							<XCircle size={64} className="text-warning mb-4" />

							<h2 className="mb-3">Payment Cancelled</h2>

							<Alert variant="warning" className="mb-4">
								Your payment was cancelled. No charges have been made to your
								account.
							</Alert>

							<div className="mb-4">
								<p className="text-muted">
									You can try again or choose a different payment method to
									continue with your subscription.
								</p>
							</div>

							<div className="d-grid gap-2">
								<Button
									as={Link}
									to="/account/billing/subscription"
									variant="primary"
								>
									<CreditCard className="me-2" />
									Try Again
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

export default PaymentCancelPage;

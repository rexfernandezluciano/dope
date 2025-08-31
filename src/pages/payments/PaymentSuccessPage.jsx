
/** @format */

import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Container, Card, Alert, Button, Spinner } from "react-bootstrap";
import { CheckCircle, CreditCard, ArrowLeft } from "react-bootstrap-icons";
import { paymentAPI } from "../../config/ApiConfig";
import { updatePageMeta } from "../../utils/meta-utils";

const PaymentSuccessPage = () => {
	const [searchParams] = useSearchParams();
	const [loading, setLoading] = useState(true);
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState("success");
	const [paymentDetails, setPaymentDetails] = useState(null);

	useEffect(() => {
		updatePageMeta({
			title: "Payment Successful",
			description: "Your payment has been processed successfully",
		});

		const processPayment = async () => {
			try {
				// Get PayPal parameters from URL
				const paymentId = searchParams.get("paymentId");
				const token = searchParams.get("token");
				const payerId = searchParams.get("PayerID");

				if (paymentId && token && payerId) {
					// Confirm payment with backend
					const response = await paymentAPI.confirmPayment({
						paymentId,
						token,
						payerId,
					});

					if (response.success) {
						setPaymentDetails(response.payment);
						setMessage("Payment completed successfully!");
						setMessageType("success");
					} else {
						setMessage(response.message || "Payment verification failed");
						setMessageType("danger");
					}
				} else {
					setMessage("Payment completed successfully!");
					setMessageType("success");
				}
			} catch (error) {
				console.error("Payment confirmation error:", error);
				setMessage(error.message || "Failed to verify payment");
				setMessageType("danger");
			} finally {
				setLoading(false);
			}
		};

		processPayment();
	}, [searchParams]);

	if (loading) {
		return (
			<Container className="py-5 text-center">
				<Spinner animation="border" variant="primary" />
				<div className="mt-3">Processing payment...</div>
			</Container>
		);
	}

	return (
		<Container className="py-5">
			<div className="row justify-content-center">
				<div className="col-md-6">
					<Card className="text-center">
						<Card.Body className="py-5">
							{messageType === "success" ? (
								<CheckCircle size={64} className="text-success mb-4" />
							) : (
								<CreditCard size={64} className="text-danger mb-4" />
							)}

							<h2 className="mb-3">
								{messageType === "success"
									? "Payment Successful!"
									: "Payment Issue"}
							</h2>

							<Alert variant={messageType} className="mb-4">
								{message}
							</Alert>

							{paymentDetails && (
								<div className="mb-4">
									<h6>Payment Details:</h6>
									<div className="text-muted">
										<div>Amount: ${paymentDetails.amount}</div>
										<div>Transaction ID: {paymentDetails.transactionId}</div>
									</div>
								</div>
							)}

							<div className="d-grid gap-2">
								<Button
									as={Link}
									to="/account/billing/subscription"
									variant="primary"
								>
									<CreditCard className="me-2" />
									View Subscription
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

export default PaymentSuccessPage;

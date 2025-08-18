/** @format */

import { useState, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import {
	Container,
	Card,
	Form,
	Button,
	Alert,
	Modal,
	Row,
	Col,
	Badge,
	ListGroup,
} from "react-bootstrap";
import {
	CreditCard,
	CheckCircle,
	XCircle,
	Calendar,
	Star,
	Image,
	Paypal
} from "react-bootstrap-icons";

import { userAPI } from "../config/ApiConfig";

const SubscriptionPage = () => {
	const { user } = useLoaderData();

	const [subscription, setSubscription] = useState({
		plan: "free",
		status: "active",
		nextBilling: null,
		features: {
			blueCheck: false,
			imageLimit: 3,
			nameChangeLimit: false,
			lastNameChange: null,
		},
	});

	const [paymentMethods, setPaymentMethods] = useState([]);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState("success");
	const [showCancelModal, setShowCancelModal] = useState(false);
	const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
	const [selectedPaymentType, setSelectedPaymentType] = useState("card");
	const [cardForm, setCardForm] = useState({
		cardNumber: "",
		expiryDate: "",
		cvc: "",
		cardholderName: "",
		isDefault: false
	});

	// Format expiry date as MM/YY
	const formatExpiryDate = (value) => {
		// Remove all non-digits
		const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');

		// Add slash after MM
		if (v.length >= 2) {
			return v.slice(0, 2) + '/' + v.slice(2, 4);
		}
		return v;
	};

	// Format card number with spaces
	const formatCardNumber = (value) => {
		const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
		const matches = v.match(/\d{4,16}/g);
		const match = matches && matches[0] || '';
		const parts = [];
		for (let i = 0, len = match.length; i < len; i += 4) {
			parts.push(match.substring(i, i + 4));
		}
		if (parts.length) {
			return parts.join(' ');
		} else {
			return v;
		}
	};

	// Handle adding payment method
	const handleAddPaymentMethod = async () => {
		if (selectedPaymentType === "card") {
			// Validate card form
			if (!cardForm.cardNumber || !cardForm.expiryDate || !cardForm.cvc || !cardForm.cardholderName) {
				setMessage("Please fill in all card details.");
				setMessageType("warning");
				return;
			}

			// Mock adding card - in real app, you'd integrate with payment processor
			const newCard = {
				id: Date.now().toString(),
				type: 'card',
				brand: 'Visa', // In real app, detect from card number
				last4: cardForm.cardNumber.replace(/\s/g, '').slice(-4),
				expiry: cardForm.expiryDate,
				cardholderName: cardForm.cardholderName,
				isDefault: cardForm.isDefault || paymentMethods.length === 0
			};

			// Set as default if it's the first payment method
			if (paymentMethods.length === 0) {
				newCard.isDefault = true;
			}

			setPaymentMethods(prev => [...prev, newCard]);
			setMessage("Payment method added successfully!");
			setMessageType("success");
		} else if (selectedPaymentType === "paypal") {
			// Mock adding PayPal - in real app, you'd integrate with PayPal
			const newPayPal = {
				id: Date.now().toString(),
				type: 'paypal',
				brand: 'PayPal',
				email: 'user@example.com', // Would get from PayPal API
				isDefault: paymentMethods.length === 0
			};

			setPaymentMethods(prev => [...prev, newPayPal]);
			setMessage("PayPal connected successfully!");
			setMessageType("success");
		}

		// Close modal and reset form
		setShowAddPaymentModal(false);
		setSelectedPaymentType("card");
		setCardForm({
			cardNumber: "",
			expiryDate: "",
			cvc: "",
			cardholderName: "",
			isDefault: false
		});
	};

	// Handle removing payment method
	const handleRemovePaymentMethod = (methodId) => {
		setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
		setMessage("Payment method removed successfully!");
		setMessageType("info");
	};

	// Helper functions
	const getImageLimit = (plan) => {
		switch (plan) {
			case "premium":
				return 10;
			case "pro":
				return "unlimited";
			default:
				return 3;
		}
	};

	const getBlueCheckStatus = (plan) => {
		return plan === "premium" || plan === "pro";
	};

	useEffect(() => {
		if (user && typeof user === "object") {
			const userSubscription = user.membership?.subscription || "free";
			const nextBillingDate = user.membership?.nextBillingDate || null;
			setSubscription({
				plan: userSubscription,
				status: "active",
				nextBilling: nextBillingDate,
				features: {
					blueCheck: getBlueCheckStatus(userSubscription),
					imageLimit: getImageLimit(userSubscription),
					nameChangeLimit: false, // Simplified - no name change tracking
					lastNameChange: null,
				},
			});
		}
	}, [user]);

	if (!user || typeof user !== "object") {
		return (
			<Container className="text-center py-5">
				<div>Loading user data...</div>
			</Container>
		);
	}

	const subscriptionPlans = [
		{
			id: "free",
			name: "Free",
			price: "$0",
			period: "forever",
			features: [
				"3 images per post",
				"Basic profile features",
				"Standard support",
			],
			color: "secondary",
		},
		{
			id: "premium",
			name: "Premium",
			price: "$4.99",
			period: "month",
			features: [
				"10 images per post",
				"Blue check verification",
				"Priority support",
				"Advanced privacy settings",
			],
			color: "primary",
		},
		{
			id: "pro",
			name: "Pro",
			price: "$9.99",
			period: "month",
			features: [
				"Unlimited images per post",
				"Blue check verification",
				"Priority support",
				"Advanced analytics",
				"Custom themes",
				"Early access to features",
			],
			color: "warning",
		},
	];

	const handleUpgrade = async (planId) => {
		// Check if user is trying to upgrade to a paid plan
		if (planId !== "free" && (!paymentMethods || paymentMethods.length === 0)) {
			setMessage("Please add a payment method before upgrading to a paid plan.");
			setMessageType("warning");
			setShowAddPaymentModal(true);
			return;
		}

		try {
			setLoading(true);
			await userAPI.updateUser(user.username, {
				membership: {
					subscription: planId,
					nextBillingDate: planId !== "free" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
				},
			});
			setMessage(`Successfully upgraded to ${planId} plan!`);
			setMessageType("success");
			// Update local state
			setSubscription((prev) => ({
				...prev,
				plan: planId,
				nextBilling: planId !== "free" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
				features: {
					...prev.features,
					blueCheck: getBlueCheckStatus(planId),
					imageLimit: getImageLimit(planId),
				},
			}));
		} catch (err) {
			setMessage(err.message || "Failed to upgrade subscription");
			setMessageType("danger");
		} finally {
			setLoading(false);
		}
	};

	const handleCancelSubscription = async () => {
		try {
			setLoading(true);
			await userAPI.updateUser(user.username, {
				membership: {
					subscription: "free",
					nextBillingDate: null
				},
			});
			setMessage(
				"Subscription cancelled successfully. You'll retain access until the end of your billing period.",
			);
			setMessageType("info");
			setShowCancelModal(false);
			// Update local state
			setSubscription((prev) => ({
				...prev,
				plan: "free",
				nextBilling: null,
				features: {
					...prev.features,
					blueCheck: false,
					imageLimit: 3,
				},
			}));
		} catch (err) {
			setMessage(err.message || "Failed to cancel subscription");
			setMessageType("danger");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container className="py-3 px-3 px-md-3">
			<h2 className="px-3 mb-4">Subscription & Billing</h2>

			{message && (
				<Alert
					variant={messageType}
					dismissible
					onClose={() => setMessage("")}
					className="mx-3 mb-4"
				>
					{message}
				</Alert>
			)}

			<div className="mb-4">
				{/* Current Plan */}
				<Card className="mb-4">
					<Card.Header className="d-flex align-items-center justify-content-between">
						<div className="d-flex align-items-center gap-2">
							<Star size={20} />
							<h5 className="mb-0">Current Plan</h5>
						</div>
						<Badge
							bg={
								subscriptionPlans.find((p) => p.id === subscription.plan)
									?.color || "secondary"
							}
						>
							{subscription.plan.toUpperCase()}
						</Badge>
					</Card.Header>
					<Card.Body className="px-3">
						<Row>
							<Col md={8}>
								<h4 className="text-capitalize mb-2">
									{subscription.plan} Plan
								</h4>
								<p className="text-muted mb-3">
									{subscription.plan === "free"
										? "Enjoy basic features at no cost"
										: `Next billing: ${subscription.nextBilling || "Not set"}`}
								</p>
								<div className="mb-3">
									<h6>Current Features:</h6>
									<ul className="list-unstyled">
										<li className="d-flex align-items-center gap-2 mb-1">
											<Image size={16} className="text-primary" />
											{subscription.features.imageLimit === "unlimited"
												? "Unlimited images per post"
												: `${subscription.features.imageLimit} images per post`}
										</li>
										<li className="d-flex align-items-center gap-2 mb-1">
											{subscription.features.blueCheck ? (
												<CheckCircle size={16} className="text-success" />
											) : (
												<XCircle size={16} className="text-muted" />
											)}
											Blue check verification
										</li>
										<li className="d-flex align-items-center gap-2 mb-1">
											<Calendar size={16} />
											Name changes: Available now
										</li>
									</ul>
								</div>
							</Col>
							<Col md={4} className="text-md-end">
								{subscription.plan !== "free" && (
									<Button
										variant="outline-danger"
										size="sm"
										onClick={() => setShowCancelModal(true)}
									>
										Cancel Subscription
									</Button>
								)}
							</Col>
						</Row>
					</Card.Body>
				</Card>

				{/* Available Plans */}
				<Card className="mb-4">
					<Card.Header>
						<h5 className="mb-0">Available Plans</h5>
					</Card.Header>
					<Card.Body className="px-3">
						<Row>
							{subscriptionPlans.map((plan) => (
								<Col md={4} key={plan.id} className="mb-3">
									<Card
										className={`h-100 ${subscription.plan === plan.id ? "border-primary" : ""}`}
									>
										<Card.Header className="text-center">
											<h5 className="mb-1">{plan.name}</h5>
											<h3 className="text-primary mb-0">
												{plan.price}
												{plan.period !== "forever" && (
													<small className="text-muted">/{plan.period}</small>
												)}
											</h3>
										</Card.Header>
										<Card.Body>
											<ul className="list-unstyled">
												{plan.features.map((feature, idx) => (
													<li
														key={idx}
														className="d-flex align-items-center gap-2 mb-2"
													>
														<CheckCircle size={16} className="text-success" />
														<small>{feature}</small>
													</li>
												))}
											</ul>
										</Card.Body>
										<Card.Footer className="text-center">
											{subscription.plan === plan.id ? (
												<Badge bg="success">Current Plan</Badge>
											) : (
												<Button
													variant={plan.color}
													size="sm"
													onClick={() => handleUpgrade(plan.id)}
													disabled={loading}
												>
													{plan.id === "free" ? "Downgrade" : 
													 (plan.id !== "free" && (!paymentMethods || paymentMethods.length === 0)) ? "Add Payment Method" : 
													 "Upgrade"}
												</Button>
											)}
										</Card.Footer>
									</Card>
								</Col>
							))}
						</Row>
					</Card.Body>
				</Card>

				{/* Features Section */}
				<Card className="mb-4">
					<Card.Header>
						<h5 className="mb-0">Feature Overview</h5>
					</Card.Header>
					<Card.Body className="px-3">
						<ListGroup variant="flush">
							<ListGroup.Item className="d-flex justify-content-between align-items-center">
								<div>
									<h6 className="mb-1">Blue Check Verification</h6>
									<small className="text-muted">
										{subscription.plan === "free"
											? "Upgrade to Premium or Pro to enable"
											: "Verification badge enabled for your profile"}
									</small>
								</div>
								<div>
									{subscription.features.blueCheck ? (
										<CheckCircle size={20} className="text-success" />
									) : (
										<XCircle size={20} className="text-muted" />
									)}
								</div>
							</ListGroup.Item>

							<ListGroup.Item>
								<div>
									<h6 className="mb-1">Image Upload Limit</h6>
									<small className="text-muted">
										Current limit:{" "}
										{subscription.features.imageLimit === "unlimited"
											? "Unlimited"
											: `${subscription.features.imageLimit} images`}{" "}
										per post
									</small>
									{subscription.plan === "free" && (
										<div className="mt-2">
											<small className="text-warning">
												Upgrade to Premium (10 images) or Pro (unlimited) for
												more uploads
											</small>
										</div>
									)}
								</div>
							</ListGroup.Item>

							<ListGroup.Item>
								<div>
									<h6 className="mb-1">Priority Support</h6>
									<small className="text-muted">
										{subscription.plan !== "free"
											? "Get faster response times for support requests"
											: "Standard support response times"}
									</small>
								</div>
							</ListGroup.Item>
						</ListGroup>
					</Card.Body>
				</Card>

				{/* Payment Methods Section */}
				<Card className="mb-4">
					<Card.Header className="d-flex justify-content-between align-items-center">
						<h5 className="mb-0">Payment Methods</h5>
						<Button
							variant="primary"
							size="sm"
							onClick={() => setShowAddPaymentModal(true)}
						>
							Add Payment Method
						</Button>
					</Card.Header>
					<Card.Body className="px-3">
						{paymentMethods.length === 0 ? (
							<div className="text-center py-4">
								<CreditCard size={48} className="text-muted mb-3" />
								<p className="text-muted">No payment methods added yet</p>
								<Button
									variant="outline-primary"
									onClick={() => setShowAddPaymentModal(true)}
								>
									Add Your First Payment Method
								</Button>
							</div>
						) : (
							<ListGroup variant="flush">
								{paymentMethods.map((method, idx) => (
									<ListGroup.Item
										key={idx}
										className="d-flex justify-content-between align-items-center"
									>
										<div className="d-flex align-items-center gap-3">
											{method.type === 'paypal' ? (
												<Paypal size={24} className="text-primary" />
											) : (
												<CreditCard size={24} />
											)}
											<div>
												{method.type === 'paypal' ? (
													<>
														<h6 className="mb-0">PayPal</h6>
														<small className="text-muted">
															{method.email}
														</small>
													</>
												) : (
													<>
														<h6 className="mb-0">**** **** **** {method.last4}</h6>
														<small className="text-muted">
															{method.brand} • Expires {method.expiry}
														</small>
													</>
												)}
											</div>
										</div>
										<div className="d-flex gap-2">
											{method.isDefault && <Badge bg="success">Default</Badge>}
											<Button 
												variant="outline-danger" 
												size="sm"
												onClick={() => handleRemovePaymentMethod(method.id)}
											>
												Remove
											</Button>
										</div>
									</ListGroup.Item>
								))}
							</ListGroup>
						)}
					</Card.Body>
				</Card>
			</div>

			{/* Cancel Subscription Modal */}
			<Modal
				show={showCancelModal}
				onHide={() => setShowCancelModal(false)}
				centered
			>
				<Modal.Header closeButton>
					<Modal.Title className="text-danger">Cancel Subscription</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p>
						Are you sure you want to cancel your {subscription.plan}{" "}
						subscription?
					</p>
					<div className="bg-light p-3 rounded mb-3">
						<h6>You will lose access to:</h6>
						<ul className="mb-0">
							<li>Blue check verification</li>
							<li>Extended image upload limits</li>
							<li>Priority support</li>
							{subscription.plan === "pro" && (
								<>
									<li>Advanced analytics</li>
									<li>Custom themes</li>
								</>
							)}
						</ul>
					</div>
					<p className="text-muted">
						Your subscription will remain active until the end of your current
						billing period.
					</p>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setShowCancelModal(false)}>
						Keep Subscription
					</Button>
					<Button
						variant="danger"
						onClick={handleCancelSubscription}
						disabled={loading}
					>
						{loading ? "Cancelling..." : "Cancel Subscription"}
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Add Payment Method Modal */}
			<Modal
				show={showAddPaymentModal}
				onHide={() => {
					setShowAddPaymentModal(false);
					setSelectedPaymentType("card");
					setCardForm({
						cardNumber: "",
						expiryDate: "",
						cvc: "",
						cardholderName: "",
						isDefault: false
					});
				}}
				fullscreen="md-down"
				size="md"
				centered
			>
				<Modal.Header closeButton>
					<Modal.Title>Add Payment Method</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{/* Payment Method Type Selection */}
					<Form.Group className="mb-4">
						<Form.Label>Payment Method Type</Form.Label>
						<div className="d-flex gap-3">
							<Form.Check
								type="radio"
								name="paymentType"
								id="card"
								label={
									<div className="d-flex align-items-center gap-2">
										<CreditCard size={20} />
										<span>Credit/Debit Card</span>
									</div>
								}
								checked={selectedPaymentType === "card"}
								onChange={() => setSelectedPaymentType("card")}
							/>
							<Form.Check
								type="radio"
								name="paymentType"
								id="paypal"
								label={
									<div className="d-flex align-items-center gap-2">
										<Paypal size={20} />
										<span>PayPal</span>
									</div>
								}
								checked={selectedPaymentType === "paypal"}
								onChange={() => setSelectedPaymentType("paypal")}
							/>
						</div>
					</Form.Group>

					{selectedPaymentType === "card" ? (
						<Form>
							<Form.Group className="mb-3">
								<Form.Label>Card Number</Form.Label>
								<Form.Control
									type="text"
									placeholder="1234 5678 9012 3456"
									value={cardForm.cardNumber}
									onChange={(e) => {
										const formatted = formatCardNumber(e.target.value);
										setCardForm(prev => ({ ...prev, cardNumber: formatted }));
									}}
									maxLength="19"
								/>
							</Form.Group>
							<Row>
								<Col>
									<Form.Group className="mb-3">
										<Form.Label>Expiry Date</Form.Label>
										<Form.Control 
											type="text" 
											placeholder="MM/YY" 
											value={cardForm.expiryDate}
											onChange={(e) => {
												const formatted = formatExpiryDate(e.target.value);
												setCardForm(prev => ({ ...prev, expiryDate: formatted }));
											}}
											maxLength="5" 
										/>
									</Form.Group>
								</Col>
								<Col>
									<Form.Group className="mb-3">
										<Form.Label>CVC</Form.Label>
										<Form.Control 
											type="text" 
											placeholder="123" 
											value={cardForm.cvc}
											onChange={(e) => {
												const value = e.target.value.replace(/[^0-9]/g, '');
												setCardForm(prev => ({ ...prev, cvc: value }));
											}}
											maxLength="4" 
										/>
									</Form.Group>
								</Col>
							</Row>
							<Form.Group className="mb-3">
								<Form.Label>Cardholder Name</Form.Label>
								<Form.Control 
									type="text" 
									placeholder="John Doe" 
									value={cardForm.cardholderName}
									onChange={(e) => setCardForm(prev => ({ ...prev, cardholderName: e.target.value }))}
								/>
							</Form.Group>
							<Form.Check
								type="checkbox"
								label="Set as default payment method"
								checked={cardForm.isDefault}
								onChange={(e) => setCardForm(prev => ({ ...prev, isDefault: e.target.checked }))}
								className="mb-3"
							/>
						</Form>
					) : (
						<div className="text-center py-4">
							<Paypal size={48} className="text-primary mb-3" />
							<p className="text-muted mb-3">
								You'll be redirected to PayPal to complete the setup
							</p>
							<div className="bg-light p-3 rounded">
								<small className="text-muted">
									By continuing, you agree to PayPal's terms and conditions
								</small>
							</div>
						</div>
					)}
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="secondary"
						onClick={() => {
							setShowAddPaymentModal(false);
							setSelectedPaymentType("card");
							setCardForm({
								cardNumber: "",
								expiryDate: "",
								cvc: "",
								cardholderName: "",
								isDefault: false
							});
						}}
					>
						Cancel
					</Button>
					<Button variant="primary" onClick={handleAddPaymentMethod}>
						{selectedPaymentType === "card" ? "Add Card" : "Connect PayPal"}
					</Button>
				</Modal.Footer>
			</Modal>
		</Container>
	);
};

export default SubscriptionPage;
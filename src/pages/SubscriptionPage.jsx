/** @format */

import { useState, useEffect } from "react";
import { useLoaderData, useNavigate, useSearchParams } from "react-router-dom";
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

import { userAPI, paymentAPI } from "../config/ApiConfig";
import { updatePageMeta, pageMetaData } from "../utils/meta-utils";
import { loadPayPalSDK, createPayPalPaymentMethod } from "../config/PayPalConfig";

const SubscriptionPage = () => {
	const { user } = useLoaderData();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

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
	const [purchaseLoading, setPurchaseLoading] = useState(false); // State for purchase loading
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState("success");
	const [showCancelModal, setShowCancelModal] = useState(false);
	const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
	const [selectedPaymentType, setSelectedPaymentType] = useState("card");
	const [isSignupFlow, setIsSignupFlow] = useState(false);
	const [pendingSignupData, setPendingSignupData] = useState(null);
	const [selectedSubscription, setSelectedSubscription] = useState("free");
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

	// Handle PayPal card integration
	const handlePayPalCardSetup = async () => {
		try {
			// Ensure PayPal SDK is loaded
			await loadPayPalSDK();

			// Create PayPal payment method
			const paymentMethodId = await createPayPalPaymentMethod('#paypal-card-container');
			return paymentMethodId;
		} catch (error) {
			throw new Error(`PayPal setup failed: ${error.message}`);
		}
	};

	// Handle adding payment method
	const handleAddPaymentMethod = async () => {
		try {
			setLoading(true);

			let paymentData;
			if (selectedPaymentType === "card") {
				// For card payments, redirect to PayPal to get paymentMethodId
				try {
					const paypalPaymentMethodId = await handlePayPalCardSetup();

					paymentData = {
						type: "paypal_card",
						paypalPaymentMethodId: paypalPaymentMethodId,
						isDefault: cardForm.isDefault || paymentMethods.length === 0
					};
				} catch (paypalError) {
					setMessage(paypalError.message || "Failed to set up PayPal payment method");
					setMessageType("danger");
					setLoading(false);
					return;
				}
			} else if (selectedPaymentType === "paypal") {
				// For PayPal wallet, use different flow
				paymentData = {
					type: "paypal_wallet",
					paypalEmail: user.email,
					isDefault: paymentMethods.length === 0
				};
			}

			if (paymentData) {
				const response = await paymentAPI.addPaymentMethod(paymentData);

				if (selectedPaymentType === "card") {
					setMessage("Credit card linked through PayPal successfully!");
				} else {
					setMessage("PayPal connected successfully!");
				}
				setMessageType("success");

				console.log("Payment method added:", response);
			}

			// Reload payment methods from server to ensure consistency
			await loadPaymentMethods();

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
		} catch (error) {
			console.error("Error adding payment method:", error);
			setMessage(error.message || "Failed to add payment method");
			setMessageType("danger");
		} finally {
			setLoading(false);
		}
	};

	// Handle removing payment method
	const handleRemovePaymentMethod = async (methodId) => {
		try {
			setLoading(true);
			await paymentAPI.deletePaymentMethod(methodId);

			// Reload payment methods from server
			await loadPaymentMethods();

			setMessage("Payment method removed successfully!");
			setMessageType("info");
		} catch (error) {
			console.error("Error removing payment method:", error);
			setMessage(error.message || "Failed to remove payment method");
			setMessageType("danger");
		} finally {
			setLoading(false);
		}
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

	// Load payment methods from server
	const loadPaymentMethods = async () => {
		try {
			const response = await paymentAPI.getPaymentMethods();
			setPaymentMethods(response.paymentMethods || []);
		} catch (error) {
			console.error("Failed to load payment methods:", error);
			// Don't show error message for missing payment methods
		}
	};

	useEffect(() => {
		updatePageMeta(pageMetaData.subscription);

		// Check if this is part of signup flow
		const isPayment = searchParams.get('payment') === 'true';
		const isSignup = searchParams.get('signup') === 'true';
		const planParam = searchParams.get('plan');

		if (isPayment && isSignup) {
			setIsSignupFlow(true);
			const storedData = sessionStorage.getItem('pendingSignupData');
			if (storedData) {
				try {
					const data = JSON.parse(storedData);
					setPendingSignupData(data);
					if (planParam) {
						setSelectedSubscription(planParam);
					}
				} catch (error) {
					console.error('Failed to parse signup data:', error);
				}
			}
			setShowAddPaymentModal(true);
		}

		if (user && typeof user === "object") {
			// Handle both old and new API structures
			const userSubscription = user.membership?.subscription || user.subscription || "free";
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


			// Load payment methods
			loadPaymentMethods();
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
			// Updated price to reflect the new API documentation (PHP 560)
			price: "₱560",
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
			// Updated price to reflect the new API documentation (PHP 1120)
			price: "₱1,120",
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
			setPurchaseLoading(true); // Set purchase loading state

			if (planId !== "free") {
				// Find default payment method
				const defaultPaymentMethod = paymentMethods.find(method => method.isDefault) || paymentMethods[0];

				if (!defaultPaymentMethod) {
					setMessage("Please add a payment method before upgrading to a paid plan.");
					setMessageType("warning");
					setShowAddPaymentModal(true);
					return;
				}

				// Use payment API for membership purchase
				const purchaseResponse = await paymentAPI.purchaseMembership({
					subscription: planId,
					paymentMethodId: defaultPaymentMethod.id
				});

				if (isSignupFlow) {
					setMessage(`Account created successfully with ${planId} plan! Redirecting to email verification...`);
					setMessageType("success");

					// Clear pending signup data
					sessionStorage.removeItem('pendingSignupData');

					// Redirect to verification after payment success
					setTimeout(() => {
						if (pendingSignupData) {
							navigate(
								`/auth/verify/${pendingSignupData.verificationId}?email=${encodeURIComponent(pendingSignupData.email)}`,
							);
						}
					}, 2000);
				} else {
					setMessage(`Successfully upgraded to ${planId} plan!`);
					setMessageType("success");
				}

				// Update local state with response data
				setSubscription((prev) => ({
					...prev,
					plan: planId,
					// The API response does not directly provide nextBillingDate, so we estimate it
					nextBilling: purchaseResponse.nextBilling || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
					features: {
						...prev.features,
						blueCheck: getBlueCheckStatus(planId),
						imageLimit: getImageLimit(planId),
					},
				}));
			} else {
				// Downgrade to free plan
				await userAPI.updateUser(user.username, {
					membership: {
						subscription: "free",
						nextBillingDate: null
					},
				});

				setMessage("Successfully downgraded to free plan!");
				setMessageType("success");

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
			}
		} catch (err) {
			console.error("Upgrade error:", err);
			setMessage(err.message || "Failed to upgrade subscription");
			setMessageType("danger");
		} finally {
			setPurchaseLoading(false); // Reset purchase loading state
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
													disabled={loading || purchaseLoading}
												>
													{purchaseLoading ? "Processing..." :
													 plan.id === "free" ? "Downgrade" : 
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
										className="d-flex justify-content-between align-items-center gap-3"
									>
										<div className="d-flex align-items-center gap-3">
											{method.type === 'paypal_wallet' ? (
												<Paypal size={24} className="text-primary" />
											) : (
												<CreditCard size={24} />
											)}
											<div>
												{method.type === 'paypal_wallet' ? (
													<>
														<h6 className="mb-0">PayPal Wallet</h6>
														<small className="text-muted">
															{method.paypalEmail || 'Connected Account'}
														</small>
													</>
												) : method.type === 'paypal_card' ? (
													<>
														<h6 className="mb-0">**** **** **** {method.last4}</h6>
														<small className="text-muted">
															PayPal Card • Expires {method.expiryMonth}/{method.expiryYear}
														</small>
													</>
												) : (
													<>
														<h6 className="mb-0">**** **** **** {method.last4}</h6>
														<small className="text-muted">
															{method.provider} • Expires {method.expiryMonth}/{method.expiryYear}
														</small>
													</>
												)}
											</div>
										</div>
										<div className="d-grid gap-2">
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
										<span>Credit/Debit Card (PayPal)</span>
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
										<span>PayPal Wallet</span>
									</div>
								}
								checked={selectedPaymentType === "paypal"}
								onChange={() => setSelectedPaymentType("paypal")}
							/>
						</div>
					</Form.Group>

					{selectedPaymentType === "card" ? (
						<div>
							<div className="text-center py-3 mb-4">
								<CreditCard size={48} className="text-primary mb-3" />
								<h6>Add Credit/Debit Card via PayPal</h6>
								<p className="text-muted mb-3">
									You'll be redirected to PayPal to securely link your card
								</p>
							</div>

							{/* PayPal Card Container */}
							<div id="paypal-card-container" className="mb-4"></div>

							<Form.Check
								type="checkbox"
								label="Set as default payment method"
								checked={cardForm.isDefault}
								onChange={(e) => setCardForm(prev => ({ ...prev, isDefault: e.target.checked }))}
								className="mb-3"
							/>

							<div className="bg-light p-3 rounded">
								<small className="text-muted">
									<strong>Secure:</strong> Your card details are processed directly by PayPal. 
									We never store your card information on our servers.
								</small>
							</div>
						</div>
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
					<Button variant="primary" onClick={handleAddPaymentMethod} disabled={loading}>
						{loading ? "Processing..." : 
						 selectedPaymentType === "card" ? "Link Card via PayPal" : "Connect PayPal"}
					</Button>
				</Modal.Footer>
			</Modal>
		</Container>
	);
};

export default SubscriptionPage;
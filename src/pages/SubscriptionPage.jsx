
/** @format */

import { useState, useEffect } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";
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
	Tab,
	Tabs 
} from "react-bootstrap";
import { 
	CreditCard, 
	Shield, 
	Star, 
	CheckCircle, 
	XCircle, 
	Calendar,
	Gift,
	Crown,
	Image as ImageIcon
} from "react-bootstrap-icons";

import { userAPI } from "../config/ApiConfig";

const SubscriptionPage = () => {
	const loaderData = useLoaderData() || {};
	const { user } = loaderData;
	const navigate = useNavigate();
	
	const [subscription, setSubscription] = useState({
		plan: "free",
		status: "active",
		nextBilling: null,
		features: {
			blueCheck: false,
			imageLimit: 3,
			nameChangeLimit: true,
			lastNameChange: null
		}
	});
	
	const [paymentMethods, setPaymentMethods] = useState([]);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState("success");
	const [showCancelModal, setShowCancelModal] = useState(false);
	const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

	// Helper functions
	const getImageLimit = (plan) => {
		switch (plan) {
			case "premium": return 10;
			case "pro": return "unlimited";
			default: return 3;
		}
	};

	const checkNameChangeLimit = (lastChange) => {
		if (!lastChange) return false;
		const fourteenDaysAgo = new Date();
		fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
		return new Date(lastChange) > fourteenDaysAgo;
	};

	const getDaysUntilNameChange = (lastChange) => {
		if (!lastChange) return 0;
		const changeDate = new Date(lastChange);
		const fourteenDaysLater = new Date(changeDate);
		fourteenDaysLater.setDate(fourteenDaysLater.getDate() + 14);
		const now = new Date();
		const diffTime = fourteenDaysLater - now;
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return Math.max(0, diffDays);
	};

	useEffect(() => {
		if (user && typeof user === 'object') {
			const userSubscription = user?.subscription || "free";
			setSubscription({
				plan: userSubscription,
				status: "active",
				nextBilling: user?.nextBilling || null,
				features: {
					blueCheck: user?.hasBlueCheck || false,
					imageLimit: getImageLimit(userSubscription),
					nameChangeLimit: checkNameChangeLimit(user.lastNameChange),
					lastNameChange: user?.lastNameChange || null
				}
			});
		}
	}, [user]);

	if (!user || typeof user !== 'object') {
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
				"Standard support"
			],
			color: "secondary"
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
				"Advanced privacy settings"
			],
			color: "primary"
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
				"Early access to features"
			],
			color: "warning"
		}
	];

	const handleUpgrade = async (planId) => {
		try {
			setLoading(true);
			// In a real app, this would integrate with Stripe or similar
			await userAPI.updateUser(user.username, { 
				subscription: planId,
				hasBlueCheck: planId !== "free"
			});
			setMessage(`Successfully upgraded to ${planId} plan!`);
			setMessageType("success");
			// Refresh user data
			window.location.reload();
		} catch (err) {
			setMessage(err.message || 'Failed to upgrade subscription');
			setMessageType("danger");
		} finally {
			setLoading(false);
		}
	};

	const handleFeatureToggle = async (feature, value) => {
		try {
			setLoading(true);
			const updateData = {};
			
			if (feature === "blueCheck") {
				// Only allow blue check for premium/pro users
				if (subscription.plan === "free" && value) {
					setMessage("Blue check is only available for Premium and Pro users");
					setMessageType("warning");
					return;
				}
				updateData.hasBlueCheck = value;
			}
			
			await userAPI.updateUser(user.username, updateData);
			setSubscription(prev => ({
				...prev,
				features: { ...prev.features, [feature]: value }
			}));
			setMessage("Feature updated successfully!");
			setMessageType("success");
		} catch (err) {
			setMessage(err.message || 'Failed to update feature');
			setMessageType("danger");
		} finally {
			setLoading(false);
		}
	};

	const handleCancelSubscription = async () => {
		try {
			setLoading(true);
			await userAPI.updateUser(user.username, { 
				subscription: "free",
				hasBlueCheck: false
			});
			setMessage("Subscription cancelled successfully. You'll retain access until the end of your billing period.");
			setMessageType("info");
			setShowCancelModal(false);
			// Refresh user data
			window.location.reload();
		} catch (err) {
			setMessage(err.message || 'Failed to cancel subscription');
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
					className="mx-3 mb-4">
					{message}
				</Alert>
			)}

			<Tabs defaultActiveKey="subscription" className="mb-4">
				{/* Subscription Tab */}
				<Tab eventKey="subscription" title="Subscription">
					{/* Current Plan */}
					<Card className="mb-4">
						<Card.Header className="d-flex align-items-center justify-content-between">
							<div className="d-flex align-items-center gap-2">
								<Crown size={20} />
								<h5 className="mb-0">Current Plan</h5>
							</div>
							<Badge bg={subscriptionPlans.find(p => p.id === subscription.plan)?.color || "secondary"}>
								{subscription.plan.toUpperCase()}
							</Badge>
						</Card.Header>
						<Card.Body className="px-3">
							<Row>
								<Col md={8}>
									<h4 className="text-capitalize mb-2">{subscription.plan} Plan</h4>
									<p className="text-muted mb-3">
										{subscription.plan === "free" 
											? "Enjoy basic features at no cost"
											: `Next billing: ${subscription.nextBilling || "Not set"}`
										}
									</p>
									<div className="mb-3">
										<h6>Current Features:</h6>
										<ul className="list-unstyled">
											<li className="d-flex align-items-center gap-2 mb-1">
												<ImageIcon size={16} />
												{subscription.features.imageLimit === "unlimited" 
													? "Unlimited images per post"
													: `${subscription.features.imageLimit} images per post`
												}
											</li>
											<li className="d-flex align-items-center gap-2 mb-1">
												{subscription.features.blueCheck ? 
													<CheckCircle size={16} className="text-success" /> :
													<XCircle size={16} className="text-muted" />
												}
												Blue check verification
											</li>
											<li className="d-flex align-items-center gap-2 mb-1">
												<Calendar size={16} />
												Name changes: {subscription.features.nameChangeLimit 
													? `Available in ${getDaysUntilNameChange(subscription.features.lastNameChange)} days`
													: "Available now"
												}
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
								{subscriptionPlans.map(plan => (
									<Col md={4} key={plan.id} className="mb-3">
										<Card className={`h-100 ${subscription.plan === plan.id ? 'border-primary' : ''}`}>
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
														<li key={idx} className="d-flex align-items-center gap-2 mb-2">
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
														{plan.id === "free" ? "Downgrade" : "Upgrade"}
													</Button>
												)}
											</Card.Footer>
										</Card>
									</Col>
								))}
							</Row>
						</Card.Body>
					</Card>
				</Tab>

				{/* Features Tab */}
				<Tab eventKey="features" title="Features">
					<Card className="mb-4">
						<Card.Header>
							<h5 className="mb-0">Feature Controls</h5>
						</Card.Header>
						<Card.Body className="px-3">
							<ListGroup variant="flush">
								<ListGroup.Item className="d-flex justify-content-between align-items-center">
									<div>
										<h6 className="mb-1">Blue Check Verification</h6>
										<small className="text-muted">
											{subscription.plan === "free" 
												? "Upgrade to Premium or Pro to enable"
												: "Show verification badge on your profile"
											}
										</small>
									</div>
									<Form.Check
										type="switch"
										checked={subscription.features.blueCheck}
										onChange={(e) => handleFeatureToggle("blueCheck", e.target.checked)}
										disabled={subscription.plan === "free" || loading}
									/>
								</ListGroup.Item>
								
								<ListGroup.Item>
									<div>
										<h6 className="mb-1">Image Upload Limit</h6>
										<small className="text-muted">
											Current limit: {subscription.features.imageLimit === "unlimited" 
												? "Unlimited"
												: `${subscription.features.imageLimit} images`
											} per post
										</small>
										{subscription.plan === "free" && (
											<div className="mt-2">
												<small className="text-warning">
													Upgrade to Premium (10 images) or Pro (unlimited) for more uploads
												</small>
											</div>
										)}
									</div>
								</ListGroup.Item>

								<ListGroup.Item>
									<div>
										<h6 className="mb-1">Name Change</h6>
										<small className="text-muted">
											{subscription.features.nameChangeLimit 
												? `You can change your name again in ${getDaysUntilNameChange(subscription.features.lastNameChange)} days`
												: "You can change your display name now"
											}
										</small>
										<div className="mt-2">
											<small className="text-info">
												Name changes are limited to once every 14 days
											</small>
										</div>
									</div>
								</ListGroup.Item>
							</ListGroup>
						</Card.Body>
					</Card>
				</Tab>

				{/* Payment Methods Tab */}
				<Tab eventKey="payment" title="Payment Methods">
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
										<ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center">
											<div className="d-flex align-items-center gap-3">
												<CreditCard size={24} />
												<div>
													<h6 className="mb-0">**** **** **** {method.last4}</h6>
													<small className="text-muted">{method.brand} • Expires {method.expiry}</small>
												</div>
											</div>
											<div className="d-flex gap-2">
												{method.isDefault && (
													<Badge bg="success">Default</Badge>
												)}
												<Button variant="outline-danger" size="sm">
													Remove
												</Button>
											</div>
										</ListGroup.Item>
									))}
								</ListGroup>
							)}
						</Card.Body>
					</Card>
				</Tab>
			</Tabs>

			{/* Cancel Subscription Modal */}
			<Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
				<Modal.Header closeButton>
					<Modal.Title className="text-danger">Cancel Subscription</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p>Are you sure you want to cancel your {subscription.plan} subscription?</p>
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
						Your subscription will remain active until the end of your current billing period.
					</p>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setShowCancelModal(false)}>
						Keep Subscription
					</Button>
					<Button variant="danger" onClick={handleCancelSubscription} disabled={loading}>
						{loading ? "Cancelling..." : "Cancel Subscription"}
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Add Payment Method Modal */}
			<Modal show={showAddPaymentModal} onHide={() => setShowAddPaymentModal(false)} centered>
				<Modal.Header closeButton>
					<Modal.Title>Add Payment Method</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form>
						<Form.Group className="mb-3">
							<Form.Label>Card Number</Form.Label>
							<Form.Control 
								type="text" 
								placeholder="1234 5678 9012 3456"
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
							/>
						</Form.Group>
						<Form.Check
							type="checkbox"
							label="Set as default payment method"
							className="mb-3"
						/>
					</Form>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setShowAddPaymentModal(false)}>
						Cancel
					</Button>
					<Button variant="primary">
						Add Payment Method
					</Button>
				</Modal.Footer>
			</Modal>
		</Container>
	);
};

export default SubscriptionPage;


import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { Star, Heart, Gift, CreditCard } from 'react-bootstrap-icons';
import { subscriptionAPI, paymentAPI } from '../config/ApiConfig';

const UserSubscriptionModal = ({ show, onHide, targetUser, currentUser }) => {
  const [subscriptionTiers, setSubscriptionTiers] = useState([]);
  const [selectedTier, setSelectedTier] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    if (show && targetUser) {
      loadSubscriptionTiers();
      loadPaymentMethods();
    }
  }, [show, targetUser]);

  const loadSubscriptionTiers = async () => {
    try {
      setLoading(true);
      // Try to load from API, fallback to mock data
      try {
        const response = await subscriptionAPI.getSubscriptionTiers?.(targetUser.uid);
        setSubscriptionTiers(response.tiers || []);
      } catch (apiError) {
        console.warn('API not available, using default tiers:', apiError);
        // Fallback to default tiers
        const tiers = [
          {
            id: 'basic',
            name: 'Basic Support',
            price: 100, // in USD cents
            description: 'Show your support',
            benefits: ['Access to subscriber-only posts', 'Monthly thank you message']
          },
          {
            id: 'premium',
            name: 'Premium Support',
            price: 500,
            description: 'Strong support',
            benefits: ['All basic benefits', 'Exclusive content', 'Direct messaging access']
          },
          {
            id: 'vip',
            name: 'VIP Support',
            price: 1000,
            description: 'Maximum support',
            benefits: ['All premium benefits', 'Monthly video call', 'Priority responses']
          }
        ];
        setSubscriptionTiers(tiers);
      }
    } catch (error) {
      console.error('Failed to load subscription tiers:', error);
      setMessage('Failed to load subscription options');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await paymentAPI.getPaymentMethods();
      setPaymentMethods(response.paymentMethods || []);
      if (response.paymentMethods?.length > 0) {
        const defaultMethod = response.paymentMethods.find(m => m.isDefault) || response.paymentMethods[0];
        setSelectedPaymentMethod(defaultMethod.id);
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedTier || !selectedPaymentMethod) {
      setMessage('Please select a subscription tier and payment method');
      setMessageType('warning');
      return;
    }

    try {
      setSubscribing(true);
      setMessage('');

      const subscriptionData = {
        creatorId: targetUser.uid,
        tierId: selectedTier.id,
        paymentMethodId: selectedPaymentMethod
      };

      await subscriptionAPI.subscribeToCreator(subscriptionData);

      setMessage(`Successfully subscribed to ${targetUser.name}!`);
      setMessageType('success');

      setTimeout(() => {
        onHide();
      }, 2000);

    } catch (error) {
      console.error('Subscription failed:', error);
      setMessage(error.message || 'Failed to create subscription');
      setMessageType('danger');
    } finally {
      setSubscribing(false);
    }
  };

  if (!targetUser) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" fullscreen="md-down" centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <Heart className="text-danger" />
          Subscribe to {targetUser.name}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {message && (
          <Alert variant={messageType} className="mb-3">
            {message}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <div className="mt-2">Loading subscription options...</div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h6>Choose your support level</h6>
              <Row className="g-3">
                {subscriptionTiers.map((tier) => (
                  <Col md={4} key={tier.id}>
                    <Card 
                      className={`h-100 cursor-pointer ${selectedTier?.id === tier.id ? 'border-primary shadow' : ''}`}
                      onClick={() => setSelectedTier(tier)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Body className="text-center">
                        <div className="mb-2">
                          {tier.id === 'basic' && <Star className="text-warning" size={24} />}
                          {tier.id === 'premium' && <Gift className="text-primary" size={24} />}
                          {tier.id === 'vip' && <Heart className="text-danger" size={24} />}
                        </div>
                        <h6>{tier.name}</h6>
                        <h4 className="text-primary">${(tier.price / 100).toFixed(2)}</h4>
                        <small className="text-muted">/month</small>
                        <p className="mt-2 small">{tier.description}</p>
                        <ul className="list-unstyled small text-start">
                          {tier.benefits.map((benefit, idx) => (
                            <li key={idx} className="mb-1">• {benefit}</li>
                          ))}
                        </ul>
                        <Form.Check
                          type="radio"
                          name="tier"
                          checked={selectedTier?.id === tier.id}
                          onChange={() => setSelectedTier(tier)}
                          className="mt-3"
                        />
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>

            {paymentMethods.length > 0 && (
              <div className="mb-4">
                <h6>Payment method</h6>
                <Form.Select
                  value={selectedPaymentMethod || ''}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                >
                  <option value="">Select payment method</option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.type === 'paypal_wallet' ? 'PayPal Wallet' : `**** ${method.last4}`}
                      {method.isDefault && ' (Default)'}
                    </option>
                  ))}
                </Form.Select>
              </div>
            )}

            {paymentMethods.length === 0 && (
              <Alert variant="warning">
                <CreditCard className="me-2" />
                You need to add a payment method before subscribing.
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  className="ms-2"
                  onClick={() => window.location.href = '/subscription'}
                >
                  Add Payment Method
                </Button>
              </Alert>
            )}
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubscribe}
          disabled={!selectedTier || !selectedPaymentMethod || subscribing || paymentMethods.length === 0}
        >
          {subscribing ? (
            <>
              <Spinner size="sm" className="me-2" />
              Subscribing...
            </>
          ) : (
            `Subscribe for $${selectedTier ? (selectedTier.price / 100).toFixed(2) : '0.00'}/month`
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UserSubscriptionModal;

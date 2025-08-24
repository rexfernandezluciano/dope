
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Row, Col, Badge, Alert, Spinner, Modal } from 'react-bootstrap';
import { Heart, Calendar, CurrencyDollar, XCircle } from 'react-bootstrap-icons';
import { subscriptionAPI } from '../config/ApiConfig';
import { useNavigate } from 'react-router-dom';

const MySubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSubscriptions();
    loadSubscribers();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const response = await subscriptionAPI.getCreatorSubscriptions();
      setSubscriptions(response.subscriptions || []);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    }
  };

  const loadSubscribers = async () => {
    try {
      const response = await subscriptionAPI.getSubscribers();
      setSubscribers(response.subscribers || []);
    } catch (error) {
      console.error('Failed to load subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      await subscriptionAPI.unsubscribeFromCreator(selectedSubscription.creatorId);
      setMessage('Subscription cancelled successfully');
      setMessageType('success');
      setShowCancelModal(false);
      loadSubscriptions();
    } catch (error) {
      setMessage(error.message || 'Failed to cancel subscription');
      setMessageType('danger');
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <div className="mt-2">Loading subscriptions...</div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">My Subscriptions</h2>

      {message && (
        <Alert variant={messageType} dismissible onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      {/* My Subscriptions */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Creators I Support</h5>
        </Card.Header>
        <Card.Body>
          {subscriptions.length === 0 ? (
            <div className="text-center py-4">
              <Heart size={48} className="text-muted mb-3" />
              <p className="text-muted">You're not subscribed to any creators yet</p>
              <Button variant="primary" onClick={() => navigate('/search?tab=users')}>
                Discover Creators
              </Button>
            </div>
          ) : (
            <Row className="g-3">
              {subscriptions.map((subscription) => (
                <Col md={6} key={subscription.id}>
                  <Card className="h-100">
                    <Card.Body>
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <img
                          src={subscription.creator.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(subscription.creator.name)}&size=50`}
                          alt={subscription.creator.name}
                          className="rounded-circle"
                          width="50"
                          height="50"
                          style={{ objectFit: 'cover' }}
                        />
                        <div>
                          <h6 className="mb-1">{subscription.creator.name}</h6>
                          <small className="text-muted">@{subscription.creator.username}</small>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <Badge bg="primary" className="me-2">
                          {subscription.tier.name}
                        </Badge>
                        <Badge bg="success">
                          ₱{(subscription.tier.price / 100).toFixed(2)}/month
                        </Badge>
                      </div>

                      <div className="d-flex align-items-center gap-2 mb-3 text-muted">
                        <Calendar size={14} />
                        <small>Since {new Date(subscription.createdAt).toLocaleDateString()}</small>
                      </div>

                      <div className="d-flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/${subscription.creator.username}`)}
                        >
                          View Profile
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setShowCancelModal(true);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* My Subscribers */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">My Subscribers</h5>
        </Card.Header>
        <Card.Body>
          {subscribers.length === 0 ? (
            <div className="text-center py-4">
              <CurrencyDollar size={48} className="text-muted mb-3" />
              <p className="text-muted">No subscribers yet</p>
              <small className="text-muted">Share your profile to start getting supporters!</small>
            </div>
          ) : (
            <Row className="g-3">
              {subscribers.map((subscriber) => (
                <Col md={6} key={subscriber.id}>
                  <Card>
                    <Card.Body>
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <img
                          src={subscriber.user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(subscriber.user.name)}&size=40`}
                          alt={subscriber.user.name}
                          className="rounded-circle"
                          width="40"
                          height="40"
                          style={{ objectFit: 'cover' }}
                        />
                        <div>
                          <h6 className="mb-1">{subscriber.user.name}</h6>
                          <small className="text-muted">@{subscriber.user.username}</small>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <Badge bg="primary" className="me-2">
                          {subscriber.tier.name}
                        </Badge>
                        <Badge bg="success">
                          ₱{(subscriber.tier.price / 100).toFixed(2)}/month
                        </Badge>
                      </div>

                      <div className="d-flex align-items-center gap-2 text-muted">
                        <Calendar size={14} />
                        <small>Since {new Date(subscriber.createdAt).toLocaleDateString()}</small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Cancel Subscription Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Cancel Subscription</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSubscription && (
            <>
              <p>Are you sure you want to cancel your subscription to <strong>{selectedSubscription.creator.name}</strong>?</p>
              <div className="bg-light p-3 rounded">
                <p className="mb-0">You will lose access to:</p>
                <ul className="mb-0">
                  {selectedSubscription.tier.benefits?.map((benefit, idx) => (
                    <li key={idx}>{benefit}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Keep Subscription
          </Button>
          <Button variant="danger" onClick={handleCancelSubscription}>
            <XCircle className="me-1" />
            Cancel Subscription
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MySubscriptionsPage;

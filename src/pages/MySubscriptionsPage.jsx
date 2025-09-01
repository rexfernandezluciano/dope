import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Button,
  Row,
  Col,
  Badge,
  Alert,
  Spinner,
  Modal,
} from "react-bootstrap";
import {
  Heart,
  Calendar,
  XCircle,
  CameraVideo,
} from "react-bootstrap-icons";
import { useLoaderData } from "react-router-dom";
import { Adsense } from "@ctrl/react-adsense"
import { subscriptionAPI } from "../config/ApiConfig";
import { useNavigate } from "react-router-dom";

const MySubscriptionsPage = () => {
  const { user } = useLoaderData();
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
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
      console.error("Failed to load subscriptions:", error);
      if (error.status === 404) {
        setMessage("Subscription API not available. Please try again later.");
        setMessageType("warning");
      }
      setSubscriptions([]); // Set empty array on error
    }
  };

  const loadSubscribers = async () => {
    try {
      const response = await subscriptionAPI.getSubscribers();
      setSubscribers(response.subscribers || []);
    } catch (error) {
      console.error("Failed to load subscribers:", error);
      if (error.status === 404) {
        setMessage("Subscription API not available. Please try again later.");
        setMessageType("warning");
      }
      setSubscribers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      await subscriptionAPI.unsubscribeFromCreator(
        selectedSubscription.creatorId,
      );
      setMessage("Subscription cancelled successfully");
      setMessageType("success");
      setShowCancelModal(false);
      loadSubscriptions();
    } catch (error) {
      setMessage(error.message || "Failed to cancel subscription");
      setMessageType("danger");
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
      <h2 className="mb-4 px-4">My Subscriptions</h2>

      {message && (
        <Alert variant={messageType} dismissible onClose={() => setMessage("")}>
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
              <p className="text-muted">
                You're not subscribed to any creators yet
              </p>
              <Button
                variant="primary"
                onClick={() => navigate("/search?tab=users")}
              >
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
                          src={
                            subscription.creator.photoURL ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(subscription.creator.name)}&size=50`
                          }
                          alt={subscription.creator.name}
                          className="rounded-circle"
                          width="50"
                          height="50"
                          style={{ objectFit: "cover" }}
                        />
                        <div>
                          <h6 className="mb-1">{subscription.creator.name}</h6>
                          <small className="text-muted">
                            @{subscription.creator.username}
                          </small>
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
                        <small>
                          Since{" "}
                          {new Date(
                            subscription.createdAt,
                          ).toLocaleDateString()}
                        </small>
                      </div>

                      <div className="d-flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            navigate(`/${subscription.creator.username}`)
                          }
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

      {/* Note: Subscribers section moved to Creator Dashboard */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Analytics Dashboard</h5>
        </Card.Header>
        <Card.Body className="text-center py-4">
          <CameraVideo size={48} className="text-muted mb-3" />
          <p className="text-muted mb-3">
            Want to see your subscribers and detailed analytics?
          </p>
          <Button variant="primary" onClick={() => navigate("/analytics")}>
            Go to Analytics Dashboard
          </Button>
        </Card.Body>
      </Card>

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
          {selectedSubscription && (
            <>
              <p>
                Are you sure you want to cancel your subscription to{" "}
                <strong>{selectedSubscription.creator.name}</strong>?
              </p>
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
      
      {/* <!-- banner_ad --> */}
      {user.membership?.subscription === "free" && (
        <Adsense
          client="ca-pub-1106169546112879"
          slot="2596463814"
          style={{ display: "block" }}
          format="auto"
        />
      )}
    </Container>
  );
};

export default MySubscriptionsPage;

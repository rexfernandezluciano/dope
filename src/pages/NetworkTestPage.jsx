import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { Wifi, Activity, Globe, Shield } from 'react-bootstrap-icons';
import NetworkTest from '../components/NetworkTest';
import EndpointStatus from '../components/EndpointStatus';
import { updatePageMeta, pageMetaData } from '../utils/meta-utils';

const NetworkTestPage = () => {
  React.useEffect(() => {
    updatePageMeta({
      ...pageMetaData.networkTest,
      title: 'Network Diagnostics - DOPE Social Network'
    });
  }, []);

  return (
    <Container fluid className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} lg={10} xl={8}>
          {/* Header */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="text-center py-4">
              <div className="mb-3">
                <Activity size={48} className="text-primary" />
              </div>
              <h2 className="fw-bold mb-2">API Testing</h2>
              <p className="text-muted mb-3">
                Simple API connectivity testing using Axios
              </p>
              <div className="d-flex justify-content-center gap-2 flex-wrap">
                <Badge bg="light" text="dark" className="d-flex align-items-center gap-1">
                  <Wifi size={14} />
                  Connectivity Tests
                </Badge>
                <Badge bg="light" text="dark" className="d-flex align-items-center gap-1">
                  <Globe size={14} />
                  DNS Resolution
                </Badge>
                <Badge bg="light" text="dark" className="d-flex align-items-center gap-1">
                  <Shield size={14} />
                  API Health Checks
                </Badge>
              </div>
            </Card.Body>
          </Card>

          {/* Endpoint Status and Network Test Components */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0 d-flex align-items-center">
                <Activity className="me-2 text-primary" />
                API Testing Tools
              </h5>
            </Card.Header>
            <Card.Body>
              <EndpointStatus />
              <NetworkTest />
            </Card.Body>
          </Card>

          {/* Information Cards */}
          <Row className="mt-4 g-3">
            <Col md={4}>
              <Card className="border-0 bg-primary bg-opacity-10 h-100">
                <Card.Body className="text-center">
                  <Wifi size={32} className="text-primary mb-2" />
                  <h6 className="fw-bold">Quick Tests</h6>
                  <small className="text-muted">
                    Fast connectivity checks to verify basic internet access and API reachability
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 bg-success bg-opacity-10 h-100">
                <Card.Body className="text-center">
                  <Globe size={32} className="text-success mb-2" />
                  <h6 className="fw-bold">DNS Tests</h6>
                  <small className="text-muted">
                    Domain name resolution testing to ensure the API endpoints are accessible
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 bg-warning bg-opacity-10 h-100">
                <Card.Body className="text-center">
                  <Shield size={32} className="text-warning mb-2" />
                  <h6 className="fw-bold">Full Diagnostics</h6>
                  <small className="text-muted">
                    Comprehensive testing including CORS, health checks, and endpoint validation
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Troubleshooting Guide */}
          <Card className="border-0 shadow-sm mt-4">
            <Card.Header className="bg-light">
              <h6 className="mb-0">Common Issues & Solutions</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6 className="text-danger">❌ Connection Failed</h6>
                  <ul className="small text-muted">
                    <li>Check your internet connection</li>
                    <li>Try refreshing the page</li>
                    <li>Verify you're not behind a firewall</li>
                    <li>Check if the domain is blocked</li>
                  </ul>
                </Col>
                <Col md={6}>
                  <h6 className="text-warning">⚠️ Partial Connectivity</h6>
                  <ul className="small text-muted">
                    <li>Some endpoints may be down</li>
                    <li>CORS policy issues</li>
                    <li>API server maintenance</li>
                    <li>Network restrictions</li>
                  </ul>
                </Col>
              </Row>
              <hr />
              <div className="text-center">
                <small className="text-muted">
                  If all tests fail consistently, the API server may be experiencing issues.
                  Contact support if the problem persists.
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default NetworkTestPage;
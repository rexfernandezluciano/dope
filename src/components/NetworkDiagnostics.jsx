import React, { useState } from 'react';
import { Button, Alert, Card, Badge } from 'react-bootstrap';
import axios from 'axios';

const NetworkDiagnostics = () => {
  const [tests, setTests] = useState({
    apiConnectivity: { status: 'pending', message: '', timestamp: null },
    apiHealth: { status: 'pending', message: '', timestamp: null },
  });

  const [running, setRunning] = useState(false);

  const API_ENDPOINTS = [
    "https://api.dopp.eu.org/v1",
    "https://social.dopp.eu.org/v1"
  ];

  const updateTest = (testName, status, message) => {
    setTests(prev => ({
      ...prev,
      [testName]: {
        status,
        message,
        timestamp: new Date().toISOString()
      }
    }));
  };

  const testApiConnectivity = async () => {
    try {
      updateTest('apiConnectivity', 'running', 'Testing API connectivity...');

      let workingEndpoints = [];
      let failedEndpoints = [];

      for (const endpoint of API_ENDPOINTS) {
        try {
          const startTime = Date.now();
          const response = await axios.get(endpoint, { timeout: 5000 });
          const duration = Date.now() - startTime;

          const url = new URL(endpoint);
          workingEndpoints.push(`${url.hostname} (${duration}ms)`);
        } catch (error) {
          const url = new URL(endpoint);
          failedEndpoints.push(`${url.hostname}: ${error.message}`);
        }
      }

      if (workingEndpoints.length > 0) {
        updateTest('apiConnectivity', 'success', 
          `API servers reachable: ${workingEndpoints.join(', ')}`);
      } else {
        updateTest('apiConnectivity', 'error', 
          `All API servers unreachable: ${failedEndpoints.join('; ')}`);
      }
    } catch (error) {
      updateTest('apiConnectivity', 'error', 
        `API connectivity test failed: ${error.message}`);
    }
  };

  const testApiHealth = async () => {
    try {
      updateTest('apiHealth', 'running', 'Testing API health endpoints...');

      let workingHealthChecks = [];
      let failedHealthChecks = [];

      for (const endpoint of API_ENDPOINTS) {
        try {
          const response = await axios.get(`${endpoint}/health`, { timeout: 8000 });

          if (response.status === 200) {
            const url = new URL(endpoint);
            workingHealthChecks.push(`${url.hostname} (${response.status})`);
          } else {
            const url = new URL(endpoint);
            failedHealthChecks.push(`${url.hostname}: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          const url = new URL(endpoint);
          failedHealthChecks.push(`${url.hostname}: ${error.message}`);
        }
      }

      if (workingHealthChecks.length > 0) {
        updateTest('apiHealth', 'success', 
          `Health endpoints working: ${workingHealthChecks.join(', ')}`);
      } else {
        updateTest('apiHealth', 'error', 
          `All health endpoints failed: ${failedHealthChecks.join('; ')}`);
      }
    } catch (error) {
      updateTest('apiHealth', 'error', 
        `Health check test failed: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    setRunning(true);

    // Reset all tests
    Object.keys(tests).forEach(testName => {
      updateTest(testName, 'pending', 'Waiting...');
    });

    try {
      await testApiConnectivity();
      await testApiHealth();
    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setRunning(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success': return <Badge bg="success">✓ Pass</Badge>;
      case 'error': return <Badge bg="danger">✗ Fail</Badge>;
      case 'running': return <Badge bg="warning">⟳ Running</Badge>;
      default: return <Badge bg="secondary">⏳ Pending</Badge>;
    }
  };

  return (
    <Card className="mt-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h6 className="mb-0">API Diagnostics</h6>
        <Button 
          variant="outline-primary" 
          size="sm" 
          onClick={runAllTests} 
          disabled={running}
        >
          {running ? 'Running Tests...' : 'Run Tests'}
        </Button>
      </Card.Header>

      <Card.Body>
        {Object.entries(tests).map(([testName, test]) => (
          <div key={testName} className="mb-2">
            <div className="d-flex justify-content-between align-items-start">
              <div className="flex-grow-1">
                <strong>{testName.replace(/([A-Z])/g, ' $1').toLowerCase()}</strong>
                <div className="small text-muted mt-1">{test.message}</div>
                {test.timestamp && (
                  <div className="small text-muted">
                    {new Date(test.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
              <div className="ms-2">
                {getStatusBadge(test.status)}
              </div>
            </div>
            <hr className="my-2" />
          </div>
        ))}

        <Alert variant="info" className="small mt-3">
          <strong>Using Axios for HTTP requests</strong>
          <p className="mb-0 mt-1">
            This simplified diagnostic tool uses axios to test API connectivity and health endpoints.
          </p>
        </Alert>
      </Card.Body>
    </Card>
  );
};

export default NetworkDiagnostics;

import React, { useState, useEffect } from 'react';
import { Button, Alert, Spinner, Card, Badge } from 'react-bootstrap';

const NetworkDiagnostics = () => {
  const [tests, setTests] = useState({
    internetConnectivity: { status: 'pending', message: '', timestamp: null },
    dnsResolution: { status: 'pending', message: '', timestamp: null },
    apiReachability: { status: 'pending', message: '', timestamp: null },
    corsPolicy: { status: 'pending', message: '', timestamp: null },
    healthCheck: { status: 'pending', message: '', timestamp: null },
  });
  
  const [running, setRunning] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || "https://api.dopp.eu.org/v1";

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

  const testInternetConnectivity = async () => {
    try {
      updateTest('internetConnectivity', 'running', 'Testing internet connectivity...');
      
      // Check if browser reports online status
      if (!navigator.onLine) {
        updateTest('internetConnectivity', 'error', 'Browser reports offline status');
        return;
      }

      // Test connectivity to multiple reliable endpoints
      const testEndpoints = [
        'https://www.google.com/favicon.ico',
        'https://cloudflare.com/favicon.ico',
        'https://github.com/favicon.ico'
      ];

      const startTime = Date.now();
      let successfulTests = 0;

      for (const endpoint of testEndpoints) {
        try {
          await fetch(endpoint, { 
            method: 'HEAD', 
            mode: 'no-cors',
            signal: AbortSignal.timeout(3000)
          });
          successfulTests++;
        } catch (error) {
          console.log(`Connectivity test failed for ${endpoint}:`, error.message);
        }
      }

      const duration = Date.now() - startTime;

      if (successfulTests > 0) {
        updateTest('internetConnectivity', 'success', 
          `Internet connectivity confirmed (${successfulTests}/${testEndpoints.length} tests passed) in ${duration}ms`);
      } else {
        updateTest('internetConnectivity', 'error', 
          'No internet connectivity detected - all test endpoints failed');
      }
    } catch (error) {
      updateTest('internetConnectivity', 'error', 
        `Internet connectivity test failed: ${error.message}`);
    }
  };

  const testDnsResolution = async () => {
    try {
      updateTest('dnsResolution', 'running', 'Testing DNS resolution...');
      
      const url = new URL(API_BASE_URL);
      const hostname = url.hostname;
      
      // Try to resolve the hostname
      const startTime = Date.now();
      const response = await fetch(`https://${hostname}`, { 
        method: 'HEAD', 
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      });
      const duration = Date.now() - startTime;
      
      updateTest('dnsResolution', 'success', `DNS resolved in ${duration}ms`);
    } catch (error) {
      updateTest('dnsResolution', 'error', `DNS resolution failed: ${error.message}`);
    }
  };

  const testApiReachability = async () => {
    try {
      updateTest('apiReachability', 'running', 'Testing API server reachability...');
      
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(API_BASE_URL, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'DOPE-Network-Diagnostics/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      updateTest('apiReachability', 'success', 
        `API server reachable (${response.status} ${response.statusText}) in ${duration}ms`);
    } catch (error) {
      updateTest('apiReachability', 'error', 
        `API server unreachable: ${error.message}`);
    }
  };

  const testCorsPolicy = async () => {
    try {
      updateTest('corsPolicy', 'running', 'Testing CORS policy...');
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        signal: AbortSignal.timeout(8000)
      });
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
      };
      
      updateTest('corsPolicy', 'success', 
        `CORS policy allows requests. Headers: ${JSON.stringify(corsHeaders, null, 2)}`);
    } catch (error) {
      updateTest('corsPolicy', 'error', 
        `CORS policy test failed: ${error.message}`);
    }
  };

  const testHealthCheck = async () => {
    try {
      updateTest('healthCheck', 'running', 'Testing API health endpoint...');
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.text();
        updateTest('healthCheck', 'success', 
          `Health check passed: ${data.substring(0, 100)}`);
      } else {
        updateTest('healthCheck', 'error', 
          `Health check failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      updateTest('healthCheck', 'error', 
        `Health check error: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    setRunning(true);
    
    // Reset all tests
    Object.keys(tests).forEach(testName => {
      updateTest(testName, 'pending', 'Waiting...');
    });

    try {
      await testInternetConnectivity();
      await testDnsResolution();
      await testApiReachability();
      await testCorsPolicy();
      await testHealthCheck();
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

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <Card className="mt-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Network Diagnostics</h6>
        <Button 
          variant="outline-primary" 
          size="sm" 
          onClick={runAllTests} 
          disabled={running}
        >
          {running ? (
            <>
              <Spinner size="sm" className="me-1" />
              Running Tests...
            </>
          ) : (
            'Run Tests'
          )}
        </Button>
      </Card.Header>
      
      <Card.Body>
        <div className="mb-2">
          <small className="text-muted">API Base URL: {API_BASE_URL}</small>
        </div>
        
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
          <strong>Troubleshooting Tips:</strong>
          <ul className="mb-0 mt-1">
            <li>If internet connectivity fails: Check your network connection and try refreshing the page</li>
            <li>If DNS fails: Check if the API domain is accessible or try changing DNS servers</li>
            <li>If reachability fails: Check network connectivity and firewall settings</li>
            <li>If CORS fails: API server needs to allow your origin domain</li>
            <li>If health check fails: API server may be down or misconfigured</li>
          </ul>
        </Alert>
      </Card.Body>
    </Card>
  );
};

export default NetworkDiagnostics;

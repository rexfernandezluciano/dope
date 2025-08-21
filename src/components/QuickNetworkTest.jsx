import React, { useState } from 'react';
import { Button, Alert, Card } from 'react-bootstrap';
import axios from 'axios';

const QuickNetworkTest = () => {
  const [results, setResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const runQuickTest = async () => {
    setTesting(true);
    setResults([]);

    const testUrls = [
      { name: 'API Primary', url: 'https://api.dopp.eu.org/v1/health' },
      { name: 'API Secondary', url: 'https://social.dopp.eu.org/v1/health' }
    ];

    for (const test of testUrls) {
      try {
        const startTime = Date.now();
        const response = await axios.get(test.url, { timeout: 10000 });
        const duration = Date.now() - startTime;

        setResults(prev => [...prev, {
          name: test.name,
          status: 'success',
          message: `${response.status} ${response.statusText} (${duration}ms)`,
          details: test.url
        }]);
      } catch (error) {
        setResults(prev => [...prev, {
          name: test.name,
          status: 'error',
          message: error.message,
          details: test.url
        }]);
      }
    }

    setTesting(false);
  };

  return (
    <Card className="mt-3">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Quick API Test</h6>
          <Button variant="primary" size="sm" onClick={runQuickTest} disabled={testing}>
            {testing ? 'Testing...' : 'Run Test'}
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {results.map((result, index) => (
          <Alert 
            key={index} 
            variant={result.status === 'success' ? 'success' : 'danger'}
            className="mb-2 py-2"
          >
            <div className="d-flex justify-content-between">
              <strong>{result.name}</strong>
              <span className="small">{result.status === 'success' ? '✓' : '✗'}</span>
            </div>
            <div className="small">{result.message}</div>
            <div className="small text-muted">{result.details}</div>
          </Alert>
        ))}

        {results.length === 0 && !testing && (
          <div className="text-center text-muted">
            Click "Run Test" to check API connectivity
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default QuickNetworkTest;
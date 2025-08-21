
import React, { useState } from 'react';
import { Button, Alert, Card } from 'react-bootstrap';

const QuickNetworkTest = () => {
  const [results, setResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const runQuickTest = async () => {
    setTesting(true);
    setResults([]);
    
    const testUrls = [
      { name: 'Google', url: 'https://www.google.com/favicon.ico', method: 'HEAD', mode: 'no-cors' },
      { name: 'Cloudflare', url: 'https://cloudflare.com/favicon.ico', method: 'HEAD', mode: 'no-cors' },
      { name: 'API Domain (Base)', url: 'https://api.dopp.eu.org', method: 'GET', mode: 'cors' },
      { name: 'API Health', url: 'https://api.dopp.eu.org/v1/health', method: 'GET', mode: 'cors' },
      { name: 'API Login (Empty POST)', url: 'https://api.dopp.eu.org/v1/auth/login', method: 'POST', mode: 'cors', body: '{}' }
    ];

    for (const test of testUrls) {
      try {
        const startTime = Date.now();
        const options = {
          method: test.method,
          mode: test.mode,
          signal: AbortSignal.timeout(10000)
        };

        if (test.body) {
          options.headers = { 'Content-Type': 'application/json' };
          options.body = test.body;
        }

        const response = await fetch(test.url, options);
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
          <h6 className="mb-0">Quick Network Test</h6>
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
            Click "Run Test" to check network connectivity
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default QuickNetworkTest;

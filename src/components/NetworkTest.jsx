
import React, { useState, useEffect } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { api } from '../config/ApiConfig';

const NetworkTest = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      // Simple API connectivity test
      await api.me();
      setResult({
        success: true,
        message: 'API connection successful!'
      });
    } catch (error) {
      setResult({
        success: false,
        message: `API connection failed: ${error.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    // Auto-run test on component mount
    runTest();
  }, []);

  return (
    <div className="mb-3">
      <div className="d-flex align-items-center gap-2 mb-2">
        <Button 
          variant="outline-primary" 
          size="sm" 
          onClick={runTest} 
          disabled={testing}
        >
          {testing ? (
            <>
              <Spinner size="sm" className="me-1" />
              Testing...
            </>
          ) : (
            'Test API Connection'
          )}
        </Button>
      </div>
      
      {result && (
        <Alert variant={result.success ? 'success' : 'danger'} className="small">
          {result.message}
        </Alert>
      )}
    </div>
  );
};

export default NetworkTest;

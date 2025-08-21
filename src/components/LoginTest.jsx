
import React, { useState } from 'react';
import { Button, Form, Alert, Card } from 'react-bootstrap';
import { authAPI } from '../config/ApiConfig';

const LoginTest = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    console.log('Sending credentials:', credentials);

    try {
      const result = await authAPI.login(credentials);
      setResponse(result);
      console.log('Login successful:', result);
    } catch (err) {
      setError(err.message);
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="m-3">
      <Card.Header>
        <h5>Login Test</h5>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials(prev => ({
                ...prev,
                email: e.target.value
              }))}
              placeholder="Enter email"
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({
                ...prev,
                password: e.target.value
              }))}
              placeholder="Enter password"
            />
          </Form.Group>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Testing...' : 'Test Login'}
          </Button>
        </Form>

        {error && (
          <Alert variant="danger" className="mt-3">
            <h6>Error:</h6>
            <pre>{error}</pre>
          </Alert>
        )}

        {response && (
          <Alert variant="success" className="mt-3">
            <h6>Success Response:</h6>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </Alert>
        )}

        <div className="mt-3">
          <h6>Request Data Preview:</h6>
          <pre className="bg-light p-2 rounded">
            {JSON.stringify(credentials, null, 2)}
          </pre>
        </div>
      </Card.Body>
    </Card>
  );
};

export default LoginTest;

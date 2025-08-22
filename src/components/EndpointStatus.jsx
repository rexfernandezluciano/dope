import React, { useState, useEffect, useCallback } from "react";
import { Card, Badge, Button } from "react-bootstrap";

const EndpointStatus = () => {
  const [endpoints, setEndpoints] = useState([]);
  const [checking, setChecking] = useState(false);

  const checkEndpointStatus = async (endpoint) => {
    try {
      const response = await fetch(`${endpoint}/v1/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
        mode: "cors",
      });

      return {
        url: endpoint,
        status: response.ok ? "online" : "degraded",
        responseTime: Date.now(),
        statusCode: response.status,
        message: response.ok ? "Healthy" : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        url: endpoint,
        status: "offline",
        responseTime: null,
        statusCode: null,
        message: error.message,
      };
    }
  };

  const checkAllEndpoints = useCallback(async () => {
    setChecking(true);
    const results = [];
    const API_ENDPOINTS = ["https://api.dopp.eu.org/v1"];

    for (const endpoint of API_ENDPOINTS) {
      const result = await checkEndpointStatus(endpoint);
      results.push(result);
    }

    setEndpoints(results);
    setChecking(false);
  }, []);

  useEffect(() => {
    checkAllEndpoints();
    const interval = setInterval(checkAllEndpoints, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [checkAllEndpoints]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "online":
        return <Badge bg="success">Online</Badge>;
      case "degraded":
        return <Badge bg="warning">Degraded</Badge>;
      case "offline":
        return <Badge bg="danger">Offline</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card className="mt-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h6 className="mb-0">API Endpoint Status</h6>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={checkAllEndpoints}
          disabled={checking}
        >
          {checking ? "Checking..." : "Refresh"}
        </Button>
      </Card.Header>
      <Card.Body>
        {endpoints.map((endpoint, index) => {
          const url = new URL(endpoint.url);
          return (
            <div
              key={index}
              className="d-flex justify-content-between align-items-center mb-2"
            >
              <div>
                <strong>{url.hostname}</strong>
                <div className="small text-muted">{endpoint.url}</div>
              </div>
              <div className="text-end">
                {getStatusBadge(endpoint.status)}
                <div className="small text-muted">{endpoint.message}</div>
              </div>
            </div>
          );
        })}

        {endpoints.length === 0 && !checking && (
          <div className="text-center text-muted">
            No endpoint data available
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default EndpointStatus;

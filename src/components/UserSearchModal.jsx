
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, ListGroup, Image, Button, Spinner, Alert } from 'react-bootstrap';
import { CheckCircleFill, PersonPlus, PersonCheck } from 'react-bootstrap-icons';
import { searchAPI, userAPI } from '../config/ApiConfig';

const UserSearchModal = ({ show, onHide, currentUser }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [followingUsers, setFollowingUsers] = useState(new Set());

  const searchUsers = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await searchAPI.searchUsers(searchQuery, { limit: 20 });
      setUsers(response.users || []);
    } catch (err) {
      setError('Failed to search users');
      console.error('User search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFollow = useCallback(async (username) => {
    try {
      const response = await userAPI.followUser(username);
      
      if (response.isFollowing) {
        setFollowingUsers(prev => new Set(prev).add(username));
      } else {
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(username);
          return newSet;
        });
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchUsers]);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Discover People</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Control
            type="text"
            placeholder="Search for people..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </Form.Group>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        ) : users.length > 0 ? (
          <ListGroup variant="flush">
            {users.map(user => (
              <ListGroup.Item key={user.uid} className="d-flex align-items-center gap-3 py-3">
                <Image
                  src={user.photoURL || "https://i.pravatar.cc/150?img=10"}
                  alt="avatar"
                  roundedCircle
                  width="50"
                  height="50"
                  style={{ objectFit: "cover" }}
                />
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-1">
                    <h6 className="mb-0">{user.name}</h6>
                    {user.hasBlueCheck && (
                      <CheckCircleFill className="text-primary" size={16} />
                    )}
                  </div>
                  <p className="text-muted mb-0">@{user.username}</p>
                  {user.bio && (
                    <p className="mb-0 small text-muted">{user.bio}</p>
                  )}
                  <div className="d-flex gap-3 mt-1">
                    <small className="text-muted">
                      {user.followersCount || 0} followers
                    </small>
                    <small className="text-muted">
                      {user.followingCount || 0} following
                    </small>
                  </div>
                </div>
                {currentUser && user.uid !== currentUser.uid && (
                  <Button
                    variant={followingUsers.has(user.username) ? "outline-primary" : "primary"}
                    size="sm"
                    onClick={() => handleFollow(user.username)}
                    className="d-flex align-items-center gap-1"
                  >
                    {followingUsers.has(user.username) ? (
                      <>
                        <PersonCheck size={16} />
                        Following
                      </>
                    ) : (
                      <>
                        <PersonPlus size={16} />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : query.length >= 2 && !loading ? (
          <div className="text-center py-4 text-muted">
            <p>No users found for "{query}"</p>
          </div>
        ) : (
          <div className="text-center py-4 text-muted">
            <p>Start typing to search for people...</p>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default UserSearchModal;

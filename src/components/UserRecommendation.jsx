
import React, { useState, useEffect } from 'react';
import { Card, Button, Image, Spinner } from 'react-bootstrap';
import { PersonPlus, X } from 'react-bootstrap-icons';
import { recommendationAPI, userAPI } from '../config/ApiConfig';
import { useNavigate } from 'react-router-dom';

const UserRecommendation = ({ currentUser, onClose }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      loadRecommendations();
    }
  }, [currentUser]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const response = await recommendationAPI.getUserRecommendations({
        limit: 3
      });
      
      setRecommendations(response.recommendations || []);
    } catch (err) {
      console.error('Failed to load user recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUser = async (userId, username) => {
    try {
      if (followingUsers.has(userId)) {
        await userAPI.unfollowUser(username);
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } else {
        await userAPI.followUser(username);
        setFollowingUsers(prev => new Set(prev).add(userId));
      }
    } catch (err) {
      console.error('Failed to follow/unfollow user:', err);
    }
  };

  const handleUserClick = (username) => {
    navigate(`/${username}`);
  };

  if (!currentUser || loading) {
    return (
      <Card className="border-0 border-bottom rounded-0 mb-0 bg-light">
        <Card.Body className="text-center py-4">
          <Spinner size="sm" animation="border" variant="primary" />
          <div className="mt-2 small text-muted">Loading recommendations...</div>
        </Card.Body>
      </Card>
    );
  }

  if (error || !recommendations.length) {
    return null;
  }

  return (
    <Card className="border-0 border-bottom rounded-0 mb-0 bg-light">
      <Card.Body className="px-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0 fw-bold">Suggested for you</h6>
          {onClose && (
            <Button
              variant="link"
              className="text-muted p-1 border-0"
              onClick={onClose}
              style={{ lineHeight: 1 }}
            >
              <X size={16} />
            </Button>
          )}
        </div>

        <div className="row g-2">
          {recommendations.slice(0, 3).map((user) => (
            <div key={user.uid} className="col-4">
              <div className="text-center p-2 border rounded bg-white">
                <div 
                  className="cursor-pointer"
                  onClick={() => handleUserClick(user.username)}
                  style={{ cursor: 'pointer' }}
                >
                  <Image
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=60&background=6366f1&color=white`}
                    alt={user.name}
                    roundedCircle
                    width="60"
                    height="60"
                    className="mb-2"
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="mb-2">
                    <div className="fw-bold small text-truncate" title={user.name}>
                      {user.name}
                    </div>
                    <div className="text-muted small text-truncate" title={`@${user.username}`}>
                      @{user.username}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant={followingUsers.has(user.uid) ? "outline-secondary" : "primary"}
                  size="sm"
                  className="w-100"
                  onClick={() => handleFollowUser(user.uid, user.username)}
                >
                  <PersonPlus size={14} className="me-1" />
                  {followingUsers.has(user.uid) ? 'Following' : 'Follow'}
                </Button>
                
                {user.followersCount > 0 && (
                  <div className="mt-1">
                    <small className="text-muted">
                      {user.followersCount.toLocaleString()} followers
                    </small>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 text-center">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => navigate('/search?tab=users')}
          >
            See more suggestions
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default UserRecommendation;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ListGroup, Image, Spinner } from 'react-bootstrap';
import { CheckCircleFill } from 'react-bootstrap-icons';
import { apiRequest } from '../config/ApiConfig.js';

const MentionDropdown = ({ 
  show, 
  position, 
  query, 
  onSelect, 
  onClose 
}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef(null);

  const searchUsers = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest(`/users/search?query=${encodeURIComponent(searchQuery)}&limit=5`);
      setUsers(response?.users || []);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Failed to search users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (show && query) {
      searchUsers(query);
    } else {
      setUsers([]);
    }
  }, [show, query, searchUsers]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!show || users.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(users.length - 1, prev + 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(0, prev - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (users[selectedIndex]) {
            onSelect({
                ...users[selectedIndex],
                uid: users[selectedIndex].uid || users[selectedIndex].id, // Ensure uid is available
                username: users[selectedIndex].username || users[selectedIndex].uid, // Keep username for display
                name: users[selectedIndex].name || users[selectedIndex].displayName || 'Unknown User'
              });
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        default:
          // No action needed for other keys
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, users, selectedIndex, onSelect, onClose]);

  if (!show || (!loading && users.length === 0)) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="position-absolute bg-white border rounded shadow-sm"
      style={{
        top: position.top,
        left: position.left,
        zIndex: 9999,
        maxWidth: '300px',
        maxHeight: '200px',
        overflowY: 'auto'
      }}
    >
      {loading ? (
        <div className="p-3 text-center">
          <Spinner size="sm" />
        </div>
      ) : (
        <ListGroup variant="flush">
          {users.map((user, index) => (
            <ListGroup.Item
              key={user.uid}
              action
              active={index === selectedIndex}
              onClick={() => onSelect({
                ...user,
                uid: user.uid || user.id, // Ensure uid is available
                username: user.username || user.uid, // Keep username for display
                name: user.name || user.displayName || 'Unknown User'
              })}
              className="d-flex align-items-center gap-2 py-2"
              style={{ cursor: 'pointer' }}
            >
              <Image
                src={user.photoURL || "https://i.pravatar.cc/150?img=10"}
                alt="avatar"
                roundedCircle
                width="32"
                height="32"
                style={{ objectFit: "cover" }}
              />
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-1">
                  <span className="fw-bold">{user.name}</span>
                  {user.hasBlueCheck && (
                    <CheckCircleFill className="text-primary" size={14} />
                  )}
                </div>
                <small className="text-muted">@{user.username}</small>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
};

export default MentionDropdown;
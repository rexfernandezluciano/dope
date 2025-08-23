
import React, { useState, useEffect } from 'react';
import { Card, Button, Image, Badge } from 'react-bootstrap';
import { X, ExternalLink } from 'react-bootstrap-icons';
import { businessAPI } from '../config/ApiConfig';

const Advertisement = ({ onClose, currentUser }) => {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAdvertisement();
  }, []);

  const loadAdvertisement = async () => {
    try {
      // Mock advertisement data - in real app, this would come from an API
      const mockAd = {
        id: 'ad_123',
        title: 'Boost Your Content',
        description: 'Reach more users with DOPE Network Premium. Get advanced analytics, priority support, and more!',
        imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=200&fit=crop',
        targetUrl: '/subscription',
        campaignId: 'campaign_123',
        adType: 'promotion',
        sponsor: 'DOPE Network',
        isSponsored: true
      };

      setAd(mockAd);
      
      // Track impression
      if (mockAd.campaignId) {
        await businessAPI.trackAdInteraction({
          campaignId: mockAd.campaignId,
          action: 'impression',
          userId: currentUser?.uid || 'anonymous'
        });
      }
    } catch (err) {
      console.error('Failed to load advertisement:', err);
      setError('Failed to load ad');
    } finally {
      setLoading(false);
    }
  };

  const handleAdClick = async () => {
    if (!ad) return;

    try {
      // Track click interaction
      if (ad.campaignId) {
        await businessAPI.trackAdInteraction({
          campaignId: ad.campaignId,
          action: 'click',
          userId: currentUser?.uid || 'anonymous'
        });
      }

      // Navigate to target URL
      if (ad.targetUrl.startsWith('http')) {
        window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = ad.targetUrl;
      }
    } catch (err) {
      console.error('Failed to track ad click:', err);
    }
  };

  const handleClose = async () => {
    if (ad?.campaignId) {
      try {
        await businessAPI.trackAdInteraction({
          campaignId: ad.campaignId,
          action: 'dismiss',
          userId: currentUser?.uid || 'anonymous'
        });
      } catch (err) {
        console.error('Failed to track ad dismiss:', err);
      }
    }
    
    if (onClose) {
      onClose();
    }
  };

  if (loading) {
    return (
      <Card className="border-0 border-bottom rounded-0 mb-0">
        <Card.Body className="text-center py-4">
          <div className="spinner-border spinner-border-sm text-muted" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (error || !ad) {
    return null;
  }

  return (
    <Card className="border-0 border-bottom rounded-0 mb-0 bg-light">
      <Card.Body className="px-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center gap-2">
            {ad.isSponsored && (
              <Badge bg="secondary" className="small">
                Sponsored
              </Badge>
            )}
            <small className="text-muted">Advertisement</small>
          </div>
          <Button
            variant="link"
            className="text-muted p-1 border-0"
            onClick={handleClose}
            style={{ lineHeight: 1 }}
          >
            <X size={16} />
          </Button>
        </div>

        <div 
          className="d-flex gap-3 cursor-pointer"
          onClick={handleAdClick}
          style={{ cursor: 'pointer' }}
        >
          {ad.imageUrl && (
            <div className="flex-shrink-0">
              <Image
                src={ad.imageUrl}
                alt={ad.title}
                width="80"
                height="60"
                className="rounded"
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}
          
          <div className="flex-grow-1">
            <h6 className="mb-1 fw-bold text-primary">
              {ad.title}
              <ExternalLink size={14} className="ms-1" />
            </h6>
            <p className="mb-1 small text-muted">
              {ad.description}
            </p>
            {ad.sponsor && (
              <small className="text-muted">
                By {ad.sponsor}
              </small>
            )}
          </div>
        </div>

        <div className="mt-2 pt-2 border-top">
          <div className="d-flex justify-content-between align-items-center">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleAdClick}
            >
              Learn More
            </Button>
            <small className="text-muted">
              <a 
                href="/privacy" 
                className="text-decoration-none text-muted"
                target="_blank"
                rel="noopener noreferrer"
              >
                Why am I seeing this?
              </a>
            </small>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default Advertisement;

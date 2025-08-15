// src/hooks/useImpressionTracker.ts
import { useEffect, useCallback } from 'react';

export const useImpressionTracker = () => {
  const trackImpression = useCallback(async (postId: string) => {
    try {
      const token = localStorage.getItem('shadowspace_token'); // Fixed: removed backslash
      if (!token) return;

      const response = await fetch(`https://shadowspace-t0v1.onrender.com/api/posts/impression/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Don't throw error for impression tracking - just log
        console.warn(`Impression tracking failed for post ${postId}:`, response.status);
        return;
      }

      const data = await response.json();
      console.log(`Tracked impression for post ${postId}, total views: ${data.views}`);
    } catch (error) {
      // Silently fail impression tracking
      console.warn('Impression tracking error:', error);
    }
  }, []);

  return { trackImpression };
};

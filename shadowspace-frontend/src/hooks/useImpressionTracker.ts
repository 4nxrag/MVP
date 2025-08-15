import { useEffect, useRef } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

interface UseImpressionTrackerProps {
  postId: string;
  onImpressionTracked?: (impressions: number) => void;
}

const API_BASE = 'https://shadowspace-t0v1.onrender.com/api';

// Safe localStorage access for SSR
const getToken = () => 
  typeof window !== 'undefined' ? localStorage.getItem('shadowspace_token') : null;

export const useImpressionTracker = ({ 
  postId, 
  onImpressionTracked 
}: UseImpressionTrackerProps) => {
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold: 0.6, // 60% of post must be visible
    rootMargin: '-50px' // Account for header/footer
  });

  const hasTrackedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (isVisible && !hasTrackedRef.current) {
      // Start 3-second timer when post becomes visible
      timerRef.current = setTimeout(async () => {
        if (!hasTrackedRef.current) {
          try {
            const token = getToken();
            
            const response = await fetch(`${API_BASE}/posts/${postId}/impression`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
              },
              // Remove body since your backend doesn't expect it
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            hasTrackedRef.current = true;
            
            if (onImpressionTracked) {
              onImpressionTracked(data.impressions || data.impression_count || 1);
            }
            
            console.log(`📊 Impression tracked for post ${postId}`);
          } catch (error) {
            console.error('Impression tracking error:', error);
            // Don't retry automatically to avoid spam
          }
        }
      }, 3000); // 3 seconds
    } else if (!isVisible) {
      // Reset timer if post goes out of view before 3 seconds
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isVisible, postId, onImpressionTracked]);

  // Reset tracking when postId changes
  useEffect(() => {
    hasTrackedRef.current = false;
  }, [postId]);

  return { elementRef };
};

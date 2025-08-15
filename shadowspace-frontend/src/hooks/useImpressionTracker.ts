import { useEffect, useRef } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';
import axios from 'axios';

interface UseImpressionTrackerProps {
  postId: string;
  onImpressionTracked?: (impressions: number) => void;
}

const API_BASE = 'https://shadowspace-t0v1.onrender.com';

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
            const response = await axios.put(`${API_BASE}/posts/${postId}/impression`);
            hasTrackedRef.current = true;
            
            if (onImpressionTracked) {
              onImpressionTracked(response.data.impressions);
            }
            
            console.log(`📊 Impression tracked for post ${postId}`);
          } catch (error) {
            console.error('Impression tracking error:', error);
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

  return { elementRef };
};

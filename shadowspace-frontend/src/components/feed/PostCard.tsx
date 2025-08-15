import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { usePostStore } from '../../store/usePostStore';
import { useImpressionTracker } from '../../hooks/useImpressionTracker';

interface PostCardProps {
  id: string;
  content: string;
  upvotes: number;
  downvotes: number;
  impressions: number;
  fakeRegion: string;
  createdAt: string;
  author: string;
  userVote?: 'upvote' | 'downvote' | null;
}

const PostCard: React.FC<PostCardProps> = ({
  id,
  content,
  upvotes,
  downvotes,
  impressions,
  fakeRegion,
  createdAt,
  author,
  userVote
}) => {
  const { token } = useAuthStore();
  const { voteOnPost, updatePostImpressions } = usePostStore();

  // ✨ NEW: Track impressions when post is viewed for 3+ seconds
  const { elementRef } = useImpressionTracker({
    postId: id,
    onImpressionTracked: (newImpressions) => {
      updatePostImpressions(id, newImpressions);
    }
  });

  return (
    <div 
      ref={elementRef} // ✨ NEW: Attach ref for impression tracking
      className="glass-card p-5 mb-4 animate-fade-in"
    >
      <p className="text-gray-200 mb-4">{content}</p>
      <div className="flex justify-between items-center text-sm text-gray-400">
        <div className="flex space-x-4">
          <button
            onClick={() => voteOnPost(id, 'upvote', token!)}
            className={`flex items-center space-x-1 transition-colors ${
              userVote === 'upvote' ? 'text-green-400' : 'hover:text-green-300'
            }`}
          >
            <span>▲</span>
            <span>{upvotes}</span>
          </button>
          <button
            onClick={() => voteOnPost(id, 'downvote', token!)}
            className={`flex items-center space-x-1 transition-colors ${
              userVote === 'downvote' ? 'text-red-400' : 'hover:text-red-300'
            }`}
          >
            <span>▼</span>
            <span>{downvotes}</span>
          </button>
          {/* ✨ Shows impression count */}
          <div className="flex items-center space-x-1 text-gray-500">
            <span>👁</span>
            <span>{impressions}</span>
          </div>
        </div>
        <div className="text-xs">
          {author} • {fakeRegion} • {new Date(createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default PostCard;

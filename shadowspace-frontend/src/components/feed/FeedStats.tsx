import React, { useMemo } from 'react';
import { usePostStore } from '../../store/usePostStore';

const FeedStats: React.FC = () => {
  const { posts } = usePostStore();

  const stats = useMemo(() => {
    if (posts.length === 0) return null;

    const totalUpvotes = posts.reduce((sum, post) => sum + post.upvotes, 0);
    const totalDownvotes = posts.reduce((sum, post) => sum + post.downvotes, 0);
    const totalImpressions = posts.reduce((sum, post) => sum + post.impressions, 0);
    const mostPopularPost = posts.reduce((max, post) => 
      post.upvotes > max.upvotes ? post : max
    , posts[0]);

    return {
      totalPosts: posts.length,
      totalUpvotes,
      totalDownvotes,
      totalImpressions,
      mostPopularPost
    };
  }, [posts]);

  if (!stats) return null;

  return (
    <div className="glass-card p-4 mb-6">
      <h3 className="text-white text-sm font-medium mb-3">Feed Statistics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-xl font-bold text-white">{stats.totalPosts}</div>
          <div className="text-xs text-gray-400">Posts</div>
        </div>
        <div>
          <div className="text-xl font-bold text-green-400">{stats.totalUpvotes}</div>
          <div className="text-xs text-gray-400">Total Upvotes</div>
        </div>
        <div>
          <div className="text-xl font-bold text-blue-400">{stats.totalImpressions}</div>
          <div className="text-xs text-gray-400">Total Views</div>
        </div>
        <div>
          <div className="text-xl font-bold text-purple-400">{stats.mostPopularPost.upvotes}</div>
          <div className="text-xs text-gray-400">Top Post</div>
        </div>
      </div>
    </div>
  );
};

export default FeedStats;

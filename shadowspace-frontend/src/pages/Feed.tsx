import React, { useEffect } from 'react';
import { usePostStore } from '../store/usePostStore';
import { useAuthStore } from '../store/useAuthStore';
import CreatePost from '../components/feed/CreatePost';
import PostCard from '../components/feed/PostCard';
import SortFilter from '../components/feed/SortFilter'; 
import FeedStats from '../components/feed/FeedStats';

const Feed: React.FC = () => {
  const { posts, fetchPosts, isLoading } = usePostStore();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl text-white">Welcome, {user?.anonymousName}</h2>
        <button onClick={logout} className="glass-button px-4 py-2 text-sm text-white">
          Logout
        </button>
      </div>

      {/* Create Post */}
      <CreatePost />

      {/* Sort Filter */}
      <SortFilter />

      {/* Optional Stats */}
      <FeedStats />

      {/* Posts Feed */}
      {isLoading ? (
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-gray-400">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;

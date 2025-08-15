import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { usePostStore } from '../../store/usePostStore';

const CreatePost: React.FC = () => {
  const { token } = useAuthStore();
  const { createPost } = usePostStore();
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (content.trim().length === 0) {
      setError('Post content cannot be empty');
      return;
    }

    if (content.length > 500) {
      setError('Post content is too long (max 500 characters)');
      return;
    }

    const success = await createPost(content, token!);
    if (success) {
      setContent('');
    } else {
      setError('Failed to create post');
    }
  };

  return (
    <div className="glass-card p-5 mb-6">
      <form onSubmit={handleSubmit}>
        <textarea
          className="glass-input w-full p-3 mb-3 resize-none"
          rows={3}
          placeholder="Share your anonymous thought..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button type="submit" className="glass-button px-5 py-2 text-white">
          Post
        </button>
      </form>
    </div>
  );
};

export default CreatePost;

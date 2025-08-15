import { create } from 'zustand';
import axios from 'axios';
import { socketService } from '../services/socket';

interface Post {
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

interface PostState {
  posts: Post[];
  isLoading: boolean;
  currentSort: string;
  createPost: (content: string, token: string) => Promise<boolean>;
  fetchPosts: (sortBy?: string) => Promise<void>; 
  voteOnPost: (postId: string, voteType: 'upvote' | 'downvote', token: string) => Promise<void>;
  updatePostImpressions: (postId: string, impressions: number) => void;
  setSortOption: (sortOption: string) => void; 
  initializeRealTime: () => void;
}

const API_BASE = 'https://shadowspace-t0v1.onrender.com/api';

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  isLoading: false,
  currentSort: 'recent',

  createPost: async (content: string, token: string) => {
    try {
      const response = await axios.post(`${API_BASE}/posts`, 
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return true;
    } catch (error) {
      console.error('Create post error:', error);
      return false;
    }
  },

  // Updated to support sorting
  fetchPosts: async (sortBy?: string) => {
    set({ isLoading: true });
    const sortOption = sortBy || get().currentSort;
    
    try {
      const response = await axios.get(`${API_BASE}/posts?sort=${sortOption}`);
      set({ 
        posts: response.data.posts, 
        isLoading: false,
        currentSort: sortOption 
      });
    } catch (error) {
      console.error('Fetch posts error:', error);
      set({ isLoading: false });
    }
  },

  voteOnPost: async (postId: string, voteType: 'upvote' | 'downvote', token: string) => {
    try {
      await axios.put(`${API_BASE}/posts/${postId}/vote`, 
        { type: voteType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Vote error:', error);
    }
  },

  updatePostImpressions: (postId: string, impressions: number) => {
    set((state) => ({
      posts: state.posts.map(post => 
        post.id === postId
          ? { ...post, impressions }
          : post
      )
    }));
  },

  // Set sort option and refresh posts
  setSortOption: (sortOption: string) => {
    set({ currentSort: sortOption });
    get().fetchPosts(sortOption);
  },

  initializeRealTime: () => {
    const socket = socketService.connect();

    socket.on('new_post', (newPost: Post) => {
      // Only add to top if we're sorting by recent
      if (get().currentSort === 'recent') {
        set((state) => ({
          posts: [newPost, ...state.posts]
        }));
      } else {
        // For other sorts, just refresh to maintain order
        get().fetchPosts();
      }
    });

    socket.on('vote_update', (voteData: any) => {
      set((state) => ({
        posts: state.posts.map(post => 
          post.id === voteData.postId
            ? { ...post, upvotes: voteData.upvotes, downvotes: voteData.downvotes }
            : post
        )
      }));
      
      // If sorting by votes, refresh to maintain order
      if (get().currentSort === 'top' || get().currentSort === 'trending') {
        setTimeout(() => get().fetchPosts(), 1000);
      }
    });

    socket.on('impression_update', (impressionData: { postId: string; impressions: number }) => {
      set((state) => ({
        posts: state.posts.map(post => 
          post.id === impressionData.postId
            ? { ...post, impressions: impressionData.impressions }
            : post
        )
      }));
      
      // If sorting by views, refresh to maintain order
      if (get().currentSort === 'viewed') {
        setTimeout(() => get().fetchPosts(), 1000);
      }
    });
  }
}));

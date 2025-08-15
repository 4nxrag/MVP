import React, { useEffect, useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { usePostStore } from './store/usePostStore';
import { socketService } from './services/socket';
import AuthForm from './components/auth/AuthForm';
import Feed from './pages/Feed';

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { initializeRealTime } = usePostStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    initAuth();
  }, [checkAuth]);

  // Initialize real-time when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initializeRealTime();
    } else {
      socketService.disconnect();
    }

    // Cleanup on component unmount
    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, initializeRealTime]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading ShadowSpace...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? (
    <Feed />
  ) : (
    <AuthForm />
  );
}

export default App;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
      }
      
      // Navigation after successful auth
      navigate('/', { replace: true });
      
    } catch (err: any) {
      // More specific error messages
      if (err.message.includes('401') || err.message.includes('unauthorized')) {
        setError('Invalid username or password');
      } else if (err.message.includes('400') || err.message.includes('bad request')) {
        setError('Please check your input and try again');
      } else if (err.message.includes('409') || err.message.includes('conflict')) {
        setError('Username already exists. Please choose a different one');
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again');
      } else {
        setError(err.message || 'Authentication failed. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setError('');
    setPassword('');
    setUsername(''); // Clear username too for better UX
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Main Card with glassmorphism */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to <span className="text-blue-400">ShadowSpace</span>
            </h1>
            <p className="text-slate-400 text-sm">Share your anonymous thoughts</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200"
                placeholder="Enter your username"
                required
                minLength={3}
                maxLength={20}
                autoComplete="username"
                disabled={loading}
              />
            </div>

            {/* Password Field with Eye Toggle */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  disabled={loading}
                />
                
                {/* Eye Toggle Button */}
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors duration-200 focus:outline-none focus:text-blue-400 disabled:opacity-50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.05 8.05m1.828 1.828l4.242 4.242m0 0L16.95 16.95M9.878 9.878l-1.828-1.828M16.12 14.12l1.828 1.828" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-700/50 hover:bg-slate-600/50 disabled:bg-slate-800/50 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed border border-slate-600/30"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Switch between Login/Register */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleModeSwitch}
              disabled={loading}
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200 underline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLogin ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;

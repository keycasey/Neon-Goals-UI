import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { handleGitHubCallback } from '@/services/githubAuth';

const Callback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (errorParam) {
        setStatus('error');
        setError(errorDescription || errorParam);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!token) {
        setStatus('error');
        setError('No authorization token received');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        const user = await handleGitHubCallback(token);
        setUser(user);
        setStatus('success');
        setTimeout(() => navigate('/'), 500);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setError('Failed to complete login. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-12 neon-border text-center max-w-md">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-neon animate-pulse-slow flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-foreground animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h2 className="font-heading text-2xl font-bold gradient-text mb-2">
              Signing you in...
            </h2>
            <p className="text-muted-foreground">
              Connecting to GitHub
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-neon flex items-center justify-center neon-glow-cyan">
              <svg className="w-8 h-8 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-heading text-2xl font-bold gradient-text mb-2">
              Welcome! 🌴
            </h2>
            <p className="text-muted-foreground">
              Taking you to your dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="font-heading text-2xl font-bold text-destructive mb-2">
              Oops!
            </h2>
            <p className="text-muted-foreground mb-4">
              {error || 'Something went wrong'}
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting back to login...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Callback;

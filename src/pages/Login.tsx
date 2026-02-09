import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Chrome as ChromeIcon, ArrowLeft, Mail, Copy, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { initiateGitHubLogin } from '@/services/githubAuth';
import { authService } from '@/services/authService';
import { cn } from '@/lib/utils';
import { mockGoals } from '@/data/mockGoals';
import { EmailForm } from '@/components/auth/EmailForm';
import { RegisterForm } from '@/components/auth/RegisterForm';

type AuthMode = 'oauth' | 'login' | 'register' | 'verify';

const Login = () => {
  const { user, setUser, addGoal, setDemoMode, fetchGoals } = useAppStore();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>('oauth');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyToken, setVerifyToken] = useState<string | undefined>('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGitHubLogin = () => {
    // Disable demo mode when logging in with real account
    setDemoMode(false);
    // Initiate GitHub OAuth flow
    initiateGitHubLogin();
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth flow
    alert('Google OAuth coming soon! Use GitHub for now.');
  };

  const handleDemoLogin = async () => {
    // Clear any existing auth token to prevent 401 errors
    authService.logout();

    // Local-only demo mode - no backend calls
    const localDemoUser = {
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@example.com',
      avatar: undefined,
    };

    setUser(localDemoUser);
    setDemoMode(true); // Enable demo mode flag
    // Populate with mock goals
    mockGoals.forEach(goal => addGoal(goal as any));
    navigate('/');
  };

  const handleAuthSuccess = async (authenticatedUser: any) => {
    setUser(authenticatedUser);
    setDemoMode(false);
    // Fetch goals after successful login
    await fetchGoals();
    navigate('/');
  };

  const handleAuthError = (error: string) => {
    console.error('Auth error:', error);
  };

  const handleShowVerificationInfo = (email: string, token?: string) => {
    setVerifyEmail(email);
    setVerifyToken(token);
    setAuthMode('verify');
  };

  const handleVerifyEmail = async (token: string) => {
    try {
      const result = await authService.verifyEmail(token);
      setUser(result.user);
      setDemoMode(false);
      navigate('/');
    } catch (error: any) {
      console.error('Verification error:', error);
      alert('Invalid or expired verification token');
    }
  };

  const handleResendVerification = async () => {
    try {
      const result = await authService.resendVerification(verifyEmail);
      setVerifyToken(result.verificationToken);
      alert(`New verification token: ${result.verificationToken || 'Check your email'}`);
    } catch (error: any) {
      console.error('Resend error:', error);
      alert('Failed to resend verification email');
    }
  };

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Back Button */}
      <Link
        to="/"
        className="fixed top-6 left-6 p-3 rounded-full glass-card hover:bg-muted/50 transition-colors z-10"
        aria-label="Back to home"
      >
        <ArrowLeft className="w-5 h-5 text-foreground" />
      </Link>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-3xl p-8 neon-border">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-2xl bg-gradient-neon flex items-center justify-center shadow-lg neon-glow-cyan"
            >
              <svg className="w-10 h-10 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </motion.div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold gradient-text mb-2">
              {authMode === 'register' ? 'Create Account' :
               authMode === 'verify' ? 'Verify Your Email' :
               'Welcome Back'}
            </h1>
            <p className="text-muted-foreground">
              {authMode === 'register' ? 'Start crushing your goals.' :
               authMode === 'verify' ? 'Check your inbox 📧' :
               'Sign in to crush your goals.'}
            </p>
          </div>

          {/* Cross-fade between forms */}
          <AnimatePresence mode="wait">
            {authMode === 'oauth' && (
              <motion.div
                key="oauth"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {/* OAuth Buttons */}
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={handleGitHubLogin}
                  className={cn(
                    "w-full flex items-center justify-center gap-3",
                    "px-6 py-4 rounded-xl",
                    "bg-background hover:bg-muted/50",
                    "border-2 border-border hover:border-primary/50",
                    "transition-all duration-200",
                    "group"
                  )}
                >
                  <Github className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
                  <span className="font-medium text-foreground">Continue with GitHub</span>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={handleGoogleLogin}
                  className={cn(
                    "w-full flex items-center justify-center gap-3",
                    "px-6 py-4 rounded-xl",
                    "bg-background hover:bg-muted/50",
                    "border-2 border-border hover:border-secondary/50",
                    "transition-all duration-200",
                    "group"
                  )}
                >
                  <ChromeIcon className="w-5 h-5 text-foreground group-hover:text-secondary transition-colors" />
                  <span className="font-medium text-foreground">Continue with Google</span>
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-4 my-8">
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-border/50" />
                </div>

                {/* Demo Mode */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center"
                >
                  <p className="text-sm text-muted-foreground mb-4">
                    Want to try before you commit?
                  </p>
                  <button
                    onClick={handleDemoLogin}
                    className={cn(
                      "px-6 py-2.5 rounded-lg",
                      "bg-gradient-neon text-primary-foreground font-medium",
                      "hover:shadow-lg hover:neon-glow-cyan",
                      "transition-all duration-200"
                    )}
                  >
                    Start with Demo Mode
                  </button>
                </motion.div>

                {/* Toggle to Email Login */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-center mt-6"
                >
                  <button
                    onClick={() => setAuthMode('login')}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Or sign in with email
                  </button>
                </motion.div>
              </motion.div>
            )}

            {authMode === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EmailForm
                  onSuccess={handleAuthSuccess}
                  onError={handleAuthError}
                  onToggleMode={() => setAuthMode('oauth')}
                />
                <div className="text-center mt-4">
                  <button
                    onClick={() => setAuthMode('register')}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Don't have an account? Sign up
                  </button>
                </div>
              </motion.div>
            )}

            {authMode === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <RegisterForm
                  onSuccess={handleAuthSuccess}
                  onError={handleAuthError}
                  onToggleMode={() => setAuthMode('login')}
                  showVerificationInfo={handleShowVerificationInfo}
                />
              </motion.div>
            )}

            {authMode === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                    Check your email!
                  </h3>
                  <p className="text-muted-foreground">
                    We've sent a verification link to
                  </p>
                  <p className="font-mono text-sm text-primary mt-1">
                    {verifyEmail}
                  </p>
                </div>

                {verifyToken && (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">
                      Development Mode - Verification Token:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 rounded bg-background text-xs font-mono break-all">
                        {verifyToken}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(verifyToken);
                          alert('Token copied!');
                        }}
                        className="p-2 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                        title="Copy token"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={() => handleVerifyEmail(verifyToken || '')}
                    className="w-full py-3 rounded-xl font-medium transition-all bg-gradient-neon text-primary-foreground neon-glow-cyan hover:scale-105"
                  >
                    I've verified my email
                  </button>
                  <button
                    onClick={handleResendVerification}
                    className="w-full py-3 rounded-xl font-medium transition-all bg-muted hover:bg-muted/70"
                  >
                    Resend verification email
                  </button>
                  <button
                    onClick={() => setAuthMode('login')}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back to login
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs text-muted-foreground text-center mt-8"
          >
            By signing in, you agree to our Terms of Service and Privacy Policy
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

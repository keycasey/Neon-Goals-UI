import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Chrome as ChromeIcon, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { initiateGitHubLogin } from '@/services/githubAuth';
import { authService } from '@/services/authService';
import { cn } from '@/lib/utils';

const Login = () => {
  const { user, setUser } = useAppStore();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGitHubLogin = () => {
    // Initiate GitHub OAuth flow
    initiateGitHubLogin();
  };

  const handleDemoLogin = async () => {
    try {
      // Call backend demo endpoint to get a valid JWT token
      const demoUser = await authService.demoLogin();
      setUser(demoUser);
      navigate('/');
    } catch (error) {
      console.error('Demo login failed:', error);
      alert('Demo login failed. Please try again.');
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth flow
    alert('Google OAuth coming soon! Use GitHub for now.');
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
              Welcome Back
            </h1>
            <p className="text-muted-foreground">
              Sign in to crush your goals 🌴
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
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
          </div>

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

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          Goals-AF — Crush your goals in style
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login;

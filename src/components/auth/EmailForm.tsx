import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { authService } from '@/services/authService';
import { validateEmail, validatePassword, getPasswordStrength } from '@/lib/validation';
import { cn } from '@/lib/utils';
import type { User } from '@/types/goals';

interface EmailFormProps {
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
  onToggleMode?: () => void;
}

export const EmailForm: React.FC<EmailFormProps> = ({
  onSuccess,
  onError,
  onToggleMode,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const handleEmailBlur = () => {
    if (email) {
      const validation = validateEmail(email);
      setEmailError(validation.errors[0] || '');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordBlur = () => {
    if (password) {
      const validation = validatePassword(password);
      setPasswordError(validation.errors[0] || '');
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    // Validate
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (!emailValidation.valid) {
      setEmailError(emailValidation.errors[0]);
      return;
    }

    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.errors[0]);
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.loginWithEmail(email, password);
      onSuccess?.(result.user);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      if (message.includes('email') || message.includes('password')) {
        setGeneralError('Invalid email or password');
      } else if (message.includes('locked')) {
        setGeneralError(message);
      } else {
        setGeneralError('Login failed. Please try again.');
      }
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email Input */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleEmailBlur}
            placeholder="you@example.com"
            className={cn(
              "w-full pl-11 pr-4 py-3 rounded-xl bg-muted/50 border border-border/50",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
              "transition-all placeholder:text-muted-foreground",
              emailError && "border-destructive focus:ring-destructive/50"
            )}
            disabled={isLoading}
          />
        </div>
        <AnimatePresence>
          {emailError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-1.5 text-destructive text-xs"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {emailError}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={handlePasswordBlur}
            placeholder="••••••••"
            className={cn(
              "w-full pl-11 pr-12 py-3 rounded-xl bg-muted/50 border border-border/50",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
              "transition-all placeholder:text-muted-foreground",
              passwordError && "border-destructive focus:ring-destructive/50"
            )}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {password && passwordStrength && (
          <div className="space-y-1.5">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-300",
                    level <= passwordStrength.score
                      ? passwordStrength.color
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Password strength: <span className={cn(
                passwordStrength.score <= 1 ? "text-destructive" :
                passwordStrength.score <= 2 ? "text-warning" :
                passwordStrength.score <= 3 ? "text-primary" :
                "text-green-500"
              )}>{passwordStrength.label}</span>
            </p>
          </div>
        )}

        <AnimatePresence>
          {passwordError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-1.5 text-destructive text-xs"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {passwordError}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* General Error */}
      <AnimatePresence>
        {generalError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {generalError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !email || !password}
        className={cn(
          "w-full py-3 rounded-xl font-medium transition-all",
          "bg-gradient-neon text-primary-foreground neon-glow-cyan",
          "hover:scale-105 active:scale-100",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        )}
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>

      {/* Toggle to OAuth */}
      {onToggleMode && (
        <div className="text-center">
          <button
            type="button"
            onClick={onToggleMode}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Or sign in with OAuth
          </button>
        </div>
      )}

      {/* Forgot Password Link */}
      <div className="text-center">
        <button
          type="button"
          className="text-sm text-primary hover:underline transition-all"
        >
          Forgot password?
        </button>
      </div>
    </form>
  );
};

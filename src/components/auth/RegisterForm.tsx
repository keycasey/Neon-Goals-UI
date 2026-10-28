import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Check } from 'lucide-react';
import { authService } from '@/services/authService';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateName,
  getPasswordStrength,
} from '@/lib/validation';
import { cn } from '@/lib/utils';
import type { User } from '@/types/goals';

interface RegisterFormProps {
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
  onToggleMode?: () => void;
  showVerificationInfo?: (email: string, verificationToken?: string) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onError,
  onToggleMode,
  showVerificationInfo,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const handleNameBlur = () => {
    if (name) {
      const validation = validateName(name);
      setNameError(validation.errors[0] || '');
    } else {
      setNameError('');
    }
  };

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

  const handleConfirmPasswordBlur = () => {
    if (confirmPassword) {
      const validation = validatePasswordMatch(password, confirmPassword);
      setConfirmPasswordError(validation.errors[0] || '');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');

    // Validate all fields
    const nameValidation = validateName(name);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const confirmPasswordValidation = validatePasswordMatch(password, confirmPassword);

    if (!nameValidation.valid) {
      setNameError(nameValidation.errors[0]);
      return;
    }

    if (!emailValidation.valid) {
      setEmailError(emailValidation.errors[0]);
      return;
    }

    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.errors[0]);
      return;
    }

    if (!confirmPasswordValidation.valid) {
      setConfirmPasswordError(confirmPasswordValidation.errors[0]);
      return;
    }

    if (!agreedToTerms) {
      setGeneralError('Please agree to the terms and conditions');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.register(email, password, name);
      // Show verification info instead of logging in immediately
      showVerificationInfo?.(email, result.verificationToken);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      if (message.includes('exists')) {
        setGeneralError('An account with this email already exists');
      } else if (message.includes('password')) {
        setGeneralError('Password does not meet requirements');
      } else {
        setGeneralError('Registration failed. Please try again.');
      }
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;
  const passwordRequirements = [
    { label: '8+ characters', valid: password.length >= 8 },
    { label: 'Uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'Number', valid: /\d/.test(password) },
    { label: 'Special character', valid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Input */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="Your name"
            className={cn(
              "w-full pl-11 pr-4 py-3 rounded-xl bg-muted/50 border border-border/50",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
              "transition-all placeholder:text-muted-foreground",
              nameError && "border-destructive focus:ring-destructive/50"
            )}
            disabled={isLoading}
          />
        </div>
        <AnimatePresence>
          {nameError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-1.5 text-destructive text-xs"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {nameError}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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

        {/* Password Requirements */}
        {password && (
          <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border/30">
            <p className="text-xs text-muted-foreground mb-2">Password requirements:</p>
            <div className="space-y-1">
              {passwordRequirements.map((req) => (
                <div key={req.label} className="flex items-center gap-2 text-xs">
                  {req.valid ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground" />
                  )}
                  <span className={cn(req.valid ? "text-foreground" : "text-muted-foreground")}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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

      {/* Confirm Password Input */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={handleConfirmPasswordBlur}
            placeholder="••••••••"
            className={cn(
              "w-full pl-11 pr-12 py-3 rounded-xl bg-muted/50 border border-border/50",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
              "transition-all placeholder:text-muted-foreground",
              confirmPasswordError && "border-destructive focus:ring-destructive/50"
            )}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <AnimatePresence>
          {confirmPasswordError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-1.5 text-destructive text-xs"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {confirmPasswordError}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Terms Agreement */}
      <div className="flex items-start gap-3">
        <input
          id="terms"
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-border bg-muted text-primary focus:ring-primary"
          disabled={isLoading}
        />
        <label htmlFor="terms" className="text-sm text-muted-foreground">
          I agree to the{' '}
          <a href="#" className="text-primary hover:underline">
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="#" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </label>
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
        disabled={isLoading || !name || !email || !password || !confirmPassword || !agreedToTerms}
        className={cn(
          "w-full py-3 rounded-xl font-medium transition-all",
          "bg-gradient-neon text-primary-foreground neon-glow-cyan",
          "hover:scale-105 active:scale-100",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        )}
      >
        {isLoading ? 'Creating account...' : 'Create account'}
      </button>

      {/* Toggle to Login */}
      {onToggleMode && (
        <div className="text-center">
          <button
            type="button"
            onClick={onToggleMode}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Already have an account? Sign in
          </button>
        </div>
      )}
    </form>
  );
};

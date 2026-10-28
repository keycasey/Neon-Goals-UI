/**
 * Password validation utilities
 * Requirements: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
}

/**
 * Validate password against requirements
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate password strength (0-4 scale)
 */
export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;

  const strengthMap: Record<number, PasswordStrength> = {
    0: { score: 0, label: 'Very Weak', color: 'bg-destructive' },
    1: { score: 1, label: 'Weak', color: 'bg-destructive' },
    2: { score: 2, label: 'Fair', color: 'bg-warning' },
    3: { score: 3, label: 'Good', color: 'bg-primary' },
    4: { score: 4, label: 'Strong', color: 'bg-green-500' },
  };

  return strengthMap[Math.min(score, 4)];
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that passwords match
 */
export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
  const errors: string[] = [];

  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate name (not empty, reasonable length)
 */
export function validateName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  }
  if (name.length > 100) {
    errors.push('Name must be less than 100 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

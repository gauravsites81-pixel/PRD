import { MIN_SCORE, MAX_SCORE, MIN_CHARITY_CONTRIBUTION, MAX_CHARITY_CONTRIBUTION } from '@/lib/constants';

/**
 * Validation utilities for form inputs and data
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateGolfScore(score: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(score)) {
    return { valid: false, error: 'Score must be a whole number' };
  }

  if (score < MIN_SCORE || score > MAX_SCORE) {
    return { valid: false, error: `Score must be between ${MIN_SCORE} and ${MAX_SCORE}` };
  }

  return { valid: true };
}

export function validateCharityContribution(percentage: number): { valid: boolean; error?: string } {
  if (percentage < MIN_CHARITY_CONTRIBUTION) {
    return { valid: false, error: `Contribution must be at least ${MIN_CHARITY_CONTRIBUTION}%` };
  }

  if (percentage > MAX_CHARITY_CONTRIBUTION) {
    return { valid: false, error: `Contribution cannot exceed ${MAX_CHARITY_CONTRIBUTION}%` };
  }

  return { valid: true };
}

export function validateDate(dateString: string): { valid: boolean; error?: string } {
  try {
    const date = new Date(dateString);
    const now = new Date();

    if (date > now) {
      return { valid: false, error: 'Date cannot be in the future' };
    }

    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid date format' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid date' };
  }
}

export function validateFullName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Name must not exceed 100 characters' };
  }

  return { valid: true };
}

export function validateScore(date: string, scores: Array<{ date: string }>): {
  valid: boolean;
  error?: string;
} {
  const scoreExists = scores.some((s) => s.date === date);

  if (scoreExists) {
    return { valid: false, error: 'Score already exists for this date' };
  }

  return { valid: true };
}

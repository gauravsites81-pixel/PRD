/**
 * App Constants and Configuration
 */

export const APP_NAME = 'GolfHeroes';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://golftrak.vercel.app';

// Currency
export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || 'GBP';
export const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '£';

// Stripe
export const STRIPE_MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID || '';
export const STRIPE_YEARLY_PRICE_ID = process.env.STRIPE_YEARLY_PRICE_ID || '';

// Golf scoring
export const MIN_SCORE = 1;
export const MAX_SCORE = 45;
export const MAX_STORED_SCORES = 5;

// Charity
export const MIN_CHARITY_CONTRIBUTION = 10; // %
export const MAX_CHARITY_CONTRIBUTION = 100; // %

// Prize pool distribution
export const PRIZE_POOL = {
  FIVE_MATCH: 0.4, // 40%
  FOUR_MATCH: 0.35, // 35%
  THREE_MATCH: 0.25, // 25%
} as const;

// Draw configuration
export const DRAW_TYPES = {
  RANDOM: 'random',
  ALGORITHMIC: 'algorithmic',
} as const;

export const DRAW_STATUS = {
  DRAFT: 'draft',
  SIMULATED: 'simulated',
  PUBLISHED: 'published',
} as const;

// Match types
export const MATCH_TYPES = [3, 4, 5] as const;

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  LAPSED: 'lapsed',
} as const;

// User roles
export const USER_ROLES = {
  SUBSCRIBER: 'subscriber',
  ADMIN: 'admin',
} as const;

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
} as const;

// Winner proof status
export const WINNER_PROOF_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Routes
export const PUBLIC_ROUTES = ['/', '/charities', '/how-it-works', '/pricing'];
export const AUTH_ROUTES = ['/signup', '/login', '/forgot-password', '/verify-email'];
export const PROTECTED_ROUTES = ['/dashboard', '/admin'];

// Time constants
export const DAYS_IN_MONTH = 30;
export const HOURS_IN_DAY = 24;
export const MINUTES_IN_HOUR = 60;

// Dates
export const getCurrentMonth = () => new Date().getMonth() + 1;
export const getCurrentYear = () => new Date().getFullYear();

// API
export const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://golftrak.vercel.app';

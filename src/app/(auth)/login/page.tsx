'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase-provider';
import { validateEmail } from '@/utils/validators';

export default function LoginPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nextPath, setNextPath] = useState('/dashboard');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [rateLimitHit, setRateLimitHit] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Prevent multiple clicks
  const [lastRequestTime, setLastRequestTime] = useState(0); // Global rate guard

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');

    if (next?.startsWith('/') && !next.startsWith('//')) {
      setNextPath(next);
    }

    // Check for existing cooldown from localStorage
    const storedCooldown = localStorage.getItem('emailResendCooldown');
    const storedRateLimit = localStorage.getItem('emailRateLimitHit');
    const storedLastRequest = localStorage.getItem('lastEmailRequestTime');
    
    if (storedRateLimit) {
      setRateLimitHit(true);
    }
    
    if (storedCooldown) {
      const cooldownEnd = parseInt(storedCooldown);
      const now = Date.now();
      if (now < cooldownEnd) {
        setCooldownTime(Math.ceil((cooldownEnd - now) / 1000));
      } else {
        localStorage.removeItem('emailResendCooldown');
        localStorage.removeItem('emailRateLimitHit');
        setRateLimitHit(false);
      }
    }

    if (storedLastRequest) {
      setLastRequestTime(parseInt(storedLastRequest));
    }
  }, []);

  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            localStorage.removeItem('emailResendCooldown');
            localStorage.removeItem('emailRateLimitHit');
            setRateLimitHit(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Enter a valid email address');
      return;
    }

    if (!password) {
      setError('Enter your password');
      return;
    }

    setIsLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      // Provide more user-friendly error messages
      if (loginError.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (loginError.message?.includes('Email not confirmed')) {
        setError('Please verify your email address before logging in.');
        setMessage('Need a new verification email? Click the button below.');
      } else {
        setError(loginError.message || 'Login failed. Please try again.');
      }
      setIsLoading(false);
      return;
    }

    await fetch('/api/auth/profile', { method: 'POST' });

    router.replace(nextPath);
    router.refresh();
  }

  async function handleResendVerification() {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }

    // Global rate guard - prevent too frequent requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < 60000) { // 60 seconds
      setError('Please wait before making another request.');
      return;
    }

    // Prevent multiple rapid clicks
    if (isProcessing) {
      return;
    }

    // Check if cooldown is active
    if (cooldownTime > 0) {
      setError(`Please wait ${cooldownTime} seconds before requesting another email.`);
      return;
    }

    setIsProcessing(true);
    setIsResending(true);
    setError('');
    setMessage('');
    setLastRequestTime(now);
    localStorage.setItem('lastEmailRequestTime', now.toString());

    try {
      // Use signup type for resend verification
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://golftrak.vercel.app'}/dashboard`,
        },
      });

      if (resendError) {
        // Resend error occurred
        if (resendError.message?.includes('User not found')) {
          setError('No account found with this email address. Please sign up first.');
        } else if (resendError.message?.includes('already confirmed')) {
          setError('This email is already verified. You can log in.');
        } else if (resendError.message?.includes('rate limit') || resendError.message?.includes('too many requests') || resendError.message?.includes('over_email_rate_limit')) {
          setError('Too many attempts. Please wait before trying again.');
          // Set 3 minute cooldown for rate limit
          const cooldownEnd = Date.now() + (3 * 60 * 1000);
          localStorage.setItem('emailResendCooldown', cooldownEnd.toString());
          localStorage.setItem('emailRateLimitHit', 'true');
          setCooldownTime(180);
          setRateLimitHit(true);
        } else {
          setError(resendError.message || 'Failed to resend verification email. Please try again.');
        }
      } else {
        // Verification email sent successfully
        setMessage('Email sent! Please check your inbox.');
        // Set 60-second cooldown after successful send
        const cooldownEnd = Date.now() + (60 * 1000);
        localStorage.setItem('emailResendCooldown', cooldownEnd.toString());
        setCooldownTime(60);
        setRateLimitHit(false);
      }
    } catch (error) {
      // Unexpected error during resend
      setError('An unexpected error occurred. Please try again.');
    }

    setIsResending(false);
    setIsProcessing(false);
  }

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-12 text-slate-950">
      <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm font-bold text-emerald-700">
          GolfHeroes
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold">Log in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Access your scores, charity selection, and draw dashboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-bold text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-md border-slate-300"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-bold text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-md border-slate-300"
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {message ? (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium text-emerald-800">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {message && email && error?.includes('verify your email') ? (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={isResending || cooldownTime > 0 || isProcessing}
              className="w-full rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResending ? 'Sending...' : 
               cooldownTime > 0 ? `Resend in ${cooldownTime}s` : 
               'Resend verification email'}
            </button>
          ) : null}

          {rateLimitHit && (
            <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
              <p className="text-xs text-amber-800">
                Rate limit active. Please wait before requesting another email.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-emerald-500 px-4 py-3 font-extrabold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-600">
          <div className="mb-3">
            <Link href="/forgot-password" className="font-semibold leading-6 text-emerald-600 hover:text-emerald-500">
              Forgot your password?
            </Link>
          </div>
          <div>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold leading-6 text-emerald-600 hover:text-emerald-500">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

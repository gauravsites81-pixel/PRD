'use client';

import Link from 'next/link';
import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase-provider';
import { validateEmail, validateFullName, validatePassword } from '@/utils/validators';

export default function SignupPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [cooldownTime, setCooldownTime] = useState(0);
  const [rateLimitHit, setRateLimitHit] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Prevent multiple clicks
  const [lastRequestTime, setLastRequestTime] = useState(0); // Global rate guard

  useEffect(() => {
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
    setMessage('');

    const nameValidation = validateFullName(fullName);
    if (!nameValidation.valid) {
      setError(nameValidation.error || 'Enter your full name');
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation) {
      setError('Enter a valid email address');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.errors[0]);
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

    setIsProcessing(true);
    setIsLoading(true);
    setSignupEmail(email); // Preserve email for resend functionality
    setLastRequestTime(now);
    localStorage.setItem('lastEmailRequestTime', now.toString());

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://golftrak.vercel.app'}/dashboard`,
      },
    });

    if (signUpError) {
      // Handle duplicate email gracefully
      if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already been registered') || signUpError.message?.includes('User already registered')) {
        setError('Email already exists. Please verify your email.');
        setMessage('Check your inbox for the verification email.');
        // Set 60-second cooldown for resend
        const cooldownEnd = Date.now() + (60 * 1000);
        localStorage.setItem('emailResendCooldown', cooldownEnd.toString());
        setCooldownTime(60);
      } else if (signUpError.message?.includes('rate limit') || signUpError.message?.includes('too many requests') || signUpError.message?.includes('over_email_rate_limit')) {
        setError('Too many attempts. Please wait before trying again.');
        // Set longer cooldown for rate limit
        const cooldownEnd = Date.now() + (3 * 60 * 1000);
        localStorage.setItem('emailResendCooldown', cooldownEnd.toString());
        setCooldownTime(180);
        setRateLimitHit(true);
      } else {
        setError(signUpError.message || 'Failed to create account. Please try again.');
      }
      setIsLoading(false);
      setIsProcessing(false);
      return;
    }

    if (data.session) {
      const profileResponse = await fetch('/api/auth/profile', { method: 'POST' });

      if (!profileResponse.ok) {
        const profileResult = await profileResponse.json();
        setError(profileResult.error || 'Account created, but profile setup failed');
        setIsLoading(false);
        return;
      }

      router.replace('/dashboard');
      router.refresh();
      return;
    }

    setMessage('Email sent! Please check your inbox.');
    // Set 60-second cooldown after successful signup
    const cooldownEnd = Date.now() + (60 * 1000);
    localStorage.setItem('emailResendCooldown', cooldownEnd.toString());
    setCooldownTime(60);
    setIsLoading(false);
    setIsProcessing(false);
  }

  async function handleResendVerification() {
    const emailToUse = email || signupEmail;
    
    if (!emailToUse) {
      setError('Please enter your email address first.');
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

    // Resending verification to email

    try {
      // Use signup type for resend verification
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: emailToUse,
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
        setMessage(`Email sent! Please check your inbox.`);
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
        <h1 className="mt-6 text-3xl font-extrabold">Create your account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Join with email and password. Subscription setup comes next.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="fullName" className="text-sm font-bold text-slate-700">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-2 w-full rounded-md border-slate-300"
              autoComplete="name"
              required
            />
          </div>

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
              autoComplete="new-password"
              required
            />
            <p className="mt-2 text-xs text-slate-500">
              Minimum 8 characters with uppercase, lowercase, and a number.
            </p>
          </div>

          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {message}
            </p>
          ) : null}

          {message && (email || signupEmail) ? (
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
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-emerald-700">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');

    if (next?.startsWith('/') && !next.startsWith('//')) {
      setNextPath(next);
    }
  }, []);

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

    setIsResending(true);
    setError('');
    setMessage('');

    console.log('Resending verification to email:', email);

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://golftrak.vercel.app'}/dashboard`,
      },
    });

    if (resendError) {
      console.error('Resend error:', resendError);
      if (resendError.message?.includes('User not found')) {
        setError('No account found with this email address. Please sign up first.');
      } else if (resendError.message?.includes('already confirmed')) {
        setError('This email is already verified. You can log in.');
      } else if (resendError.message?.includes('rate limit') || resendError.message?.includes('too many requests')) {
        setError('Too many email requests. Please wait a few minutes before trying again.');
      } else {
        setError(resendError.message || 'Failed to resend verification email. Please try again.');
      }
    } else {
      console.log('Verification email sent successfully to:', email);
      setMessage(`Verification email sent to ${email}! Please check your inbox.`);
    }

    setIsResending(false);
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
              disabled={isResending}
              className="w-full rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResending ? 'Resending...' : 'Resend verification email'}
            </button>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-emerald-500 px-4 py-3 font-extrabold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Need an account?{' '}
          <Link href="/signup" className="font-bold text-emerald-700">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

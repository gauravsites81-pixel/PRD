'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase-provider';
import { validateEmail } from '@/utils/validators';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    const emailValidation = validateEmail(email);
    if (!emailValidation) {
      setError('Enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://golftrak.vercel.app'}/reset-password`,
      });

      if (resetError) {
        console.error('Password reset error:', resetError);
        if (resetError.message?.includes('User not found')) {
          setError('No account found with this email address.');
        } else if (resetError.message?.includes('rate limit') || resetError.message?.includes('too many requests')) {
          setError('Too many requests. Please wait before trying again.');
        } else {
          setError(resetError.message || 'Failed to send reset email. Please try again.');
        }
      } else {
        // Password reset email sent successfully
        setMessage('Password reset email sent! Please check your inbox and follow the instructions.');
        setEmail(''); // Clear email field
      }
    } catch (error) {
      console.error('Unexpected error during password reset:', error);
      setError('An unexpected error occurred. Please try again.');
    }

    setIsLoading(false);
  }

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-12 text-slate-950">
      <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm font-bold text-emerald-700">
          GolfHeroes
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-900">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                placeholder="Enter your email address"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {message && (
            <div className="rounded-md bg-emerald-50 p-3">
              <p className="text-sm text-emerald-800">{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-semibold leading-6 text-slate-950 shadow-sm hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          >
            {isLoading ? 'Sending...' : 'Send reset email'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Remember your password?{' '}
          <Link href="/login" className="font-semibold leading-6 text-emerald-600 hover:text-emerald-500">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

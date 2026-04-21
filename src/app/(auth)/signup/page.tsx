'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    const nameValidation = validateFullName(fullName);
    if (!nameValidation.valid) {
      setError(nameValidation.error || 'Enter your full name');
      return;
    }

    if (!validateEmail(email)) {
      setError('Enter a valid email address');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.errors[0]);
      return;
    }

    setIsLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://golftrak.vercel.app'}/auth/callback?next=/dashboard`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
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

    setMessage('Check your email to confirm your account, then log in.');
    setIsLoading(false);
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

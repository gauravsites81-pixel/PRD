'use client';

import { useState } from 'react';

type Props = {
  disabled?: boolean;
};

export function BillingManager({ disabled = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleManageBilling() {
    if (disabled) {
      setError('You need an active subscription to manage billing');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to open billing portal');
        return;
      }

      // Redirect to Stripe billing portal
      window.location.href = data.url;
    } catch (err) {
      console.error('Billing portal error:', err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Management</h3>
      
      <p className="text-gray-600 mb-6">
        Manage your subscription, update payment methods, and view billing history.
      </p>

      <button
        onClick={handleManageBilling}
        disabled={disabled || loading}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
      >
        {loading ? (
          <>
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-r-2 border-white mr-2"></div>
            Opening Billing Portal...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h1a1 1 0 011 1v4a1 1 0 011-1h1a1 1 0 011-1v-4a1 1 0 01-1 1h-1a1 1 0 01-1 4a1 1 0 01-1 1z" />
            </svg>
            Manage Subscription
          </>
        )}
      </button>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        <p className="font-medium">Need help?</p>
        <p>Contact support at support@golfheroes.com</p>
      </div>
    </div>
  );
}

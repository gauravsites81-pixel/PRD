'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { User, Draw, DrawResult } from '@/types/database';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawRunning, setIsDrawRunning] = useState(false);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [drawResults, setDrawResults] = useState<DrawResult[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [prizePool, setPrizePool] = useState({ total: 0, activeSubscribers: 0, distribution: { first: 40, second: 35, third: 25 } });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
    fetchData();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/login?next=/admin';
        return;
      }

      // Check if user is admin
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      const isAdmin = user?.email === adminEmail;
      
      if (!isAdmin) {
        console.warn('Access denied: User is not admin');
        window.location.href = '/';
        return;
      }

      // Check if user has admin privileges
      const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!hasServiceKey) {
        console.warn('Service role key not configured, using basic access');
      }

      setUser(user);
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking admin access:', error);
      window.location.href = '/';
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch draws
      const { data: drawsData } = await supabase
        .from('draws')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch subscriptions
      const { data: subscriptionsData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active');

      // Fetch draw results with user info
      const { data: resultsData } = await supabase
        .from('draw_results')
        .select(`
          *,
          users!winner_user_id (
            email,
            full_name
          ),
          draws (
            created_at,
            drawn_numbers
          )
        `)
        .order('created_at', { ascending: false });

      // Calculate prize pool
      const activeSubscribers = subscriptionsData?.length || 0;
      const totalPool = activeSubscribers * 10; // $10 per subscriber
      const distribution = { first: 40, second: 35, third: 25 };

      setDraws(drawsData || []);
      setUsers(usersData || []);
      setSubscriptions(subscriptionsData || []);
      setDrawResults(resultsData || []);
      setPrizePool({ total: totalPool, activeSubscribers, distribution });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    }
  };

  const handleApproveWinner = async (winnerId: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('draw_results')
        .update({
          verification_status: 'approved'
        })
        .eq('id', winnerId);

      if (error) {
        setError('Failed to approve winner');
        return;
      }

      setSuccess('Winner approved successfully!');
      await fetchData();
    } catch (error) {
      console.error('Error approving winner:', error);
      setError('Failed to approve winner');
    }
  };

  const handleMarkPaid = async (winnerId: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('draw_results')
        .update({
          payment_status: 'paid'
        })
        .eq('id', winnerId);

      if (error) {
        setError('Failed to mark as paid');
        return;
      }

      setSuccess('Winner marked as paid successfully!');
      await fetchData();
    } catch (error) {
      console.error('Error marking paid:', error);
      setError('Failed to mark as paid');
    }
  };

  const handleRejectWinner = async (winnerId: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('draw_results')
        .update({
          verification_status: 'rejected'
        })
        .eq('id', winnerId);

      if (error) {
        setError('Failed to reject winner');
        return;
      }

      setSuccess('Winner rejected successfully!');
      await fetchData();
    } catch (error) {
      console.error('Error rejecting winner:', error);
      setError('Failed to reject winner');
    }
  };

  const runDraw = async () => {
    setIsDrawRunning(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/draw/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run draw');
      }

      setSuccess(`Draw completed successfully! ${data.resultsCount} winners found.`);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error running draw:', error);
      setError(error instanceof Error ? error.message : 'Failed to run draw');
    } finally {
      setIsDrawRunning(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-2">Manage draws, users, and results</p>
            </div>
            {user && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 ml-4">
                <div className="text-sm text-gray-600 mb-1">Logged in as:</div>
                <div className="font-medium text-gray-900">{user.email}</div>
                <div className="text-xs text-gray-500 mt-1">ID: {user.id}</div>
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Draw Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Draw Controls</h2>
          <button
            onClick={runDraw}
            disabled={isDrawRunning}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            {isDrawRunning ? 'Running Draw...' : 'Run Draw'}
          </button>
        </div>

        {/* Prize Pool Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Prize Pool Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Pool</p>
              <p className="text-2xl font-bold text-blue-600">${prizePool.total}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Active Subscriptions</p>
              <p className="text-2xl font-bold text-green-600">{prizePool.activeSubscribers}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Prize per Sub</p>
              <p className="text-2xl font-bold text-purple-600">$10</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Distribution</p>
              <p className="text-lg font-bold text-orange-600">40/35/25</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Prize Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between bg-yellow-50 p-3 rounded">
                <span className="text-sm font-medium text-yellow-800">1st Prize (40%)</span>
                <span className="text-lg font-bold text-yellow-900">${(prizePool.total * 0.4).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between bg-blue-50 p-3 rounded">
                <span className="text-sm font-medium text-blue-800">2nd Prize (35%)</span>
                <span className="text-lg font-bold text-blue-900">${(prizePool.total * 0.35).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between bg-green-50 p-3 rounded">
                <span className="text-sm font-medium text-green-800">3rd Prize (25%)</span>
                <span className="text-lg font-bold text-green-900">${(prizePool.total * 0.25).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Winners Verification */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Winner Verification</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Winner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prize
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proof
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drawResults.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No winners yet
                    </td>
                  </tr>
                ) : (
                  drawResults.map((result: any) => (
                  <tr key={result.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.users?.email || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${result.prize_amount?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.proof_url ? (
                          <a 
                            href={result.proof_url} 
                            target="_blank"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            View Proof
                          </a>
                        ) : (
                          <span className="text-gray-500">No proof</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          result.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
                          result.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {result.verification_status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          result.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                          result.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {result.payment_status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {result.verification_status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveWinner(result.id)}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectWinner(result.id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {result.verification_status === 'approved' && result.payment_status === 'pending' && (
                            <button
                              onClick={() => handleMarkPaid(result.id)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Mark Paid
                            </button>
                          )}
                          {result.verification_status === 'rejected' && (
                            <button
                              onClick={() => handleApproveWinner(result.id)}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Reconsider
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Draw History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Draw History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Draw Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Winning Numbers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Pool
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Winners Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {draws.map((draw) => {
                  const drawWinners = drawResults.filter(result => result.draw_id === draw.id);
                  return (
                    <tr key={draw.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(draw.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {draw.drawn_numbers.map((num, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                            >
                              {num}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(drawWinners.length * 10).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {drawWinners.length}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {draws.length === 0 && (
              <div className="text-center py-8 text-gray-500">No draws found</div>
            )}
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Users List</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const userSubscription = subscriptions.find(sub => sub.user_id === user.id);
                  return (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.full_name || 'Not set'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userSubscription?.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : userSubscription?.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {userSubscription?.status || 'none'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">No users found</div>
            )}
          </div>
        </div>

        {/* Draw Results */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Draw Results</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Draw Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matches
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prize
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drawResults.map((result) => (
                  <tr key={result.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {(result as any).users?.full_name || (result as any).users?.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(result as any).users?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate((result as any).draws?.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        result.match_type === 5 
                          ? 'bg-yellow-100 text-yellow-800'
                          : result.match_type === 4
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {result.match_type} matches
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${result.prize_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        result.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {result.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {drawResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">No draw results found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

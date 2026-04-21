'use client';

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import type { DrawResult, Draw } from '@/types/database';

type Props = {
  userId: string;
  disabled?: boolean;
};

export function WinningsNew({ userId, disabled = false }: Props) {
  const supabase = createBrowserSupabaseClient();
  const [winnings, setWinnings] = useState<DrawResult[]>([]);
  const [participatedDraws, setParticipatedDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWinningsData();
  }, [userId, fetchWinningsData]);

  async function fetchWinningsData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch user's winnings with draw info
      const { data: winningsData, error: winningsError } = await supabase
        .from('draw_results')
        .select(`
          id,
          created_at,
          match_type,
          prize_amount,
          payment_status,
          draws!inner (
            created_at,
            drawn_numbers
          )
        `)
        .eq('winner_user_id', userId)
        .order('created_at', { ascending: false });

      if (winningsError) {
        console.error('Error fetching winnings:', winningsError);
        setError('Failed to fetch winnings data');
        return;
      }

      // Extract unique draws from winnings
      const drawIds = winningsData?.map(w => w.draw?.id).filter(Boolean) || [];
      const uniqueDrawIds = [...new Set(drawIds)];

      // Fetch unique draw details
      let drawDetails: Draw[] = [];
      if (uniqueDrawIds.length > 0) {
        const { data: drawsData } = await supabase
          .from('draws')
          .select('id, created_at, drawn_numbers')
          .in('id', uniqueDrawIds)
          .order('created_at', { ascending: false });
        
        drawDetails = drawsData || [];
      }

      // Fetch all draws to check participation
      const { data: allDraws } = await supabase
        .from('draws')
        .select('id, created_at, drawn_numbers')
        .order('created_at', { ascending: false });

      // Check which draws user participated in (has scores for)
      const { data: userScores } = await supabase
        .from('golf_scores')
        .select('date')
        .eq('user_id', userId);

      if (userScores && userScores.length > 0) {
        const userDates = userScores.map(s => new Date(s.date));
        
        const participatedDraws = allDraws?.filter((draw: any) => {
          const drawDate = new Date(draw.created_at);
          return userDates.some(scoreDate => scoreDate < drawDate);
        }) || [];
        
        setParticipatedDraws(participatedDraws);
      } else {
        setParticipatedDraws([]);
      }

      setWinnings(winningsData || []);
    } catch (err) {
      console.error('Error in fetchWinningsData:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getMatchTypeColor = (matchType: number) => {
    switch (matchType) {
      case 5:
        return 'text-yellow-700 bg-yellow-100';
      case 4:
        return 'text-blue-700 bg-blue-100';
      case 3:
        return 'text-green-700 bg-green-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const totalWinnings = winnings.reduce((sum, w) => sum + w.prize_amount, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-r-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading winnings data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Winnings</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(totalWinnings)}
          </p>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Wins</h3>
          <p className="text-3xl font-bold text-blue-600">
            {winnings.length}
          </p>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Participations</h3>
          <p className="text-3xl font-bold text-purple-600">
            {participatedDraws.length}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Winnings History */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Winnings History</h3>
        </div>
        
        {winnings.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No winnings yet. Keep playing!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                {winnings.map((winning) => (
                  <tr key={winning.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(winning.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMatchTypeColor(winning.match_type)}`}>
                        {winning.match_type} matches
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(winning.prize_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(winning.payment_status)}`}>
                        {winning.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Participation History */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Draw Participation</h3>
        </div>
        
        {participatedDraws.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No draw participations yet. Add scores to participate!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Draw Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numbers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participatedDraws.map((draw) => (
                  <tr key={draw.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(draw.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        {draw.drawn_numbers?.map((num, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {winnings.some(w => w.draw?.id === draw.id) ? (
                        <span className="text-green-600 font-medium">Won!</span>
                      ) : (
                        <span className="text-gray-500">No win</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

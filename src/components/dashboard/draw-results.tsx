import React from 'react';

interface Draw {
  id: string;
  created_at: string;
  drawn_numbers: number[];
}

interface DrawResult {
  id: string;
  user_id: string;
  draw_id: string;
  matched_count: number;
  matched_numbers: number[];
  created_at: string;
}

interface DrawResultsProps {
  draw: Draw | null;
  userResult: DrawResult | null;
}

export default function DrawResults({ draw, userResult }: DrawResultsProps) {
  if (!draw) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Latest Draw</h2>
        <p className="text-gray-500">No draws available yet.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Latest Draw</h2>
      
      {/* Draw Date */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">Draw Date</p>
        <p className="text-base font-medium text-gray-900">
          {formatDate(draw.created_at)}
        </p>
      </div>

      {/* Draw Numbers */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-3">Winning Numbers</p>
        <div className="flex gap-2 flex-wrap">
          {draw.drawn_numbers.map((number, index) => (
            <div
              key={index}
              className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-lg shadow-sm"
            >
              {number}
            </div>
          ))}
        </div>
      </div>

      {/* User Results */}
      <div className="border-t pt-4">
        <h3 className="text-base font-medium text-gray-900 mb-2">Your Result</h3>
        
        {userResult ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl font-bold text-blue-600">
                {userResult.matched_count}
              </span>
              <span className="text-gray-600">
                {userResult.matched_count === 1 ? 'match' : 'matches'}
              </span>
            </div>
            
            {userResult.matched_numbers.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Your matched numbers:</p>
                <div className="flex gap-2 flex-wrap">
                  {userResult.matched_numbers.map((number, index) => (
                    <div
                      key={index}
                      className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-medium text-sm"
                    >
                      {number}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prize Tier Indicator */}
            <div className="mt-4">
              {userResult.matched_count === 5 && (
                <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-sm font-medium">
                  🎉 Jackpot Winner! 5 matches
                </div>
              )}
              {userResult.matched_count === 4 && (
                <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
                  🏆 Tier 2 Winner! 4 matches
                </div>
              )}
              {userResult.matched_count === 3 && (
                <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                  🎯 Tier 3 Winner! 3 matches
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-gray-500">
            No matches this draw
          </div>
        )}
      </div>
    </div>
  );
}

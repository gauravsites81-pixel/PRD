import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { Database, Draw, DrawResult, GolfScore } from '@/types/database';

interface PrizePool {
  total_pool: number;
  match_5_pool: number;
  match_4_pool: number;
  match_3_pool: number;
  rollover_amount: number;
  active_subscriber_count: number;
}

interface DrawResultWithPrize extends Omit<DrawResult, 'id' | 'created_at'> {
  actual_prize_amount: number;
}

export async function POST() {
  try {
    const supabase = createServiceRoleClient();

    // Generate 5 unique random numbers (1-45)
    const drawNumbers = generateUniqueRandomNumbers(5, 1, 45);

    // Get current month and year
    const now = new Date();
    const month = now.getMonth() + 1; // JavaScript months are 0-indexed
    const year = now.getFullYear();

    // Insert new draw
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .insert({
        month,
        year,
        status: 'published',
        draw_type: 'random',
        drawn_numbers: drawNumbers,
        jackpot_carried_over: false,
        carried_over_amount: 0,
      })
      .select()
      .single();

    if (drawError) {
      console.error('Error creating draw:', drawError);
      return NextResponse.json(
        { error: 'Failed to create draw' },
        { status: 500 }
      );
    }

    // Count active subscriptions and calculate prize pool
    const prizePool = await calculatePrizePool(supabase);
    
    // Fetch all users' golf scores
    const { data: allScores, error: scoresError } = await supabase
      .from('golf_scores')
      .select('user_id, score')
      .not('score', 'is', null);

    if (scoresError) {
      console.error('Error fetching golf scores:', scoresError);
      return NextResponse.json(
        { error: 'Failed to fetch golf scores' },
        { status: 500 }
      );
    }

    // Group scores by user_id and get up to 5 scores per user
    const userScoresMap = groupScoresByUser(allScores || []);

    // Process each user's scores against draw numbers
    const drawResults: DrawResultWithPrize[] = [];
    const winnersByMatchType: Record<number, string[]> = {
      3: [],
      4: [],
      5: []
    };

    for (const [userId, scores] of Object.entries(userScoresMap)) {
      const matchResult = findMatches(scores, drawNumbers);
      
      if (matchResult.matchedCount >= 3) {
        const matchType = matchResult.matchedCount as 3 | 4 | 5;
        winnersByMatchType[matchType].push(userId);
        
        drawResults.push({
          draw_id: draw.id,
          match_type: matchType,
          winner_user_id: userId,
          prize_amount: 0, // Will be calculated based on pool distribution
          payment_status: 'pending',
          actual_prize_amount: 0, // Will be calculated
        });
      }
    }

    // Calculate prize distribution and handle rollover
    const { prizeDistribution, finalPrizePool } = calculatePrizeDistribution(prizePool, winnersByMatchType);
    
    // Update draw results with actual prize amounts
    const finalDrawResults = drawResults.map(result => ({
      ...result,
      prize_amount: prizeDistribution[result.match_type] / winnersByMatchType[result.match_type].length,
      actual_prize_amount: prizeDistribution[result.match_type] / winnersByMatchType[result.match_type].length
    }));

    // Insert draw results for users with 3+ matches
    if (finalDrawResults.length > 0) {
      const { error: resultsError } = await supabase
        .from('draw_results')
        .insert(finalDrawResults.map(({ actual_prize_amount, ...result }) => result));

      if (resultsError) {
        console.error('Error inserting draw results:', resultsError);
        return NextResponse.json(
          { error: 'Failed to save draw results' },
          { status: 500 }
        );
      }

      try {
        const emailResponse = await fetch('/api/emails/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'draw_completed',
            userId: 'admin@golfheroes.com', // Send to admin for now
            data: {
              numbers: drawNumbers,
              winnersCount: finalDrawResults.length,
              prizePool: finalPrizePool,
            },
          }),
        });

        if (!emailResponse.ok) {
          console.error('Failed to send draw completion email');
        }

        // Send winner emails
        for (const winner of finalDrawResults) {
          const winnerUser = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', winner.winner_user_id)
            .single();

          if (winnerUser) {
            await fetch('/api/emails/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'user_won',
                userId: winner.winner_user_id,
                data: {
                  matchType: winner.match_type,
                  prizeAmount: winner.prize_amount,
                  drawNumbers: drawNumbers,
                },
              }),
            });
          }
        }

        console.log(`Successfully completed draw with ${finalDrawResults.length} winners and prize distribution.`);

        return NextResponse.json({
          draw,
          prizePool: {
            total: finalPrizePool.total_pool,
            activeSubscribers: finalPrizePool.active_subscriber_count,
            distribution: {
              match5: finalPrizePool.match_5_pool,
              match4: finalPrizePool.match_4_pool,
              match3: finalPrizePool.match_3_pool,
            },
            rollover: finalPrizePool.rollover_amount,
            winners: {
              match5: winnersByMatchType[5].length,
              match4: winnersByMatchType[4].length,
              match3: winnersByMatchType[3].length,
            },
            prizes: prizeDistribution
          },
          message: 'Draw completed',
          resultsCount: finalDrawResults.length,
        });
      } catch (error) {
        console.error('Error sending email notifications:', error);
      }
    }

    // Store prize pool information
    const { error: poolError } = await supabase
      .from('prize_pools')
      .insert({
        draw_id: draw.id,
        total_pool: finalPrizePool.total_pool,
        match_5_pool: finalPrizePool.match_5_pool,
        match_4_pool: finalPrizePool.match_4_pool,
        match_3_pool: finalPrizePool.match_3_pool,
        rollover_amount: finalPrizePool.rollover_amount,
        active_subscriber_count: finalPrizePool.active_subscriber_count,
      });

    if (poolError) {
      console.error('Error inserting prize pool:', poolError);
      return NextResponse.json(
        { error: 'Failed to save prize pool' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      draw,
      prizePool: {
        total: finalPrizePool.total_pool,
        activeSubscribers: finalPrizePool.active_subscriber_count,
        distribution: {
          match5: finalPrizePool.match_5_pool,
          match4: finalPrizePool.match_4_pool,
          match3: finalPrizePool.match_3_pool,
        },
        rollover: finalPrizePool.rollover_amount,
        winners: {
          match5: winnersByMatchType[5].length,
          match4: winnersByMatchType[4].length,
          match3: winnersByMatchType[3].length,
        },
        prizes: prizeDistribution
      },
      message: 'Draw completed',
      resultsCount: finalDrawResults.length,
    });

  } catch (error) {
    console.error('Unexpected error in draw execution:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate prize pool based on active subscriptions
 */
async function calculatePrizePool(supabase: ReturnType<typeof createServiceRoleClient>): Promise<PrizePool> {
  // Count active subscriptions
  const { count: activeSubscriberCount, error: countError } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  if (countError) {
    console.error('Error counting active subscriptions:', countError);
    // Default to 0 if there's an error
    return {
      total_pool: 0,
      match_5_pool: 0,
      match_4_pool: 0,
      match_3_pool: 0,
      rollover_amount: 0,
      active_subscriber_count: 0,
    };
  }

  const subscriberCount = activeSubscriberCount || 0;
  const subscriptionPrice = 10; // $10 per subscription - adjust as needed
  const totalPool = subscriberCount * subscriptionPrice;

  // Calculate pool distribution (40/35/25 split)
  const match5Pool = totalPool * 0.40;
  const match4Pool = totalPool * 0.35;
  const match3Pool = totalPool * 0.25;

  return {
    total_pool: totalPool,
    match_5_pool: match5Pool,
    match_4_pool: match4Pool,
    match_3_pool: match3Pool,
    rollover_amount: 0, // Will be updated based on winners
    active_subscriber_count: subscriberCount,
  };
}

/**
 * Calculate prize distribution with rollover logic
 */
function calculatePrizeDistribution(
  prizePool: PrizePool, 
  winnersByMatchType: Record<number, string[]>
): { prizeDistribution: Record<number, number>; finalPrizePool: PrizePool } {
  const distribution: Record<number, number> = {
    3: prizePool.match_3_pool,
    4: prizePool.match_4_pool,
    5: prizePool.match_5_pool,
  };

  let rolloverAmount = 0;

  // If no 5-match winners, add 5-match pool to rollover
  if (winnersByMatchType[5].length === 0) {
    distribution[5] = 0; // No winners, so no prize
    rolloverAmount = prizePool.match_5_pool;
  }

  const finalPrizePool: PrizePool = {
    ...prizePool,
    rollover_amount: rolloverAmount,
  };

  return {
    prizeDistribution: distribution,
    finalPrizePool,
  };
}

/**
 * Generate unique random numbers within a range
 */
function generateUniqueRandomNumbers(count: number, min: number, max: number): number[] {
  const numbers: number[] = [];
  const availableNumbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  for (let i = 0; i < count && availableNumbers.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const selectedNumber = availableNumbers.splice(randomIndex, 1)[0];
    numbers.push(selectedNumber);
  }

  return numbers.sort((a, b) => a - b);
}

/**
 * Group golf scores by user_id and limit to 5 most recent scores per user
 */
function groupScoresByUser(scores: Pick<GolfScore, 'user_id' | 'score'>[]): Record<string, number[]> {
  const userScoresMap: Record<string, number[]> = {};

  for (const score of scores) {
    if (!userScoresMap[score.user_id]) {
      userScoresMap[score.user_id] = [];
    }
    
    if (userScoresMap[score.user_id].length < 5 && score.score !== null) {
      userScoresMap[score.user_id].push(score.score);
    }
  }

  return userScoresMap;
}

/**
 * Find matches between user scores and draw numbers
 */
function findMatches(userScores: number[], drawNumbers: number[]): {
  matchedCount: number;
  matchedNumbers: number[];
} {
  const matchedNumbers = userScores.filter(score => 
    drawNumbers.includes(score)
  );

  return {
    matchedCount: matchedNumbers.length,
    matchedNumbers: [...new Set(matchedNumbers)], // Remove duplicates
  };
}

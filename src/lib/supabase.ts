import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export const supabase = createClientComponentClient<Database>();
export const supabaseAny = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ================= USER =================
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// ================= SCORES =================
export async function getUserScores(userId: string) {
  const { data, error } = await supabase
    .from('golf_scores')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(5);

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

export async function addGolfScore(score: number, date: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'User not authenticated' };
  }

  const { data, error } = await supabaseAny
    .from('golf_scores')
    .insert([
      {
        user_id: user.id,
        score,
        date: new Date().toISOString(),
      },
    ])
    .select();

  if (error) {
      // HANDLE DUPLICATE ERROR CLEANLY
    if (error.code === '23505') {
      return { error: 'You already added a score for this date' };
    }

    console.error(error);
    return { error: error.message };
  }

  return { data };
}

export async function updateGolfScore(
  userId: string,
  scoreId: string,
  score: number,
  date: string
) {
  const { data, error } = await supabaseAny
    .from('golf_scores')
    .update({ score, date })
    .eq('id', scoreId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error(error);
    return { error: error.message };
  }

  return { data };
}

export async function deleteGolfScore(userId: string, scoreId: string) {
  const { error } = await supabase
    .from('golf_scores')
    .delete()
    .eq('id', scoreId)
    .eq('user_id', userId);

  if (error) {
    console.error(error);
    return { error: error.message };
  }

  return { data: true };
}

// ================= CHARITY =================
export async function getCharities() {
  const { data, error } = await supabase
    .from('charities')
    .select('*')
    .order('name');

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

export async function getUserCharity(userId: string) {
  const { data, error } = await supabase
    .from('user_charity')
    .select('*, charities(*)')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error(error);
    return null;
  }

  return data || null;
}

export async function updateUserCharity(
  userId: string,
  charityId: string,
  percentage: number
) {
  const { data: existing } = await supabase
    .from('user_charity')
    .select('id')
    .eq('user_id', userId);

  let result;

  if (existing && existing.length > 0) {
    result = await supabaseAny
      .from('user_charity')
      .update({
        charity_id: charityId,
        contribution_percentage: percentage,
      })
      .eq('user_id', userId)
      .select('*, charities(*)')
      .single();
  } else {
    result = await supabaseAny
      .from('user_charity')
      .insert([
        {
          user_id: userId,
          charity_id: charityId,
          contribution_percentage: percentage,
        },
      ])
      .select('*, charities(*)')
      .single();
  }

  if (result.error) {
    console.error(result.error);
    return { error: result.error.message };
  }

  return { data: result.data };
}
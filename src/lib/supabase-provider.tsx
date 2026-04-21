'use client';

import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

interface SupabaseProviderProps {
  children: ReactNode;
}

type AppSupabaseClient = ReturnType<typeof createClientComponentClient<Database>>;

const SupabaseContext = createContext<AppSupabaseClient | null>(null);

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = useMemo(
    () =>
      createClientComponentClient<Database>({
        supabaseUrl,
        supabaseKey: supabaseAnonKey,
      }),
    [supabaseAnonKey, supabaseUrl]
  );

  return <SupabaseContext.Provider value={supabase}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  const supabase = useContext(SupabaseContext);

  if (!supabase) {
    throw new Error('useSupabase must be used within SupabaseProvider');
  }

  return supabase;
}

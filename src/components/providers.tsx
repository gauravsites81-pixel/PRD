'use client';

import React, { ReactNode } from 'react';
import { SupabaseProvider } from '@/lib/supabase-provider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <SupabaseProvider>{children}</SupabaseProvider>;
}

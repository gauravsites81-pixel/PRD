export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'subscriber' | 'admin';
export type SubscriptionPlan = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'lapsed';
export type DrawStatus = 'draft' | 'simulated' | 'published';
export type DrawType = 'random' | 'algorithmic';
export type MatchType = 3 | 4 | 5;
export type PaymentStatus = 'pending' | 'paid';
export type WinnerProofStatus = 'pending' | 'approved' | 'rejected';

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: SubscriptionPlan | null;
          status: SubscriptionStatus | null;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: SubscriptionPlan | null;
          status?: SubscriptionStatus | null;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          current_period_end?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: SubscriptionPlan | null;
          status?: SubscriptionStatus | null;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          current_period_end?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      golf_scores: {
        Row: {
          id: string;
          user_id: string;
          score: number | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          score?: number | null;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          score?: number | null;
          date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      charities: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          events: Json;
          is_featured: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          events?: Json;
          is_featured?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          events?: Json;
          is_featured?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      user_charity: {
        Row: {
          id: string;
          user_id: string;
          charity_id: string;
          contribution_percentage: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          charity_id: string;
          contribution_percentage?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          charity_id?: string;
          contribution_percentage?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      draws: {
        Row: {
          id: string;
          month: number;
          year: number;
          status: DrawStatus;
          draw_type: DrawType;
          drawn_numbers: number[];
          jackpot_carried_over: boolean;
          carried_over_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          month: number;
          year: number;
          status: DrawStatus;
          draw_type: DrawType;
          drawn_numbers: number[];
          jackpot_carried_over?: boolean;
          carried_over_amount?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          month?: number;
          year?: number;
          status?: DrawStatus;
          draw_type?: DrawType;
          drawn_numbers?: number[];
          jackpot_carried_over?: boolean;
          carried_over_amount?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      draw_results: {
        Row: {
          id: string;
          draw_id: string;
          match_type: MatchType;
          winner_user_id: string;
          prize_amount: number;
          payment_status: PaymentStatus;
          proof_url: string;
          verification_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          draw_id: string;
          match_type: MatchType;
          winner_user_id: string;
          prize_amount: number;
          payment_status?: PaymentStatus;
          proof_url?: string;
          verification_status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          draw_id?: string;
          match_type?: MatchType;
          winner_user_id?: string;
          prize_amount?: number;
          payment_status?: PaymentStatus;
          proof_url?: string;
          verification_status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      winner_proofs: {
        Row: {
          id: string;
          draw_result_id: string;
          user_id: string;
          proof_url: string;
          admin_status: WinnerProofStatus;
          admin_notes: string | null;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          draw_result_id: string;
          user_id: string;
          proof_url: string;
          admin_status?: WinnerProofStatus;
          admin_notes?: string | null;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          draw_result_id?: string;
          user_id?: string;
          proof_url?: string;
          admin_status?: WinnerProofStatus;
          admin_notes?: string | null;
          submitted_at?: string;
        };
        Relationships: [];
      };
      prize_pool_config: {
        Row: {
          id: string;
          draw_id: string;
          total_pool: number;
          five_match_pool: number;
          four_match_pool: number;
          three_match_pool: number;
          active_subscriber_count: number | null;
          calculated_at: string;
        };
        Insert: {
          id?: string;
          draw_id: string;
          total_pool: number;
          five_match_pool: number;
          four_match_pool: number;
          three_match_pool: number;
          active_subscriber_count?: number | null;
          calculated_at?: string;
        };
        Update: {
          id?: string;
          draw_id?: string;
          total_pool?: number;
          five_match_pool?: number;
          four_match_pool?: number;
          three_match_pool?: number;
          active_subscriber_count?: number | null;
          calculated_at?: string;
        };
        Relationships: [];
      };
      prize_pools: {
        Row: {
          id: string;
          draw_id: string;
          total_pool: number;
          match_5_pool: number;
          match_4_pool: number;
          match_3_pool: number;
          rollover_amount: number;
          active_subscriber_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          draw_id: string;
          total_pool: number;
          match_5_pool: number;
          match_4_pool: number;
          match_3_pool: number;
          rollover_amount?: number;
          active_subscriber_count: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          draw_id?: string;
          total_pool?: number;
          match_5_pool?: number;
          match_4_pool?: number;
          match_3_pool?: number;
          rollover_amount?: number;
          active_subscriber_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: {
          check_user_id: string;
        };
        Returns: boolean;
      };
      trim_golf_scores_to_latest_five: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type User = Tables<'users'>;
export type Subscription = Tables<'subscriptions'>;
export type GolfScore = Tables<'golf_scores'>;
export type Charity = Tables<'charities'>;
export type UserCharity = Tables<'user_charity'>;
export type Draw = Tables<'draws'>;
export type DrawResult = Tables<'draw_results'>;
export type WinnerProof = Tables<'winner_proofs'>;
export type PrizePoolConfig = Tables<'prize_pool_config'>;
export type PrizePool = Tables<'prize_pools'>;

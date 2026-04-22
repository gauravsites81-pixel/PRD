import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin');
  }

  // DEBUG: Log user info for debugging
  console.log('Admin Layout - User:', { 
    id: user.id, 
    email: user.email, 
    emailLower: user.email?.toLowerCase() 
  });

  // Force allow admin email explicitly
  if (user.email === 'gauravsites81@gmail.com' || user.email?.toLowerCase() === 'gauravsites81@gmail.com') {
    console.log('Admin access granted via email fallback');
    // Continue to admin interface
  } else {
    // For non-admin emails, check database role
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const profile = data as { role: string } | null;

    console.log('Admin Layout - Profile:', { profile, error });

    // If user doesn't exist in users table or is not admin, redirect to dashboard
    if (error || !profile || profile.role !== 'admin') {
      console.log('Admin access denied - redirecting to dashboard');
      redirect('/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Admin header */}
      <header className="bg-slate-900 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">GolfHeroes Admin</h1>
          <nav className="flex gap-4">
            <a href="/dashboard" className="text-sm hover:text-emerald-400">Return to App</a>
          </nav>
        </div>
      </header>

      {/* Admin main content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
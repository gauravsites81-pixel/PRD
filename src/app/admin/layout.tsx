import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin');
  }

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const profile = data as { role: string } | null;

  if (profile?.role !== 'admin') {
    // If not admin, explicitly kick them out.
    redirect('/');
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
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListTodo, LineChart, LogOut, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { checkAuth } from '../../services/api';
import { useEffect } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const { data, error, isError } = useQuery({ queryKey: ['auth'], queryFn: checkAuth, retry: false });

  useEffect(() => {
    if (isError) navigate('/login');
  }, [isError, navigate]);

  if (!data && !error) return null; // Simple loader or white screen while checking

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    navigate('/login');
  };

  return (
    <div className="flex h-[100dvh] bg-app-bg text-app-text-p flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-app-border bg-app-surface backdrop-blur-md flex-col items-center py-8">
        <div className="flex items-center gap-2 mb-12">
            <Activity className="w-8 h-8 text-app-accent" />
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">FitBeat</h1>
        </div>
        <nav className="flex flex-col gap-2 w-full px-4">
          <NavLink to="/" end className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-app-accent/10 text-app-accent font-medium' : 'text-app-text-s hover:text-white hover:bg-app-glass'}`}>
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </NavLink>
          <NavLink to="/routines" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-app-accent/10 text-app-accent font-medium' : 'text-app-text-s hover:text-white hover:bg-app-glass'}`}>
            <ListTodo className="w-5 h-5" />
            Routines
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-app-accent/10 text-app-accent font-medium' : 'text-app-text-s hover:text-white hover:bg-app-glass'}`}>
            <LineChart className="w-5 h-5" />
            Analytics
          </NavLink>
        </nav>
        <div className="mt-auto w-full px-4">
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-app-text-s hover:text-rose-400 hover:bg-rose-500/10 w-full transition-colors">
                <LogOut className="w-5 h-5" />
                Logout
            </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pb-28 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-app-border bg-app-surface/90 backdrop-blur-md flex justify-around items-center px-2 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] z-50">
        <NavLink to="/" end className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 w-16 ${isActive ? 'text-app-accent' : 'text-app-text-s'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] uppercase font-mono tracking-wider">Home</span>
        </NavLink>
        <NavLink to="/routines" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 w-16 ${isActive ? 'text-app-accent' : 'text-app-text-s'}`}>
          <ListTodo className="w-5 h-5" />
          <span className="text-[10px] uppercase font-mono tracking-wider">Routines</span>
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 w-16 ${isActive ? 'text-app-accent' : 'text-app-text-s'}`}>
          <LineChart className="w-5 h-5" />
          <span className="text-[10px] uppercase font-mono tracking-wider">Data</span>
        </NavLink>
        <button onClick={handleLogout} className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 w-16 text-app-text-s hover:text-rose-400">
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] uppercase font-mono tracking-wider">Logout</span>
        </button>
      </nav>
    </div>
  );
}

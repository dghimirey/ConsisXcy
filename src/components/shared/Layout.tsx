import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListTodo, LogOut, Activity, ChevronLeft, ChevronRight, Timer as TimerIcon, Watch } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { checkAuth } from '../../services/api';
import { useEffect, useState } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
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
      <aside className={`relative hidden md:flex ${isCollapsed ? 'w-[88px]' : 'w-64'} transition-all duration-300 ease-in-out border-r border-app-border bg-app-surface backdrop-blur-md flex-col items-center py-8 z-10`}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-9 flex items-center justify-center w-6 h-6 bg-app-surface border border-app-border rounded-full text-app-text-s hover:text-white hover:bg-app-glass transition-colors z-20 cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4 ml-0.5" /> : <ChevronLeft className="w-4 h-4 mr-0.5" />}
        </button>
        <div className={`flex items-center gap-2 mb-12 w-full h-8 overflow-hidden whitespace-nowrap pl-6`}>
            <Activity className="w-8 h-8 text-app-accent shrink-0" />
            <h1 className={`font-display text-2xl font-bold tracking-tight text-white transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>ConsisXcy</h1>
        </div>
        <nav className={`flex flex-col gap-2 w-full px-4`}>
          <NavLink to="/" end className={({ isActive }) => `flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} w-full py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-app-accent/10 text-app-accent font-medium' : 'text-app-text-s hover:text-app-text-p hover:bg-app-glass'}`} title="Dashboard">
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
          </NavLink>
          <NavLink to="/routines" className={({ isActive }) => `flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} w-full py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-app-accent/10 text-app-accent font-medium' : 'text-app-text-s hover:text-app-text-p hover:bg-app-glass'}`} title="Routines">
            <ListTodo className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Routines</span>}
          </NavLink>
          <NavLink to="/time" className={({ isActive }) => `flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} w-full py-3 rounded-xl transition-all duration-200 ${isActive || location.pathname.startsWith('/time') ? 'bg-app-accent/10 text-app-accent font-medium' : 'text-app-text-s hover:text-app-text-p hover:bg-app-glass'}`} title="Time">
            <TimerIcon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Time</span>}
          </NavLink>

        </nav>
        <div className={`mt-auto w-full px-4 flex flex-col gap-2`}>
            <button onClick={handleLogout} className={`flex items-center ${isCollapsed ? 'justify-center px-0 cursor-pointer' : 'gap-3 px-4 cursor-pointer'} w-full py-3 rounded-xl text-app-text-s hover:text-rose-400 hover:bg-rose-500/10 transition-colors`} title="Logout">
                <LogOut className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>Logout</span>}
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
        <NavLink to="/time" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 w-16 ${isActive || location.pathname.startsWith('/time') ? 'text-app-accent' : 'text-app-text-s'}`}>
          <TimerIcon className="w-5 h-5" />
          <span className="text-[10px] uppercase font-mono tracking-wider">Time</span>
        </NavLink>

      </nav>
    </div>
  );
}

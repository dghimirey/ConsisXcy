import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Activity } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['auth'] });
        navigate('/');
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
                <Activity className="w-10 h-10 text-app-accent" />
                <h1 className="font-display text-4xl font-bold text-white tracking-tight">FitBeat</h1>
            </div>
        </div>
        <div className="bg-app-surface p-8 rounded-[16px] border border-app-border backdrop-blur-xl">
          <h2 className="text-xl font-medium text-white mb-6 font-display text-center">Sign In</h2>
          {error && <p className="text-rose-400 text-sm mb-4 text-center">{error}</p>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-mono text-app-text-s mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded-[12px] px-4 py-3 text-white placeholder:text-app-text-s focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent transition-all font-mono text-sm"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-app-text-s mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded-[12px] px-4 py-3 text-white placeholder:text-app-text-s focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent transition-all font-mono text-sm"
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="mt-4 w-full bg-app-accent hover:opacity-90 text-app-bg font-medium py-3 rounded-[12px] transition-all active:scale-[0.98]">
              Continue
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useFocusSessionStore } from '../../store/useFocusSessionStore';
import { Play, Pause, Square, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

function formatTime(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatDurationMin(ms: number) {
    return Math.round(ms / 60000) + ' min';
}

export function FocusSessionsTab() {
  const {
    sessions,
    activeSessionId,
    isRunning,
    addSession,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    deleteSession,
    getRemaining,
    getActiveSession
  } = useFocusSessionStore();

  const [remaining, setRemaining] = useState(getRemaining());
  const requestRef = useRef<number>();
  
  // New session modal
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [durationMin, setDurationMin] = useState(25);

  const activeSession = getActiveSession();

  const update = () => {
    const currentRemaining = getRemaining();
    setRemaining(currentRemaining);
    
    if (isRunning && currentRemaining <= 0) {
      stopSession(true); // completed
    }

    if (isRunning && currentRemaining > 0) {
      requestRef.current = requestAnimationFrame(update);
    }
  };

  useEffect(() => {
    if (!isRunning) {
        setRemaining(getRemaining());
    }
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, getRemaining, activeSessionId]);


  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || durationMin <= 0) return;
    addSession(title, durationMin * 60000, subject);
    setTitle('');
    setSubject('');
    setDurationMin(25);
    setShowNew(false);
  };

  // Group by date
  const grouped = sessions.reduce((acc, s) => {
      const date = new Date(s.date).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(s);
      return acc;
  }, {} as Record<string, typeof sessions>);

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Active Session Card */}
      {activeSession && (
        <div className="p-6 md:p-8 bg-app-glass border border-app-accent/30 rounded-3xl relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.05)]">
            <div className="absolute top-0 flex w-full h-1 bg-app-surface left-0">
                <div 
                   className="h-full bg-app-accent transition-all duration-300 ease-linear"
                   style={{ width: `${100 - (remaining / activeSession.duration) * 100}%` }}
                ></div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                   <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-app-accent animate-pulse"></span>
                      <span className="text-xs uppercase tracking-wider text-app-accent font-mono font-semibold">Active Session</span>
                   </div>
                   <h3 className="text-3xl font-bold text-white mb-1">{activeSession.title}</h3>
                   {activeSession.subject && <p className="text-app-text-s">{activeSession.subject}</p>}
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="text-4xl font-mono font-bold text-white tracking-tight tabular-nums w-48 text-right">
                        {formatTime(remaining)}
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {!isRunning ? (
                            <button onClick={resumeSession} className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30">
                                <Play className="w-5 h-5 ml-1" />
                            </button>
                        ) : (
                            <button onClick={pauseSession} className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center hover:bg-amber-500/30">
                                <Pause className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={() => stopSession(false)} className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500/30">
                            <Square className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex items-center justify-between mt-4">
          <h3 className="text-xl font-medium text-white">History & Planner</h3>
          <button 
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2 bg-app-surface border border-app-border rounded-xl text-sm font-medium text-app-text-p hover:text-white hover:border-app-text-s/50 transition-colors"
          >
              <Plus className="w-4 h-4" />
              New Session
          </button>
      </div>

      {showNew && (
          <form onSubmit={handleAdd} className="bg-app-glass border border-app-border rounded-[20px] p-6 flex flex-col gap-4">
              <h4 className="text-zinc-200 font-medium">Create Focus Session</h4>
              <div className="flex flex-col md:flex-row gap-4">
                  <input autoFocus required type="text" placeholder="Session goal / title..." value={title} onChange={e=>setTitle(e.target.value)} className="flex-1 bg-app-surface border border-app-border rounded-xl px-4 py-3 text-white outline-none focus:border-app-accent" />
                  <input type="text" placeholder="Subject / Project (opt)" value={subject} onChange={e=>setSubject(e.target.value)} className="flex-1 bg-app-surface border border-app-border rounded-xl px-4 py-3 text-white outline-none focus:border-app-accent" />
                  <select value={durationMin} onChange={e=>setDurationMin(Number(e.target.value))} className="bg-app-surface border border-app-border rounded-xl px-4 py-3 text-white outline-none focus:border-app-accent appearance-none">
                     <option value={15}>15 Minutes</option>
                     <option value={25}>25 Minutes</option>
                     <option value={45}>45 Minutes</option>
                     <option value={60}>1 Hour</option>
                     <option value={90}>90 Minutes</option>
                     <option value={120}>2 Hours</option>
                  </select>
                  <button type="submit" className="px-6 py-3 bg-app-accent text-zinc-900 font-bold rounded-xl hover:opacity-90">Start</button>
                  <button type="button" onClick={() => setShowNew(false)} className="px-4 py-3 text-app-text-s hover:text-white">Cancel</button>
              </div>
          </form>
      )}

      {/* Sessions List */}
      <div className="flex flex-col gap-8">
          {Object.keys(grouped).length === 0 && !showNew && (
              <div className="text-center py-12 text-app-text-s font-mono text-sm">
                  No sessions recorded yet. Start focusing!
              </div>
          )}
          {Object.entries(grouped).map(([date, daySessions]) => (
              <div key={date} className="flex flex-col gap-3">
                  <div className="text-xs font-mono text-app-text-s uppercase tracking-wider mb-2">{date}</div>
                  {daySessions.map(session => (
                      <div key={session.id} className="flex items-center justify-between p-4 bg-app-surface/50 border border-app-border rounded-2xl group">
                          <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${session.completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-app-surface border border-app-border text-app-text-s'}`}>
                                  {session.completed ? <CheckCircle2 className="w-5 h-5"/> : <Square className="w-4 h-4"/>}
                              </div>
                              <div className="flex flex-col">
                                  <span className={`font-medium ${session.completed ? 'text-zinc-300 line-through opacity-70' : 'text-zinc-100'}`}>{session.title}</span>
                                  {session.subject && <span className="text-xs text-app-text-s">{session.subject}</span>}
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                              <span className="text-sm font-mono text-app-text-p">{formatDurationMin(session.duration)}</span>
                              
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!session.completed && activeSessionId !== session.id && (
                                     <button onClick={() => startSession(session.id)} className="p-2 text-app-text-s hover:text-app-accent" title="Start Session">
                                         <Play className="w-4 h-4" />
                                     </button>
                                  )}
                                  <button onClick={() => deleteSession(session.id)} className="p-2 text-app-text-s hover:text-rose-400" title="Delete">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          ))}
      </div>

    </div>
  );
}

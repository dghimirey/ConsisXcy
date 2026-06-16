import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToCelebrations } from '../../lib/celebrations';

export function StreakMilestoneModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToCelebrations((event) => {
      if (event.type === 'MILESTONE' && event.streak && [7, 30, 100].includes(event.streak)) {
        setStreak(event.streak);
        setMessage(event.message);
        setIsOpen(true);
      }
    });
    return () => { unsubscribe(); };
  }, []);

  const getMilestoneTheme = (days: number) => {
    if (days >= 100) return { icon: '💯', color: 'from-fuchsia-500 to-rose-500', bg: 'bg-black/90 text-white', effect: 'shadow-fuchsia-500/50' };
    if (days >= 30) return { icon: '👑', color: 'from-violet-500 to-fuchsia-500', bg: 'bg-black/90 text-white', effect: 'shadow-violet-500/50' };
    if (days >= 7) return { icon: '🌟', color: 'from-amber-400 to-orange-500', bg: 'bg-black/90 text-white', effect: 'shadow-amber-500/50' };
    return { icon: '🔥', color: 'from-emerald-400 to-teal-500', bg: 'bg-black/90 text-white', effect: 'shadow-emerald-500/50' };
  };

  const theme = getMilestoneTheme(streak);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-sm rounded-[32px] p-[1px] bg-gradient-to-br ${theme.color} shadow-[0_0_80px_rgba(0,0,0,0.5)] ${theme.effect}`}
          >
            <div className={`w-full rounded-[31px] p-8 flex flex-col items-center text-center ${theme.bg}`}>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="text-7xl mb-6 shadow-black/50 drop-shadow-2xl"
              >
                {theme.icon}
              </motion.div>
              
              <h2 className="text-3xl font-display font-bold tracking-tight mb-2">
                {streak} Days
              </h2>
              
              <p className="text-app-text-s/80 text-sm mb-8 leading-relaxed max-w-[240px]">
                {message.split('\n')[1] || message}
              </p>
              
              <button
                onClick={() => setIsOpen(false)}
                className={`w-full py-4 px-6 rounded-full font-bold tracking-wide text-sm active:scale-95 transition-all bg-gradient-to-r ${theme.color} text-white shadow-lg`}
              >
                Incredible
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

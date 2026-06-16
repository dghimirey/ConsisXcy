import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToCelebrations } from '../lib/celebrations';

export function CelebrationOverlay() {
    const [messages, setMessages] = useState<{ id: number, type: string, message: string }[]>([]);

    useEffect(() => {
        const unsubscribe = subscribeToCelebrations((event) => {
            if (event.type === 'MILESTONE' && event.streak && [7, 30, 100].includes(event.streak)) return;
            const id = Date.now() + Math.random();
            setMessages(prev => [...prev, { id, ...event }]);
            
            // Remove after 4s
            setTimeout(() => {
                setMessages(prev => prev.filter(m => m.id !== id));
            }, 4000);
        });

        return () => { unsubscribe(); };
    }, []);

    return (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-4 pointer-events-none">
            <AnimatePresence>
                {messages.map((m) => (
                    <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        transition={{ type: "spring", bounce: 0.4 }}
                        className="bg-black/80 backdrop-blur-md border border-white/10 px-6 py-4 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.15)] flex flex-col items-center text-center max-w-sm"
                    >
                        {m.message.split('\n').map((line, i) => (
                            <span key={i} className={`${i === 0 ? 'text-lg font-display font-medium text-white mb-1 tracking-tight' : 'text-sm text-app-text-s'}`}>
                                {line}
                            </span>
                        ))}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

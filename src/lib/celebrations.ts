import confetti from 'canvas-confetti';
import { audioSystem } from './audio';

type CelebrationType = 'DAY_COMPLETED' | 'PERFECT_WEEK' | 'MILESTONE' | 'PERSONAL_BEST';

type CelebrationEvent = {
    type: CelebrationType;
    message: string;
};

type Listener = (event: CelebrationEvent) => void;
const listeners = new Set<Listener>();

export const subscribeToCelebrations = (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const notify = (event: CelebrationEvent) => {
    listeners.forEach(l => l(event));
};

// 1. Routine Completion Celebration
export const triggerRoutineCompletion = (el?: HTMLElement) => {
  audioSystem.playRoutineCompletion();
  setTimeout(() => audioSystem.playConfetti(), 50);
  
  let origin = { x: 0.5, y: 0.5 };
  if (el) {
     const rect = el.getBoundingClientRect();
     origin = {
         x: (rect.left + rect.width / 2) / window.innerWidth,
         y: (rect.top + rect.height / 2) / window.innerHeight
     };
  }

  confetti({
    particleCount: 50,
    spread: 60,
    origin,
    colors: ['#22C55E', '#84CC16', '#EAB308', '#FFFFFF'], // Emerald, Lime, Gold, White
    disableForReducedMotion: true,
    zIndex: 100,
    gravity: 1.2,
    scalar: 0.8,
    ticks: 150
  });
};

// 2. Daily Completion Celebration
export const triggerDailyCompletion = () => {
    audioSystem.playDailyCompletion();
    setTimeout(() => audioSystem.playConfetti(), 300); // Overlay confetti slightly after Arpeggio

    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.8 },
            colors: ['#22C55E', '#16A34A', '#FDE047', '#FFFFFF'],
            zIndex: 1000
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.8 },
            colors: ['#22C55E', '#16A34A', '#FDE047', '#FFFFFF'],
            zIndex: 1000
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    };
    frame();
    notify({ type: 'DAY_COMPLETED', message: '✅ All Routines Finished' });
};

export const triggerPerfectWeek = () => {
    audioSystem.playPerfectDay();
    setTimeout(() => audioSystem.playConfetti(), 150); // Play confetti pop slightly after
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
        confetti({
            particleCount: 8,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.8 },
            colors: ['#FDE047', '#EAB308', '#CA8A04', '#FFFFFF'],
            zIndex: 1000
        });
        confetti({
            particleCount: 8,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.8 },
            colors: ['#FDE047', '#EAB308', '#CA8A04', '#FFFFFF'],
            zIndex: 1000
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    };
    frame();
    notify({ type: 'PERFECT_WEEK', message: '🌟 Perfect Week' });
};

export const triggerMilestone = (streak: number) => {
    if (streak >= 100) audioSystem.play100DayStreak();
    else if (streak >= 30) audioSystem.play30DayStreak();
    else if (streak >= 7) audioSystem.play7DayStreak();
    else audioSystem.playStreakMaintained();
    
    audioSystem.playConfetti();
    
    confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#22C55E', '#EAB308', '#EC4899', '#3B82F6', '#FFFFFF'],
        zIndex: 1000,
        gravity: 0.8,
        scalar: 1.2,
    });
    
    let msg = "You're building something extraordinary.";
    if (streak === 7) msg = "One full week of consistency.";
    else if (streak >= 30 && streak < 100) msg = "An entire month. Keep going.";
    else if (streak >= 100) msg = "A massive milestone. Legendary consistency.";

    notify({ type: 'MILESTONE', message: `🔥 ${streak} Day Streak\n${msg}` });
};

export const triggerPersonalBest = () => {
    audioSystem.playPersonalBest();
    audioSystem.playConfetti();
    
    confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#FDE047', '#EAB308', '#CA8A04', '#FEF08A'],
        zIndex: 1000,
        gravity: 1,
        scalar: 1.1,
    });
    notify({ type: 'PERSONAL_BEST', message: '🏆 New Personal Best' });
};

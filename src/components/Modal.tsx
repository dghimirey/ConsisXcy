import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm py-20">
          <div className="bg-app-surface w-full max-w-lg rounded-[20px] border border-app-border flex flex-col max-h-full overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-app-border/50 shrink-0 bg-app-glass">
              <h2 className="text-lg font-medium text-white">{title}</h2>
              <button onClick={onClose} className="text-app-text-s hover:text-white p-2 transition-colors rounded-lg hover:bg-app-bg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {children}
            </div>
            {footer && (
              <div className="p-5 border-t border-app-border/50 flex justify-end gap-3 shrink-0 bg-app-glass">
                {footer}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

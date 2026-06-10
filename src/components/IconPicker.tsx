import React, { useState, useRef, useEffect } from 'react';
import { AVAILABLE_ICONS, getIcon } from '../lib/icons';
import { ChevronDown } from 'lucide-react';

export function IconPicker({ value, onChange }: { value?: string | null, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const CurrentIcon = getIcon(value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between rounded-xl bg-app-bg border border-app-border p-3.5 text-left text-white items-center gap-2 hover:border-app-text-s/70 transition-colors"
      >
        <div className="flex flex-row items-center gap-3">
            <CurrentIcon className="w-5 h-5" />
            <span className="text-sm font-mono truncate">{value || 'Target / Circle'}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-app-text-s" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 w-[280px] max-w-[80vw] mt-2 bg-app-surface border border-app-border rounded-xl shadow-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex flex-col max-h-[300px]">
          <div className="p-2 overflow-y-auto grid grid-cols-5 sm:grid-cols-6 gap-1">
             {AVAILABLE_ICONS.map(iconName => {
                const IconComponent = getIcon(iconName);
                const isSelected = value === iconName;
                return (
                  <button
                    key={iconName}
                    onClick={() => { onChange(iconName); setIsOpen(false); }}
                    className={`aspect-square flex items-center justify-center rounded-lg hover:bg-app-glass transition-colors ${isSelected ? 'bg-app-accent text-white' : 'text-app-text-s hover:text-white'}`}
                    title={iconName}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                )
             })}
          </div>
        </div>
      )}
    </div>
  )
}

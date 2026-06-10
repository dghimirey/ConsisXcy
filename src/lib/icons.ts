import * as icons from 'lucide-react';
import React from 'react';

export type IconName = keyof typeof icons;

export const AVAILABLE_ICONS: IconName[] = [
  'Activity', 'AlarmClock', 'ArrowUp', 'Book', 'BookOpen', 'Briefcase', 'Calendar', 
  'Camera', 'Check', 'CheckCircle', 'CheckSquare', 'ChevronDown', 'ChevronRight', 
  'ChevronsRight', 'Circle', 'Clock', 'Code', 'Coffee', 'Crosshair', 'Dumbbell', 
  'Edit2', 'Eye', 'FileText', 'Flame', 'Flag', 'Folder', 'Footprints', 'Globe', 
  'Heart', 'Home', 'Image', 'Layers', 'Layout', 'List', 'Map', 'MessageCircle', 
  'MessageSquare', 'Mic', 'Monitor', 'Moon', 'Music', 'PenTool', 'Phone', 'Play', 
  'Plus', 'Radio', 'RotateCcw', 'Search', 'Settings', 'Settings2', 'Shield', 
  'ShoppingBag', 'ShoppingCart', 'Smartphone', 'Smile', 'Speaker', 'Star', 'Sun', 
  'Sunrise', 'Sunset', 'Target', 'Terminal', 'ThumbsUp', 'Timer', 'Trash2', 'TrendingUp', 
  'Trophy', 'Tv', 'User', 'Users', 'Video', 'Volume2', 'Watch', 'Wifi', 'Zap'
];

export function getIcon(name: string | null | undefined): React.ElementType {
  if (!name || !(name in icons)) return icons.Circle as React.ElementType;
  return icons[name as IconName] as React.ElementType;
}

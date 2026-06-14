import * as icons from 'lucide-react';
import React from 'react';

export type IconName = keyof typeof icons;

export const AVAILABLE_ICONS: IconName[] = [
  'Activity', 'AlarmClock', 'AlertCircle', 'AlertTriangle', 'Apple', 'ArrowUp', 
  'Ban', 'Banknote', 'BatteryCharging', 'Bed', 'BedDouble', 'Beer', 'Bell', 'Bike', 'Bitcoin', 'Book', 'BookOpen', 'Brain', 'Briefcase', 'Brush', 'Bus', 
  'Calculator', 'Calendar', 'Camera', 'Car', 'Carrot', 'Check', 'CheckCircle', 'CheckSquare', 'ChefHat', 'ChevronDown', 'ChevronRight', 'ChevronsRight', 'Cigarette', 'Circle', 'CircleOff', 'Clapperboard', 'Clock', 'Cloud', 'CloudLightning', 'CloudMoon', 'CloudRain', 'CloudSun', 'Code', 'Code2', 'Coffee', 'Coins', 'Cookie', 'CreditCard', 'Croissant', 'Crosshair', 
  'DollarSign', 'Droplet', 'Dumbbell', 
  'Edit2', 'Eye', 'EyeOff', 
  'Facebook', 'FileText', 'Fish', 'Flag', 'Flame', 'Flower', 'Flower2', 'Folder', 'Footprints', 
  'Gamepad', 'Gamepad2', 'Ghost', 'Gift', 'GlassWater', 'Globe', 'GraduationCap', 
  'Hammer', 'Headphones', 'Heart', 'HeartPulse', 'Home', 
  'Image', 'Instagram', 
  'Key', 'Keyboard', 
  'Laptop', 'Layers', 'Layout', 'Leaf', 'Lightbulb', 'List', 'Lock', 
  'Mail', 'Map', 'Martini', 'MessageCircle', 'MessageSquare', 'Mic', 'MicOff', 'Microscope', 'Monitor', 'Moon', 'MoonStar', 'Mouse', 'Music', 
  'Palmtree', 'Palette', 'Pen', 'PenTool', 'Phone', 'PhoneOff', 'PiggyBank', 'Pill', 'Pizza', 'Plane', 'Play', 'Plus', 'Printer', 
  'Radio', 'RotateCcw', 
  'Salad', 'Sandwich', 'Scissors', 'Search', 'Settings', 'Settings2', 'Shield', 'ShieldAlert', 'Ship', 'ShoppingBag', 'ShoppingCart', 'Smartphone', 'Smile', 'Snowflake', 'Speaker', 'Sprout', 'Star', 'Stethoscope', 'Sun', 'Sunrise', 'Sunset', 'Syringe', 
  'Tablet', 'Target', 'Tent', 'Terminal', 'ThumbsDown', 'ThumbsUp', 'Ticket', 'Timer', 'Train', 'Trash', 'Trash2', 'TrendingDown', 'TrendingUp', 'Trophy', 'Tv', 'Twitter', 
  'Unlock', 'User', 'Users', 'Utensils', 'UtensilsCrossed', 
  'Video', 'VideoOff', 'Volume2', 'VolumeX', 
  'Wallet', 'Watch', 'Wifi', 'WifiOff', 'Wind', 'Wine', 'Wrench', 
  'X', 'XCircle', 'XSquare', 'Youtube', 'Zap'
];

export function getIcon(name: string | null | undefined): React.ElementType {
  if (!name || !(name in icons)) return icons.Circle as React.ElementType;
  return icons[name as IconName] as React.ElementType;
}

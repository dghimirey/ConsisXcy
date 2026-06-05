import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTarget(value: number): number {
  if (value === undefined || value === null || isNaN(value)) return 1;
  const num = Number(value);
  const integerPart = Math.floor(num);
  const decimalPart = num - integerPart;
  const rounded = decimalPart <= 0.50 ? integerPart : integerPart + 1;
  return Math.max(1, rounded);
}

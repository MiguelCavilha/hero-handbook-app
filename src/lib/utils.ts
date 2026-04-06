import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function randomArrayItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

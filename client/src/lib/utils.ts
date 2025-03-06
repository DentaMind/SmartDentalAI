import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date object or string to a readable date string
 * @param date - The date to format
 * @param formatStr - Optional format string (defaults to "MMM d, yyyy")
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, formatStr: string = "MMM d, yyyy"): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return "Invalid date";
  }
  
  return format(dateObj, formatStr);
}

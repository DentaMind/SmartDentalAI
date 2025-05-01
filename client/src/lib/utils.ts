import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from "date-fns"

/**
 * Merges class names with tailwind classes
 * @param inputs - Class names to merge
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

/**
 * Formats a currency value
 * @param amount - Amount to format
 * @param currency - Currency code
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Truncates text to a specified length
 * @param text - Text to truncate
 * @param length - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, length: number = 100): string {
  if (text.length <= length) return text
  
  return `${text.slice(0, length)}...`
}

/**
 * Safely access nested object properties
 * @param obj - Object to access
 * @param path - Path to property
 * @param defaultValue - Default value if property doesn't exist
 * @returns Property value or default value
 */
export function getNestedValue(obj: any, path: string, defaultValue: any = undefined): any {
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue
    }
    
    current = current[key]
  }
  
  return current !== undefined ? current : defaultValue
}

/**
 * Debounces a function call
 * @param fn - Function to debounce
 * @param delay - Delay in ms
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  
  return function(this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      fn.apply(this, args)
      timeoutId = null
    }, delay)
  }
}

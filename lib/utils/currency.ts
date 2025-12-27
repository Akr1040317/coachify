/**
 * Format cents to currency string
 * @param cents - Amount in cents
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string (e.g., "$100.00")
 */
export const formatCurrency = (cents: number, currency: string = "USD"): string => {
  if (cents === null || cents === undefined || isNaN(cents)) {
    return "$0.00";
  }
  
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Parse currency string to cents
 * @param value - Currency string or number
 * @returns Amount in cents
 */
export const parseCurrencyToCents = (value: string | number): number => {
  if (typeof value === "number") {
    return Math.round(value * 100);
  }
  
  // Remove currency symbols and spaces, then parse
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) {
    return 0;
  }
  
  return Math.round(parsed * 100);
};

/**
 * Format cents to display value (for input fields)
 * @param cents - Amount in cents
 * @returns Display value (e.g., "100.00")
 */
export const formatCentsForInput = (cents: number): string => {
  if (cents === null || cents === undefined || isNaN(cents)) {
    return "0.00";
  }
  
  return (cents / 100).toFixed(2);
};


/**
 * Validation utility functions for portfolio financial data
 */

/**
 * Check if text appears to be a currency value
 */
export function isCurrencyText(text: string): boolean {
  return text.includes('$') || !!text.match(/[\d,]+\.\d+/);
}

/**
 * Parse a text value that represents currency into a number
 */
export function parseCurrencyText(text: string): number {
  return parseFloat(text.replace(/[$,]/g, ""));
}

/**
 * Validate symbol format (ticker symbols are typically 1-5 uppercase letters/numbers)
 */
export function validateSymbol(symbol: string): string {
  if (!/^[A-Z0-9]{1,5}$/.test(symbol)) {
    throw new Error(`Invalid symbol format: ${symbol}`);
  }
  return symbol;
}

/**
 * Validate and parse price text
 */
export function validatePrice(priceText: string, symbol: string): number {
  if (!isCurrencyText(priceText)) {
    throw new Error(`Price text does not appear to be a currency value: "${priceText}" for ${symbol}`);
  }
  
  const price = parseCurrencyText(priceText);
  
  if (isNaN(price) || price < 10 || price > 1000) {
    throw new Error(`Price out of reasonable range: $${price} for ${symbol}`);
  }
  
  return price;
}

/**
 * Validate and parse market value text
 */
export function validateMarketValue(marketValueText: string, symbol: string): number {
  if (!isCurrencyText(marketValueText)) {
    throw new Error(`Market value text does not appear to be a currency value: "${marketValueText}" for ${symbol}`);
  }
  
  const marketValue = parseCurrencyText(marketValueText);
  
  if (isNaN(marketValue) || marketValue <= 0) {
    throw new Error(`Invalid market value: $${marketValue} for ${symbol}`);
  }
  
  return marketValue;
}

/**
 * Validate and parse account value text
 */
export function validateAccountValue(accountValueText: string): number {
  if (!isCurrencyText(accountValueText)) {
    throw new Error(`Account value text does not appear to be a currency value: "${accountValueText}"`);
  }
  
  const accountValue = parseCurrencyText(accountValueText);
  
  if (isNaN(accountValue) || accountValue <= 0) {
    throw new Error(`Invalid account value: $${accountValue}`);
  }
  
  if (accountValue > 10000000) { // $10M seems like a reasonable upper bound
    throw new Error(`Account value suspiciously large: $${accountValue}`);
  }
  
  return accountValue;
}

/**
 * Validate and parse cash available text
 */
export function validateCashAvailable(cashAvailableText: string, accountValue: number): number {
  if (!isCurrencyText(cashAvailableText)) {
    throw new Error(`Cash available text does not appear to be a currency value: "${cashAvailableText}"`);
  }
  
  const cashAvailable = parseCurrencyText(cashAvailableText);
  
  if (isNaN(cashAvailable) || cashAvailable < 0) {
    throw new Error(`Invalid cash available value: $${cashAvailable}`);
  }
  
  if (cashAvailable > accountValue) {
    throw new Error(`Cash available ($${cashAvailable}) exceeds account value ($${accountValue})`);
  }
  
  return cashAvailable;
} 
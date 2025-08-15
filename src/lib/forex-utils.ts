// Forex utility functions for currency pair detection and inversion

export interface ForexPairInfo {
  isForexPair: boolean;
  baseCurrency?: string;
  quoteCurrency?: string;
  format?: 'slash' | 'direct';
}

/**
 * Detect if a column name represents a forex pair
 * Supports formats: XXX/YYY (e.g., USD/EUR) and XXXYYY (e.g., USDEUR)
 */
export function detectForexPair(columnName: string): ForexPairInfo {
  // Pattern for XXX/YYY format
  const slashPattern = /^([A-Z]{3})\/([A-Z]{3})$/;
  // Pattern for XXXYYY format (6 characters)
  const directPattern = /^([A-Z]{3})([A-Z]{3})$/;
  
  const slashMatch = columnName.match(slashPattern);
  if (slashMatch) {
    return {
      isForexPair: true,
      baseCurrency: slashMatch[1],
      quoteCurrency: slashMatch[2],
      format: 'slash'
    };
  }
  
  const directMatch = columnName.match(directPattern);
  if (directMatch) {
    return {
      isForexPair: true,
      baseCurrency: directMatch[1],
      quoteCurrency: directMatch[2],
      format: 'direct'
    };
  }
  
  return { isForexPair: false };
}

/**
 * Invert a forex pair name
 * USD/MAD -> MAD/USD or USDMAD -> MADUSD
 */
export function invertForexPair(columnName: string): string {
  const pairInfo = detectForexPair(columnName);
  if (!pairInfo.isForexPair || !pairInfo.baseCurrency || !pairInfo.quoteCurrency) {
    return columnName;
  }
  
  if (pairInfo.format === 'slash') {
    return `${pairInfo.quoteCurrency}/${pairInfo.baseCurrency}`;
  } else {
    return `${pairInfo.quoteCurrency}${pairInfo.baseCurrency}`;
  }
}

/**
 * Invert forex data values (1/value for each row)
 */
export function invertForexData(
  data: Record<string, any>[], 
  columnName: string, 
  newColumnName?: string
): { data: Record<string, any>[]; newColumnName: string } {
  const finalNewColumnName = newColumnName || invertForexPair(columnName);
  
  const newData = data.map(row => {
    const newRow = { ...row };
    const value = parseFloat(row[columnName]);
    
    if (!isNaN(value) && value !== 0) {
      newRow[finalNewColumnName] = 1 / value;
    } else {
      newRow[finalNewColumnName] = null;
    }
    
    // Remove the old column if we're replacing it
    if (newColumnName === undefined) {
      delete newRow[columnName];
    }
    
    return newRow;
  });

  return { data: newData, newColumnName: finalNewColumnName };
}

/**
 * Get common forex pairs for validation/suggestions
 */
export function getCommonForexPairs(): string[] {
  return [
    'EUR/USD', 'USD/EUR',
    'GBP/USD', 'USD/GBP', 
    'USD/JPY', 'JPY/USD',
    'USD/CHF', 'CHF/USD',
    'AUD/USD', 'USD/AUD',
    'USD/CAD', 'CAD/USD',
    'NZD/USD', 'USD/NZD',
    'EUR/GBP', 'GBP/EUR',
    'EUR/JPY', 'JPY/EUR',
    'GBP/JPY', 'JPY/GBP',
    'USD/MAD', 'MAD/USD',
    'EUR/MAD', 'MAD/EUR'
  ];
}

/**
 * Validate if a string could be a valid forex pair
 */
export function isValidForexPair(pairName: string): boolean {
  const pairInfo = detectForexPair(pairName);
  return pairInfo.isForexPair && 
         pairInfo.baseCurrency !== pairInfo.quoteCurrency;
}

/**
 * Format forex pair name consistently
 */
export function formatForexPair(baseCurrency: string, quoteCurrency: string, format: 'slash' | 'direct' = 'slash'): string {
  const base = baseCurrency.toUpperCase();
  const quote = quoteCurrency.toUpperCase();
  
  if (format === 'slash') {
    return `${base}/${quote}`;
  } else {
    return `${base}${quote}`;
  }
}

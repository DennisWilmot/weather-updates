/**
 * Validation utilities for chat tool data
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string;
}

/**
 * Validates plot data
 */
export function validatePlotData(data: any, plotType?: string): ValidationResult {
  if (!data) {
    return {
      valid: false,
      error: 'Data is required',
      suggestion: 'Please provide data as an array of objects or array of arrays',
    };
  }

  if (!Array.isArray(data)) {
    return {
      valid: false,
      error: 'Data must be an array',
      suggestion: 'Convert your data to an array format',
    };
  }

  if (data.length === 0) {
    return {
      valid: false,
      error: 'Data array is empty',
      suggestion: 'Please provide data with at least one item',
    };
  }

  // Check if it's array of objects or array of arrays
  const isObjectArray = typeof data[0] === 'object' && !Array.isArray(data[0]);
  const isArrayArray = Array.isArray(data[0]);

  if (!isObjectArray && !isArrayArray) {
    return {
      valid: false,
      error: 'Data must be an array of objects or array of arrays',
      suggestion: 'Format your data as [{x: 1, y: 10}, ...] or [[1, 10], ...]',
    };
  }

  return { valid: true };
}

/**
 * Normalizes plot data by removing emojis and special characters
 */
export function normalizePlotData(data: any): any {
  if (!Array.isArray(data)) {
    return data;
  }

  if (data.length === 0) {
    return data;
  }

  // Check if it's array of objects
  if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
    return data.map((item) => {
      const normalized: any = {};
      for (const [key, value] of Object.entries(item)) {
        // Remove emojis from keys
        const normalizedKey = removeEmojis(String(key));
        // Remove emojis from string values
        const normalizedValue = typeof value === 'string' ? removeEmojis(value) : value;
        normalized[normalizedKey] = normalizedValue;
      }
      return normalized;
    });
  }

  // Array of arrays
  return data.map((row) => {
    if (Array.isArray(row)) {
      return row.map((cell) => (typeof cell === 'string' ? removeEmojis(cell) : cell));
    }
    return row;
  });
}

/**
 * Removes emojis from a string
 */
function removeEmojis(str: string): string {
  // Regex to match emojis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  return str.replace(emojiRegex, '').trim();
}

/**
 * Checks if data contains emojis
 */
export function hasEmojis(data: any): boolean {
  if (!data) return false;

  const checkString = (str: string): boolean => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    return emojiRegex.test(str);
  };

  if (Array.isArray(data)) {
    if (data.length === 0) return false;

    // Array of objects
    if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
      return data.some((item) => {
        return Object.values(item).some((value) => {
          return typeof value === 'string' && checkString(value);
        });
      });
    }

    // Array of arrays
    if (Array.isArray(data[0])) {
      return data.some((row) => {
        return Array.isArray(row) && row.some((cell) => typeof cell === 'string' && checkString(cell));
      });
    }
  }

  return false;
}

/**
 * Validates table data
 */
export function validateTableData(
  headers: string[],
  rows: (string | number)[][]
): ValidationResult {
  if (!headers || headers.length === 0) {
    return {
      valid: false,
      error: 'Table headers are required',
      suggestion: 'Provide at least one column header',
    };
  }

  if (!rows || rows.length === 0) {
    return {
      valid: false,
      error: 'Table rows are required',
      suggestion: 'Provide at least one row of data',
    };
  }

  const headerCount = headers.length;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row)) {
      return {
        valid: false,
        error: `Row ${i + 1} is not an array`,
        suggestion: 'Each row must be an array of cell values',
      };
    }

    if (row.length !== headerCount) {
      return {
        valid: false,
        error: `Row ${i + 1} has ${row.length} columns, but headers has ${headerCount} columns`,
        suggestion: `Ensure all rows have exactly ${headerCount} columns to match the headers`,
      };
    }
  }

  return { valid: true };
}


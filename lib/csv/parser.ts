import Papa from 'papaparse';

export interface ParseError {
  type: 'Quotes' | 'Delimiter' | 'FieldMismatch' | 'MissingQuotes';
  code: string;
  message: string;
  row?: number;
}

export interface ParsedCSV {
  headers: string[];
  rows: any[];
  errors: ParseError[];
}

export interface ParseValidationResult {
  valid: boolean;
  missingHeaders: string[];
  extraHeaders: string[];
}

/**
 * Parse a CSV file using PapaParse
 */
export async function parseCSV(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim(),
      complete: (results) => {
        resolve({
          headers: results.meta.fields || [],
          rows: results.data as any[],
          errors: results.errors.map((error) => ({
            type: error.type as ParseError['type'],
            code: error.code || '',
            message: error.message || '',
            row: error.row,
          })),
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

/**
 * Parse a CSV string using PapaParse
 */
export function parseCSVString(csvString: string): ParsedCSV {
  const results = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim(),
  });

  return {
    headers: results.meta.fields || [],
    rows: results.data as any[],
    errors: results.errors.map((error) => ({
      type: error.type as ParseError['type'],
      code: error.code || '',
      message: error.message || '',
      row: error.row,
    })),
  };
}

/**
 * Validate CSV headers against expected headers
 */
export function validateCSVHeaders(
  headers: string[],
  expectedHeaders: string[]
): ParseValidationResult {
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());
  const normalizedExpected = expectedHeaders.map((h) => h.toLowerCase().trim());

  const missingHeaders = normalizedExpected.filter(
    (expected) => !normalizedHeaders.includes(expected)
  );
  const extraHeaders = normalizedHeaders.filter(
    (header) => !normalizedExpected.includes(header)
  );

  return {
    valid: missingHeaders.length === 0,
    missingHeaders: expectedHeaders.filter((h) =>
      missingHeaders.includes(h.toLowerCase().trim())
    ),
    extraHeaders: headers.filter((h) =>
      extraHeaders.includes(h.toLowerCase().trim())
    ),
  };
}


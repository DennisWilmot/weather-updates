import { ZodSchema, ZodError } from 'zod';

export interface ValidationResult {
  rowIndex: number;
  valid: boolean;
  errors: string[];
  data?: any;
}

export type FieldMapping = Record<string, string>; // CSV column -> schema field

/**
 * Validate a single CSV row against a Zod schema
 */
export function validateCSVRow(
  row: any,
  schema: ZodSchema,
  rowIndex: number
): ValidationResult {
  try {
    const result = schema.safeParse(row);
    
    if (result.success) {
      return {
        rowIndex,
        valid: true,
        errors: [],
        data: result.data,
      };
    } else {
      return {
        rowIndex,
        valid: false,
        errors: result.error.issues.map((err) => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        }),
      };
    }
  } catch (error) {
    return {
      rowIndex,
      valid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Validate all CSV rows against a Zod schema
 */
export function validateCSVData(
  data: any[],
  schema: ZodSchema
): ValidationResult[] {
  return data.map((row, index) => validateCSVRow(row, schema, index));
}

/**
 * Map CSV row columns to schema fields using field mapping
 */
export function mapCSVRowToSchema(
  row: any,
  fieldMapping: FieldMapping
): any {
  const mappedRow: any = {};
  
  for (const [csvColumn, schemaField] of Object.entries(fieldMapping)) {
    if (row[csvColumn] !== undefined) {
      mappedRow[schemaField] = row[csvColumn];
    }
  }
  
  return mappedRow;
}

/**
 * Convert CSV string values to appropriate types based on schema
 */
export function convertCSVTypes(row: any, schema: ZodSchema): any {
  // This is a simplified type conversion
  // In practice, you might want more sophisticated type inference
  const converted: any = {};
  
  for (const [key, value] of Object.entries(row)) {
    if (value === '' || value === null || value === undefined) {
      converted[key] = undefined;
    } else if (typeof value === 'string') {
      // Try to convert to number if it looks like a number
      const numValue = Number(value);
      if (!isNaN(numValue) && value.trim() !== '') {
        converted[key] = numValue;
      } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
        converted[key] = value.toLowerCase() === 'true';
      } else {
        converted[key] = value;
      }
    } else {
      converted[key] = value;
    }
  }
  
  return converted;
}


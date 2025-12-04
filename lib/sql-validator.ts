/**
 * SQL Validator
 * 
 * Validates that SQL queries are read-only and safe to execute.
 * Only allows SELECT statements and blocks all write operations.
 */

// Dangerous SQL keywords that indicate write operations
const DANGEROUS_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'CREATE',
  'ALTER',
  'TRUNCATE',
  'REPLACE',
  'MERGE',
  'GRANT',
  'REVOKE',
  'EXEC',
  'EXECUTE',
  'CALL',
  'COPY',
  'IMPORT',
  'EXPORT',
];

// SQL functions that could be dangerous
const DANGEROUS_FUNCTIONS = [
  'pg_exec',
  'pg_read_file',
  'pg_write_file',
  'dblink',
  'lo_import',
  'lo_export',
];

/**
 * Validates that a SQL query is read-only and safe to execute
 * @param sql The SQL query to validate
 * @returns Object with valid flag and error message if invalid
 */
export function validateSQL(sql: string): {
  valid: boolean;
  error?: string;
} {
  if (!sql || typeof sql !== 'string') {
    return {
      valid: false,
      error: 'SQL query must be a non-empty string',
    };
  }

  // Normalize SQL: remove comments and extra whitespace
  const normalized = sql
    .replace(/--.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .trim()
    .toUpperCase();

  // Must start with SELECT
  if (!normalized.startsWith('SELECT')) {
    return {
      valid: false,
      error: 'Only SELECT queries are allowed. Query must start with SELECT',
    };
  }

  // Check for dangerous keywords (case-insensitive)
  for (const keyword of DANGEROUS_KEYWORDS) {
    // Use word boundary regex to avoid false positives
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(sql)) {
      return {
        valid: false,
        error: `Query contains forbidden keyword: ${keyword}. Only read-only SELECT queries are allowed.`,
      };
    }
  }

  // Check for dangerous functions
  for (const func of DANGEROUS_FUNCTIONS) {
    const regex = new RegExp(`\\b${func}\\b`, 'i');
    if (regex.test(sql)) {
      return {
        valid: false,
        error: `Query contains forbidden function: ${func}. This function is not allowed for security reasons.`,
      };
    }
  }

  // Check for semicolons that might indicate multiple statements
  const semicolonCount = (sql.match(/;/g) || []).length;
  if (semicolonCount > 1) {
    return {
      valid: false,
      error: 'Multiple SQL statements are not allowed. Please provide a single SELECT query.',
    };
  }

  // Check for UNION-based SQL injection patterns
  if (normalized.includes('UNION') && (normalized.includes('SELECT') && normalized.split('SELECT').length > 2)) {
    // Allow legitimate UNION queries but be cautious
    // Additional validation could be added here if needed
  }

  return {
    valid: true,
  };
}

/**
 * Sanitizes SQL query by removing potentially dangerous patterns
 * This is a secondary safety measure
 */
export function sanitizeSQL(sql: string): string {
  return sql
    .replace(/--.*$/gm, '') // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .trim();
}


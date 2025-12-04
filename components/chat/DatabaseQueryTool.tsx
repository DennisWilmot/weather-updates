'use client';

import { useMemo } from 'react';
import { TableTool } from './TableTool';

interface DatabaseQueryToolProps {
    toolCallId: string;
    args: any;
    result?: any;
}

export function DatabaseQueryTool({ toolCallId, args, result }: DatabaseQueryToolProps) {
    // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
    // Use result if available, otherwise use args
    const queryData = useMemo(() => {
        try {
            if (result) {
                if (result.type === 'error') {
                    return null;
                }
                return result;
            }
            return args;
        } catch (error) {
            console.error('Error processing query data:', error);
            return null;
        }
    }, [args, result]);

    // Safely extract data from queryData
    const data = queryData?.data;
    const rowCount = queryData?.rowCount;
    const columns = queryData?.columns;
    const description = queryData?.description;

    // Convert query result to table format - MUST be called before any conditional returns
    const tableData = useMemo(() => {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return {
                headers: columns || [],
                rows: [],
                title: description || 'Query Results',
            };
        }

        // Use columns from query result or extract from first row
        // Safely get headers - ensure data[0] exists and is an object
        let headers: string[] = [];
        if (columns && Array.isArray(columns) && columns.length > 0) {
            headers = columns;
        } else if (data[0] && typeof data[0] === 'object') {
            headers = Object.keys(data[0]);
        } else {
            headers = [];
        }

        // Convert data rows to table format
        const rows = data.map((row: any) => {
            if (!row || typeof row !== 'object') {
                // Return empty row if row is invalid
                return headers.map(() => '');
            }
            return headers.map((header: string) => {
                const value = row[header];
                // Convert null/undefined to empty string, format dates, etc.
                if (value === null || value === undefined) {
                    return '';
                }
                if (value instanceof Date) {
                    return value.toISOString();
                }
                if (typeof value === 'object') {
                    return JSON.stringify(value);
                }
                return String(value);
            });
        });

        return {
            headers,
            rows,
            title: description || `Query Results (${rowCount || (Array.isArray(data) ? data.length : 0)} rows)`,
        };
    }, [data, columns, rowCount, description]);

    // NOW we can do conditional returns (after all hooks)
    // Check for errors
    if (queryData?.type === 'error') {
        return (
            <div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">Database Query Error</p>
                <p className="text-sm text-red-700">{queryData.error}</p>
            </div>
        );
    }

    // Show loading state
    if (!queryData) {
        return (
            <div className="my-4 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                    <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Executing database query...</p>
                </div>
            </div>
        );
    }

    // Show loading state if data is not yet available
    if (!data) {
        return (
            <div className="my-4 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                    <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Executing database query...</p>
                </div>
            </div>
        );
    }

    // Render the table
    return (
        <div className="my-4">
            {description && (
                <div className="mb-2 rounded-lg border border-blue-200 bg-blue-50 p-2">
                    <p className="text-xs text-blue-800">
                        <strong>Query:</strong> {description}
                    </p>
                    {rowCount !== undefined && (
                        <p className="text-xs text-blue-700 mt-1">
                            Returned {rowCount} row{rowCount !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
            )}
            <TableTool
                toolCallId={toolCallId}
                args={tableData}
                result={tableData}
            />
        </div>
    );
}


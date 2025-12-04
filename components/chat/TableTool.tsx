'use client';

import { useMemo, useRef } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TableToolProps {
  toolCallId: string;
  args: any;
  result?: any;
}

export function TableTool({ toolCallId, args, result }: TableToolProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  // Use result if available, otherwise use args
  const tableData = useMemo(() => {
    if (result) {
      if (result.type === 'error') {
        return null;
      }
      return result;
    }
    return args;
  }, [args, result]);

  // Check for errors
  if (tableData?.type === 'error') {
    return (
      <div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-800">Error</p>
        <p className="text-sm text-red-700">{tableData.error}</p>
        {tableData.suggestion && (
          <p className="mt-2 text-xs text-red-600">{tableData.suggestion}</p>
        )}
      </div>
    );
  }

  // Show loading state
  if (!tableData || !tableData.headers || !tableData.rows) {
    return (
      <div className="my-4 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Generating table...</p>
        </div>
      </div>
    );
  }

  const { headers, rows, title } = tableData;

  const handleDownloadCSV = () => {
    // Convert table data to CSV
    const csvRows: string[] = [];
    
    // Add headers
    csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));
    
    // Add rows
    rows.forEach((row: (string | number)[]) => {
      csvRows.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = title ? `${title}.csv` : `table-${toolCallId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = async () => {
    if (!tableRef.current) {
      alert('Table not ready for download. Please wait for the table to finish rendering.');
      return;
    }

    const table = tableRef.current;
    
    try {
      // Dynamically import html2canvas-pro (supports oklch colors)
      const html2canvas = (await import('html2canvas-pro')).default;
      
      // Get the table's parent container for better capture
      const container = table.closest('.overflow-x-auto') || table.parentElement;
      
      const canvas = await html2canvas(container || table, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = title ? `${title}.png` : `table-${toolCallId}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          alert('Failed to create PNG image. Please try downloading as CSV instead.');
        }
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Error converting table to PNG:', error);
      alert('Failed to convert table to PNG. Please try downloading as CSV instead.');
    }
  };

  return (
    <div className="my-4">
      <div className="mb-2 flex items-center justify-between">
        {title && (
          <h4 className="text-sm font-semibold">{title}</h4>
        )}
        <div className="flex gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCSV}
            className="h-8 px-3 text-xs"
            title="Download as CSV"
          >
            <Download className="h-3 w-3 mr-1" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPNG}
            className="h-8 px-3 text-xs"
            title="Download as PNG"
          >
            <Download className="h-3 w-3 mr-1" />
            PNG
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table ref={tableRef} className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {headers.map((header: string, index: number) => (
                <th
                  key={index}
                  className="border border-gray-200 px-4 py-2 text-left text-xs font-semibold text-gray-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: (string | number)[], rowIndex: number) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {row.map((cell: string | number, cellIndex: number) => (
                  <td
                    key={cellIndex}
                    className="border border-gray-200 px-4 py-2 text-xs text-gray-900"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


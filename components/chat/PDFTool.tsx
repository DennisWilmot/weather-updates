'use client';

import { useMemo, useRef } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ObservablePlot } from '@/components/observable-plot';
import { TableTool } from './TableTool';
import MessageContent from '@/components/MessageContent';


interface PDFToolProps {
  toolCallId: string;
  args: any;
  result?: any;
}

export function PDFTool({ toolCallId, args, result }: PDFToolProps) {
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Use result if available, otherwise use args
  const pdfData = useMemo(() => {
    let data = result || args;
    
    if (!data) {
      console.log('[PDFTool] No data available', { toolCallId, args, result });
      return null;
    }
    
    if (data.type === 'error') {
      console.log('[PDFTool] Error in data', data);
      return null;
    }
    
    // Handle both 'pdf-document' and 'pdf_document' type names
    if (data.type === 'pdf-document' || data.type === 'pdf_document' || !data.type) {
      console.log('[PDFTool] PDF data:', { title: data.title, sectionsCount: data.sections?.length, data });
      return data;
    }
    
    console.log('[PDFTool] Unknown data type:', data.type, data);
    return data;
  }, [args, result, toolCallId]);

  // Check for errors
  if (pdfData?.type === 'error') {
    return (
      <div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-800">Error</p>
        <p className="text-sm text-red-700">{pdfData.error}</p>
        {pdfData.suggestion && (
          <p className="mt-2 text-xs text-red-600">{pdfData.suggestion}</p>
        )}
      </div>
    );
  }

  // Show loading state
  if (!pdfData) {
    return (
      <div className="my-4 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Generating PDF document...</p>
        </div>
      </div>
    );
  }

  // Validate required fields
  if (!pdfData.title) {
    console.error('[PDFTool] Missing title in PDF data:', pdfData);
    return (
      <div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-800">Error</p>
        <p className="text-sm text-red-700">PDF document is missing a title.</p>
      </div>
    );
  }

  if (!pdfData.sections || !Array.isArray(pdfData.sections) || pdfData.sections.length === 0) {
    console.error('[PDFTool] Missing or empty sections in PDF data:', pdfData);
    return (
      <div className="my-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm font-semibold text-yellow-800">Warning</p>
        <p className="text-sm text-yellow-700">PDF document has no sections to display.</p>
      </div>
    );
  }

  const { title, sections, filename, warnings } = pdfData;

  const handleDownloadPDF = async () => {
    if (!pdfContainerRef.current) {
      alert('PDF content not ready for download. Please wait for the document to finish rendering.');
      return;
    }

    try {
      // Dynamically import html2canvas-pro (supports oklch colors) and jsPDF
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      const container = pdfContainerRef.current;
      
      // Convert the container to canvas (html2canvas-pro supports oklch colors)
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Calculate PDF dimensions
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth; // Maintain aspect ratio
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: pdfHeight > 297 ? 'portrait' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Save PDF
      pdf.save(filename ? `${filename}.pdf` : `${title}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please make sure all sections are rendered correctly.');
    }
  };

  return (
    <div className="my-4" data-pdf-id={title || `pdf-${toolCallId}`}>
      <div className="mb-4 flex items-center justify-between rounded-lg border bg-gray-50 p-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {warnings && warnings.length > 0 && (
            <div className="mt-2">
              {warnings.map((warning: string, index: number) => (
                <p key={index} className="text-xs text-yellow-700">{warning}</p>
              ))}
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPDF}
          className="h-8 px-3 text-xs"
          title="Download as PDF"
        >
          <Download className="h-3 w-3 mr-1" />
          PDF
        </Button>
      </div>
      
      <div
        ref={pdfContainerRef}
        className="space-y-6 rounded-lg border bg-white p-6"
        style={{ minHeight: '400px' }}
      >
        {sections.map((section: any, index: number) => {
          if (section.type === 'text' && section.content) {
            return (
              <div key={index} className="prose prose-sm max-w-none">
                <MessageContent content={section.content} />
              </div>
            );
          } else if (section.type === 'chart' && section.chartData) {
            return (
              <div key={index} className="my-4">
                <ObservablePlot
                  data={section.chartData.data}
                  plotType={section.chartData.plotType}
                  title={section.chartData.title}
                  xLabel={section.chartData.xLabel}
                  yLabel={section.chartData.yLabel}
                  xField={section.chartData.xField}
                  yField={section.chartData.yField}
                  width={section.chartData.width}
                  height={section.chartData.height}
                  colorScheme={section.chartData.colorScheme}
                  plotId={`pdf-chart-${toolCallId}-${index}`}
                />
              </div>
            );
          } else if (section.type === 'table' && section.tableData) {
            return (
              <div key={index} className="my-4">
                <TableTool
                  toolCallId={`pdf-table-${toolCallId}-${index}`}
                  args={section.tableData}
                />
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}


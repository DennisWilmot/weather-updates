'use client';

import { useMemo, useRef } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ObservablePlot, ObservablePlotHandle } from '@/components/observable-plot';
import { validatePlotData, normalizePlotData, hasEmojis } from '@/lib/chat-validation';

interface ObservablePlotToolProps {
  toolCallId: string;
  args: any;
  result?: any;
}

export function ObservablePlotTool({ toolCallId, args, result }: ObservablePlotToolProps) {
  const plotRef = useRef<ObservablePlotHandle>(null);
  // Use result if available (from tool execution), otherwise use args (from tool call)
  const plotData = useMemo(() => {
    if (result) {
      // If result is an error, return it so it can be displayed
      if (result.type === 'error') {
        return result;
      }
      // Result from tool execution
      return result;
    }
    // Args from tool call
    const data = args;
    
    // If no data provided, generate sample data for demonstration
    if (data && (!data.data || (Array.isArray(data.data) && data.data.length === 0))) {
      console.warn('No data provided, generating sample data');
      // Generate sample random data
      const sampleData = Array.from({ length: 10 }, (_, i) => ({
        x: `Item ${i + 1}`,
        y: Math.floor(Math.random() * 100) + 1,
      }));
      
      return {
        ...data,
        data: sampleData,
        plotType: data.plotType || 'bar',
        title: data.title || 'Sample Chart',
      };
    }
    
    return data;
  }, [args, result]);

  // Check for errors
  if (plotData?.type === 'error') {
    return (
      <div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-800">Error</p>
        <p className="text-sm text-red-700">{plotData.error}</p>
        {plotData.suggestion && (
          <p className="mt-2 text-xs text-red-600">{plotData.suggestion}</p>
        )}
      </div>
    );
  }

  // Show loading state if we don't have complete plot data yet
  if (!plotData || !plotData.data || !plotData.plotType) {
    return (
      <div className="my-4 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Generating chart...</p>
        </div>
      </div>
    );
  }

  // Validate plot data
  const validation = validatePlotData(plotData.data, plotData.plotType);
  if (!validation.valid) {
    return (
      <div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-800">Invalid Plot Data</p>
        <p className="text-sm text-red-700">{validation.error}</p>
        {validation.suggestion && (
          <p className="mt-2 text-xs text-red-600">{validation.suggestion}</p>
        )}
      </div>
    );
  }

  // Check for emojis in original data
  const originalDataHasEmojis = hasEmojis(plotData.data);

  // Normalize data (removes emojis)
  const normalizedData = normalizePlotData(plotData.data);

  // Show warning for pie chart conversion
  const showPieWarning = plotData.plotType === 'pie';

  const handleDownloadPNG = () => {
    plotRef.current?.downloadAsPNG(plotData.title ? `${plotData.title}.png` : undefined);
  };

  const handleDownloadSVG = () => {
    plotRef.current?.downloadAsSVG(plotData.title ? `${plotData.title}.svg` : undefined);
  };

  return (
    <div className="my-4" data-chart-id={plotData.title || `chart-${toolCallId}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex-1">
          {showPieWarning && (
            <div className="mb-2 rounded-lg border border-yellow-200 bg-yellow-50 p-2">
              <p className="text-xs text-yellow-800">
                {plotData.warning || "Pie charts aren't natively supported. Showing as bar chart instead."}
              </p>
            </div>
          )}
          {originalDataHasEmojis && (
            <div className="mb-2 rounded-lg border border-yellow-200 bg-yellow-50 p-2">
              <p className="text-xs text-yellow-800">
                Emojis and special characters were removed from the chart data to ensure proper rendering.
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-2 ml-4">
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSVG}
            className="h-8 px-3 text-xs"
            title="Download as SVG"
          >
            <Download className="h-3 w-3 mr-1" />
            SVG
          </Button>
        </div>
      </div>
      <ObservablePlot
        ref={plotRef}
        data={normalizedData}
        plotType={plotData.plotType}
        title={plotData.title}
        xLabel={plotData.xLabel}
        yLabel={plotData.yLabel}
        xField={plotData.xField}
        yField={plotData.yField}
        width={plotData.width}
        height={plotData.height}
        colorScheme={plotData.colorScheme}
        plotId={`plot-${toolCallId}`}
      />
    </div>
  );
}


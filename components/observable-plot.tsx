'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as Plot from '@observablehq/plot';

interface ObservablePlotProps {
  data: any;
  plotType: 'line' | 'bar' | 'area' | 'scatter' | 'histogram' | 'pie';
  title?: string;
  xLabel?: string;
  yLabel?: string;
  xField?: string;
  yField?: string;
  width?: number;
  height?: number;
  colorScheme?: string;
  plotId?: string;
}

export interface ObservablePlotHandle {
  downloadAsPNG: (filename?: string) => void;
  downloadAsSVG: (filename?: string) => void;
}

export const ObservablePlot = forwardRef<ObservablePlotHandle, ObservablePlotProps>(({
  data,
  plotType,
  title,
  xLabel,
  yLabel,
  xField,
  yField,
  width = 800,
  height = 600,
  colorScheme,
  plotId,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !data || !Array.isArray(data) || data.length === 0) {
      return;
    }

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Determine if data is array of objects or array of arrays
    const isObjectArray = data.length > 0 && typeof data[0] === 'object' && !Array.isArray(data[0]);
    
    // Normalize data
    let plotData: any[];
    let xKey: string | undefined;
    let yKey: string | undefined;

    if (isObjectArray) {
      plotData = data;
      xKey = xField || Object.keys(data[0])[0];
      yKey = yField || Object.keys(data[0])[1];
    } else {
      // Array of arrays - convert to objects
      const headers = Array.isArray(data[0]) && typeof data[0][0] === 'string' ? data[0] : undefined;
      const rows = headers ? data.slice(1) : data;
      
      if (headers) {
        plotData = rows.map((row: any[]) => {
          const obj: any = {};
          headers.forEach((header, i) => {
            obj[header] = row[i];
          });
          return obj;
        });
        xKey = xField || headers[0];
        yKey = yField || headers[1];
      } else {
        // Simple array of arrays [x, y]
        plotData = rows.map((row: any[]) => ({
          x: row[0],
          y: row[1],
        }));
        xKey = 'x';
        yKey = 'y';
      }
    }

    // Ensure container has a minimum width
    const containerWidth = containerRef.current.clientWidth || 
                          containerRef.current.parentElement?.clientWidth || 
                          width;
    
    // Build plot configuration
    const plotConfig: any = {
      width: Math.max(containerWidth, 400), // Minimum 400px width
      height: Math.max(height, 300), // Minimum 300px height
      marginLeft: 60,
      marginRight: 20,
      marginBottom: 40,
      marginTop: title ? 30 : 10,
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
      },
    };

    // Add axis labels
    if (xLabel || xKey) {
      plotConfig.x = {
        label: xLabel || xKey,
        grid: true,
      };
    }

    if (yLabel || yKey) {
      plotConfig.y = {
        label: yLabel || yKey,
        grid: true,
      };
    }

    // Add color scheme if provided
    if (colorScheme) {
      plotConfig.color = {
        scheme: colorScheme,
      };
    }

    // Validate that we have the required keys before building the plot
    if (!xKey || !yKey) {
      console.error('Missing x or y key:', { xKey, yKey, data: plotData });
      if (containerRef.current) {
        containerRef.current.innerHTML = `<div style="padding: 20px; color: red;">Error: Could not determine x or y axis fields from data</div>`;
      }
      return;
    }

    // Build marks based on plot type
    const marks: any[] = [];

    // Convert pie to bar (pie charts not natively supported)
    const actualPlotType = plotType === 'pie' ? 'bar' : plotType;

    switch (actualPlotType) {
      case 'bar':
        // For bar charts, determine if we should use barX (horizontal) or barY (vertical)
        // Check if x values are strings (categorical) - if so, use barY (vertical bars)
        const firstXValue = xKey ? plotData[0]?.[xKey] : undefined;
        const isCategorical = typeof firstXValue === 'string';
        
        if (isCategorical) {
          // Vertical bars: x is category, y is value
          marks.push(
            Plot.barY(plotData, {
              x: xKey,
              y: yKey,
              fill: '#4dabf7', // Blue color for bars
              tip: true,
            }),
            Plot.ruleY([0])
          );
        } else {
          // Horizontal bars: x is value, y is category (or use x for both if needed)
          marks.push(
            Plot.barX(plotData, {
              x: yKey, // Use yKey as the value for horizontal bars
              y: xKey, // Use xKey as the category
              fill: '#4dabf7', // Blue color for bars
              tip: true,
            }),
            Plot.ruleX([0])
          );
        }
        break;

      case 'line':
        marks.push(
          Plot.lineY(plotData, {
            x: xKey,
            y: yKey,
            tip: true,
          }),
          Plot.dot(plotData, {
            x: xKey,
            y: yKey,
            tip: true,
          })
        );
        break;

      case 'area':
        marks.push(
          Plot.areaY(plotData, {
            x: xKey,
            y: yKey,
            tip: true,
          }),
          Plot.ruleY([0])
        );
        break;

      case 'scatter':
        marks.push(
          Plot.dot(plotData, {
            x: xKey,
            y: yKey,
            tip: true,
          })
        );
        break;

      case 'histogram':
        marks.push(
          Plot.rectY(plotData, {
            x: xKey,
            y: yKey,
            tip: true,
          }),
          Plot.ruleY([0])
        );
        break;
    }

    plotConfig.marks = marks;

    // Add title if provided
    if (title) {
      plotConfig.title = title;
    }

    // Validate that plotData has the required fields
    const sample = plotData[0];
    if (!sample || !(xKey in sample) || !(yKey in sample)) {
      console.error('Data missing required fields:', { xKey, yKey, sample, plotData });
      if (containerRef.current) {
        containerRef.current.innerHTML = `<div style="padding: 20px; color: red;">Error: Data is missing required fields (${xKey}, ${yKey})</div>`;
      }
      return;
    }

    // Create and render plot
    try {
      console.log('Rendering plot with config:', { 
        plotType: actualPlotType, 
        xKey, 
        yKey, 
        dataLength: plotData.length,
        sampleData: plotData.slice(0, 2),
        plotConfig: { ...plotConfig, marks: '[marks]' } // Don't log full marks array
      });
      
      const plot = Plot.plot(plotConfig);
      
      // Plot.plot() returns a DOM element - just append it
      // (No need to check type, Observable Plot always returns a valid element)
      if (plot) {
        containerRef.current.appendChild(plot);
        // Store reference to SVG for download
        svgRef.current = plot as SVGElement;
      } else {
        throw new Error('Plot.plot() returned null or undefined');
      }
    } catch (error) {
      console.error('Error rendering plot:', error, { 
        plotConfig: { ...plotConfig, marks: '[marks]' },
        plotData: plotData.slice(0, 3),
        xKey,
        yKey
      });
      if (containerRef.current) {
        containerRef.current.innerHTML = `<div style="padding: 20px; color: red; border: 1px solid red; border-radius: 4px; background: #fee;">
          <strong>Error rendering chart:</strong><br/>
          ${error instanceof Error ? error.message : 'Unknown error'}<br/>
          <small style="color: #666;">Check browser console for details</small>
        </div>`;
      }
    }

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      svgRef.current = null;
    };
  }, [data, plotType, title, xLabel, yLabel, xField, yField, width, height, colorScheme]);

  // Expose download methods via ref
  useImperativeHandle(ref, () => ({
     downloadAsPNG: (filename?: string) => {
       if (!svgRef.current) {
         console.error('SVG not available for download');
         alert('Chart not ready for download. Please wait for the chart to finish rendering.');
         return;
       }

       const plotElement = svgRef.current;
       
       // Observable Plot returns a <figure> element, we need to find the actual <svg> inside it
       let svg: SVGElement;
       if (plotElement.tagName === 'FIGURE') {
         // Find the SVG element inside the figure
         const svgElement = plotElement.querySelector('svg');
         if (!svgElement) {
           console.error('No SVG element found inside figure');
           alert('Could not find chart data. Please try again.');
           return;
         }
         svg = svgElement;
      } else if (plotElement instanceof SVGElement) {
        svg = plotElement;
      } else {
        // Type assertion needed because TypeScript narrows to never here
        const element = plotElement as HTMLElement | SVGElement;
        console.error('Unexpected element type:', element.tagName);
        alert('Unexpected chart format. Please try downloading as SVG instead.');
        return;
      }
       
       // Get SVG dimensions - try multiple methods
       let svgWidth = width;
       let svgHeight = height;
       
      // Try to get from SVG attributes first
      const widthAttr = svg.getAttribute('width');
      const heightAttr = svg.getAttribute('height');
      
      // Check if svg is an SVGSVGElement (has viewBox property)
      const svgElement = svg instanceof SVGSVGElement ? svg : null;
      
      if (widthAttr && !isNaN(parseFloat(widthAttr))) {
        svgWidth = parseFloat(widthAttr);
      } else if (svgElement?.viewBox?.baseVal?.width) {
        svgWidth = svgElement.viewBox.baseVal.width;
      } else if (svg.clientWidth) {
        svgWidth = svg.clientWidth;
      }
      
      if (heightAttr && !isNaN(parseFloat(heightAttr))) {
        svgHeight = parseFloat(heightAttr);
      } else if (svgElement?.viewBox?.baseVal?.height) {
        svgHeight = svgElement.viewBox.baseVal.height;
      } else if (svg.clientHeight) {
         svgHeight = svg.clientHeight;
       }
       
       console.log('PNG download - SVG dimensions:', { svgWidth, svgHeight, width, height });

       // Clone the SVG to avoid modifying the original
       const clonedSvg = svg.cloneNode(true) as SVGElement;
       
       // Ensure the cloned SVG has explicit width and height
       if (!clonedSvg.getAttribute('width')) {
         clonedSvg.setAttribute('width', String(svgWidth));
       }
       if (!clonedSvg.getAttribute('height')) {
         clonedSvg.setAttribute('height', String(svgHeight));
       }
       
       // Ensure SVG has xmlns attribute for proper rendering
       if (!clonedSvg.getAttribute('xmlns')) {
         clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
       }

       // Get computed styles and embed them in the SVG
       const styleSheets = Array.from(document.styleSheets);
       let cssText = '';
       try {
         for (const sheet of styleSheets) {
           try {
             const rules = Array.from(sheet.cssRules || []);
             for (const rule of rules) {
               if (rule instanceof CSSStyleRule) {
                 // Only include rules that might affect SVG
                 if (rule.selectorText && (rule.selectorText.includes('svg') || rule.selectorText === '*')) {
                   cssText += rule.cssText + '\n';
                 }
               }
             }
           } catch (e) {
             // Ignore CORS errors for external stylesheets
           }
         }
       } catch (e) {
         // Ignore errors
       }

       // Create a style element with embedded styles
       if (cssText) {
         const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
         styleElement.textContent = cssText;
         clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);
       }

       const svgData = new XMLSerializer().serializeToString(clonedSvg);
       
       // Use data URL instead of blob URL for better compatibility
       const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);

       const img = new Image();
       
       // Set crossOrigin to anonymous to avoid CORS issues
       img.crossOrigin = 'anonymous';
       
       img.onerror = (error) => {
         console.error('Failed to load SVG image for PNG conversion:', error, {
           svgDataLength: svgData.length,
           svgDataUrlLength: svgDataUrl.length,
           svgPreview: svgData.substring(0, 200)
         });
         alert('Failed to convert chart to PNG. The SVG may contain external resources. Please try downloading as SVG instead.');
       };
       
       img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = svgWidth;
          canvas.height = svgHeight;
          
           const ctx = canvas.getContext('2d');
           if (!ctx) {
             console.error('Failed to get canvas context');
             return;
           }
           
           // Fill white background
           ctx.fillStyle = 'white';
           ctx.fillRect(0, 0, canvas.width, canvas.height);
           
           // Draw the SVG image
           ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
           
           canvas.toBlob((blob) => {
             if (blob) {
               const downloadUrl = URL.createObjectURL(blob);
               const link = document.createElement('a');
               link.href = downloadUrl;
               link.download = filename || `${title || 'chart'}.png`;
               document.body.appendChild(link);
               link.click();
               document.body.removeChild(link);
               URL.revokeObjectURL(downloadUrl);
             } else {
               console.error('Failed to create PNG blob');
               alert('Failed to create PNG image. Please try downloading as SVG instead.');
             }
           }, 'image/png', 1.0);
         } catch (error) {
           console.error('Error converting SVG to PNG:', error);
           alert('Error converting chart to PNG: ' + (error instanceof Error ? error.message : 'Unknown error'));
         }
       };
       
       img.src = svgDataUrl;
    },
     downloadAsSVG: (filename?: string) => {
       if (!svgRef.current) {
         console.error('SVG not available for download');
         return;
       }

       const plotElement = svgRef.current;
       
       // Observable Plot returns a <figure> element, we need to find the actual <svg> inside it
       let svg: SVGElement;
       if (plotElement.tagName === 'FIGURE') {
         // Find the SVG element inside the figure
         const svgElement = plotElement.querySelector('svg');
         if (!svgElement) {
           console.error('No SVG element found inside figure');
           alert('Could not find chart data. Please try again.');
           return;
         }
         svg = svgElement;
      } else if (plotElement instanceof SVGElement) {
        svg = plotElement;
      } else {
        // Type assertion needed because TypeScript narrows to never here
        const element = plotElement as HTMLElement | SVGElement;
        console.error('Unexpected element type:', element.tagName);
        alert('Unexpected chart format.');
        return;
      }
       
       const svgData = new XMLSerializer().serializeToString(svg);
       const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
       const url = URL.createObjectURL(svgBlob);

       const link = document.createElement('a');
       link.href = url;
       link.download = filename || `${title || 'chart'}.svg`;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
     },
  }));

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 border border-gray-200 rounded">
        No data available for chart
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div
        ref={containerRef}
        className="w-full"
        style={{ 
          minHeight: Math.max(height, 300),
          minWidth: '100%',
          width: '100%'
        }}
        data-plot-id={plotId}
      />
    </div>
  );
});

ObservablePlot.displayName = 'ObservablePlot';


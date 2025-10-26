'use client';

import { Box } from '@mantine/core';
import { useEffect, useState, useRef } from 'react';

interface JamaicaParishMapProps {
  selectedParish: string;
  onParishClick: (parishName: string) => void;
}

const parishMap: Record<string, string> = {
  'JM01': 'Kingston',
  'JM02': 'Saint Andrew',
  'JM03': 'Saint Thomas',
  'JM04': 'Portland',
  'JM05': 'Saint Mary',
  'JM06': 'Saint Ann',
  'JM07': 'Trelawny',
  'JM08': 'Saint James',
  'JM09': 'Hanover',
  'JM10': 'Westmoreland',
  'JM11': 'Saint Elizabeth',
  'JM12': 'Manchester',
  'JM13': 'Clarendon',
  'JM14': 'Saint Catherine'
};

export default function JamaicaParishMap({ selectedParish, onParishClick }: JamaicaParishMapProps) {
  const [svgContent, setSvgContent] = useState<string>('');
  const svgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/jm.svg')
      .then(res => res.text())
      .then(text => setSvgContent(text));
  }, []);

  useEffect(() => {
    if (!svgContent || !svgRef.current) return;

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = svgRef.current.querySelector('svg');

    if (!svgElement) return;

    // Add styles to the SVG
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      svg {
        width: 100%;
        height: auto;
        max-height: 250px;
      }
      path[id^="JM"] {
        cursor: pointer;
        transition: all 0.2s ease;
      }
      path[id^="JM"]:hover {
        opacity: 0.8;
      }
    `;
    svgElement.appendChild(style);

    // Add click handlers to all parish paths
    Object.keys(parishMap).forEach(parishId => {
      const path = svgDoc.getElementById(parishId);
      if (path) {
        const clonedPath = path.cloneNode(true) as SVGPathElement;
        
        // Set color based on selection
        const parishName = parishMap[parishId];
        if (selectedParish === parishName) {
          clonedPath.setAttribute('fill', '#1e50ff');
          clonedPath.setAttribute('opacity', '1');
          clonedPath.setAttribute('style', 'cursor: pointer; stroke: #fff; stroke-width: 0.5;');
        } else if (selectedParish && selectedParish !== parishName) {
          clonedPath.setAttribute('fill', '#6f9c76');
          clonedPath.setAttribute('opacity', '0.5');
          clonedPath.setAttribute('style', 'cursor: pointer; stroke: #fff; stroke-width: 0.5;');
        } else {
          clonedPath.setAttribute('fill', '#6f9c76');
          clonedPath.setAttribute('opacity', '0.6');
          clonedPath.setAttribute('style', 'cursor: pointer; stroke: #fff; stroke-width: 0.5;');
        }
        
        clonedPath.addEventListener('click', () => onParishClick(parishName));
        clonedPath.addEventListener('mouseenter', () => {
          if (selectedParish !== parishName) {
            clonedPath.setAttribute('opacity', '0.8');
          }
        });
        clonedPath.addEventListener('mouseleave', () => {
          if (selectedParish !== parishName) {
            clonedPath.setAttribute('opacity', selectedParish ? '0.5' : '0.6');
          }
        });
        
        // Replace or add the path
        const existingPath = svgElement.querySelector(`#${parishId}`);
        if (existingPath) {
          existingPath.replaceWith(clonedPath);
        } else {
          svgElement.appendChild(clonedPath);
        }
      }
    });

  }, [svgContent, selectedParish, onParishClick]);

  return (
    <Box 
      ref={svgRef}
      style={{ 
        width: '100%', 
        maxHeight: '250px',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

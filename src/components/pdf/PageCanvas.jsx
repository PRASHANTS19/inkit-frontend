import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { usePDFProxy } from './PDFLoader';
import { usePDFStore } from '../../store/pdfStore';
import { AnnotationLayer } from './AnnotationLayer';
import { FormFieldLayer } from './FormFieldLayer';

/**
 * PageCanvas renders an individual PDF page asynchronously via an offscreen 2D context.
 * Provides virtual scroll and resize resilience.
 */
export function PageCanvas({ pageIndex, isVisible, documentId }) {
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const pdfProxy = usePDFProxy();
  const [pageProxy, setPageProxy] = useState(null);
  const [rendered, setRendered] = useState(false);
  const zoomLevel = usePDFStore(s => s.zoomLevel);

  // 1. Fetch the page from the PDF Document
  useEffect(() => {
    // Optimization: If not visible, we could delay or skip fetching. 
    // However, fetching a page is fast; rendering is slow.
    let active = true;

    if (pdfProxy) {
      pdfProxy.getPage(pageIndex + 1).then(page => {
        if (active) setPageProxy(page);
      }).catch(err => {
        console.error("Error fetching page:", err);
      });
    }

    return () => { active = false; };
  }, [pdfProxy, pageIndex]);

  // 2. Render the page to the Canvas
  useEffect(() => {
    if (!pageProxy || !canvasRef.current || !isVisible) return;

    let active = true;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Scale for device pixel ratio for crisp rendering on retina displays
    const dpr = window.devicePixelRatio || 1;
    const scale = zoomLevel; 
    
    const viewport = pageProxy.getViewport({ scale: scale * dpr });
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // CSS layout size
    canvas.style.width = `${viewport.width / dpr}px`;
    canvas.style.height = `${viewport.height / dpr}px`;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    const renderTask = pageProxy.render(renderContext);
    
    renderTask.promise.then(() => {
      if (active) {
        setRendered(true);
        
        // Render selectable Text Layer over canvas
        if (textLayerRef.current) {
          pageProxy.getTextContent().then(textContent => {
            if (!active || !textLayerRef.current) return;
            textLayerRef.current.innerHTML = '';
            
            try {
              // pdfjs-dist v5 uses class-based TextLayer
              const textLayer = new pdfjsLib.TextLayer({
                textContentSource: textContent,
                container: textLayerRef.current,
                viewport: viewport,
              });
              textLayer.render();
            } catch (layerErr) {
              console.error("TextLayer render failed:", layerErr);
            }
          });
        }
      }
    }).catch(err => {
      if (err.name !== 'RenderingCancelledException') {
        console.error(`Page ${pageIndex + 1} render error:`, err);
      }
    });

    return () => {
      active = false;
      renderTask.cancel();
    };
  }, [pageProxy, isVisible, zoomLevel]);

  // We use placeholder dimensions if the page hasn't loaded to prevent scroll jumping
  // Ideally, PDF.js can give us dimensions before rendering, but 800x1000 is an okay default fallback.
  const [placeholderScale, setPlaceholderScale] = useState({ w: 800 * zoomLevel, h: 1000 * zoomLevel });

  useEffect(() => {
    if (pageProxy) {
      const v = pageProxy.getViewport({ scale: zoomLevel });
      setPlaceholderScale({ w: v.width, h: v.height });
    }
  }, [pageProxy, zoomLevel]);

  return (
    <div 
      className="relative bg-white shadow-md mx-auto my-4 shrink-0 origin-top z-10 print:my-0 print:shadow-none"
      style={{ 
        width: `${placeholderScale.w}px`, 
        height: `${placeholderScale.w === 0 ? 'auto' : placeholderScale.h}px` 
      }}
    >
      <canvas 
        ref={canvasRef} 
        className={`block w-full h-full transition-opacity duration-300 ${rendered ? 'opacity-100' : 'opacity-0'}`} 
      />
      
      <div 
        ref={textLayerRef} 
        className={`textLayer transition-opacity duration-300 ${rendered ? 'opacity-100' : 'opacity-0'}`} 
        style={{ width: `${placeholderScale.w}px`, height: `${placeholderScale.h}px` }} 
      />

      {/* Annotation SVG overlay */}
      {rendered && documentId && (
        <AnnotationLayer
          pageIndex={pageIndex}
          pageWidth={placeholderScale.w}
          pageHeight={placeholderScale.h}
          documentId={documentId}
        />
      )}

      {/* Form Field overlay */}
      {rendered && documentId && (
        <FormFieldLayer
          pageIndex={pageIndex}
          pageWidth={placeholderScale.w}
          pageHeight={placeholderScale.h}
          documentId={documentId}
        />
      )}
      
      {!rendered && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50">
          <div className="flex flex-col items-center text-gray-400">
            <svg className="animate-spin h-5 w-5 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs">Loading {pageIndex + 1}...</span>
          </div>
        </div>
      )}
    </div>
  );
}

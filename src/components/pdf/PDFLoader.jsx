import React, { useEffect, useState, createContext, useContext } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { usePDFStore } from '../../store/pdfStore';

// Initialize the worker. We use a relative import to the node_modules build to reliably load the worker.
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

const PDFProxyContext = createContext(null);

export const usePDFProxy = () => useContext(PDFProxyContext);

export function PDFLoader({ url, file = null, children }) {
  const [pdfProxy, setPdfProxy] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const setTotalPages = usePDFStore((state) => state.setTotalPages);
  const setDocumentId = usePDFStore((state) => state.setDocumentId);

  useEffect(() => {
    let loadingTask = null;
    
    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let source = url;
        if (file) {
          // If a File object is passed, read it as an ArrayBuffer
          const buffer = await file.arrayBuffer();
          // pdf.js expects typed array
          source = new Uint8Array(buffer); 
        }
        
        if (!source) {
          setLoading(false);
          return;
        }

        loadingTask = pdfjsLib.getDocument(source);
        const pdf = await loadingTask.promise;
        
        setPdfProxy(pdf);
        setTotalPages(pdf.numPages);
        setDocumentId(url || (file ? file.name : 'Unknown Document'));
        
      } catch (err) {
        console.error("PDF Load Error:", err);
        setError(err.message || 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();

    return () => {
      if (loadingTask && !loadingTask.destroyed) {
        loadingTask.destroy();
      }
    };
  }, [url, file, setTotalPages, setDocumentId]);

  if (loading) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900">
        <div className="h-8 w-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-500 animate-pulse">Loading Document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center p-8 bg-red-50 text-red-600">
        <svg className="h-10 w-10 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="font-semibold">Error loading PDF</p>
        <p className="text-sm opacity-80 mt-1">{error}</p>
      </div>
    );
  }

  if (!pdfProxy) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 text-zinc-500">
        <p>No document selected. Please upload or open a PDF.</p>
      </div>
    );
  }

  return (
    <PDFProxyContext.Provider value={pdfProxy}>
      {children}
    </PDFProxyContext.Provider>
  );
}

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePDFStore } from '../../store/pdfStore';
import { PageCanvas } from './PageCanvas';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function VirtualPageList({ documentId }) {
  const totalPages = usePDFStore(state => state.totalPages);
  const layoutMode = usePDFStore(state => state.layoutMode);
  const currentPage = usePDFStore(state => state.currentPage);
  const goToNextPage = usePDFStore(state => state.goToNextPage);
  const goToPrevPage = usePDFStore(state => state.goToPrevPage);
  const containerRef = useRef(null);

  if (layoutMode === 'single') {
    return (
      <SinglePageView
        totalPages={totalPages}
        currentPage={currentPage}
        goToNextPage={goToNextPage}
        goToPrevPage={goToPrevPage}
        documentId={documentId}
      />
    );
  }

  // Continuous scroll — all pages stacked with virtual rendering
  return (
    <div 
      className="flex-1 overflow-auto bg-zinc-200 dark:bg-zinc-800 p-4 md:p-8 flex flex-col items-center"
      ref={containerRef}
    >
      <div className="flex flex-col relative w-full items-center">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <VisiblePageWrapper key={idx} pageIndex={idx} documentId={documentId} />
        ))}
      </div>
    </div>
  );
}

// ── SINGLE PAGE VIEW ────────────────────────────────────────────────────────
function SinglePageView({ totalPages, currentPage, goToNextPage, goToPrevPage, documentId }) {
  const containerRef = useRef(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPrevPage]);

  const pageIndex = currentPage - 1; // 0-based

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-zinc-200 dark:bg-zinc-800 flex flex-col items-center relative"
    >
      {/* Single page canvas — always visible */}
      <div className="flex-1 flex items-start justify-center p-4 md:p-8 w-full">
        <div className="w-full flex justify-center" id={`pdf-page-${currentPage}`}>
          <PageCanvas pageIndex={pageIndex} isVisible={true} documentId={documentId} />
        </div>
      </div>

      {/* Navigation overlay */}
      <div className="sticky bottom-0 left-0 right-0 flex items-center justify-center gap-3 py-3 bg-gradient-to-t from-zinc-900/60 via-zinc-900/30 to-transparent pointer-events-none z-20">
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/90 dark:bg-zinc-800/90 shadow-lg backdrop-blur text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>

        <span className="pointer-events-auto px-4 py-2 rounded-lg bg-white/90 dark:bg-zinc-800/90 shadow-lg backdrop-blur text-sm font-semibold text-zinc-800 dark:text-zinc-100 tabular-nums">
          {currentPage} <span className="text-zinc-400 font-normal">of</span> {totalPages}
        </span>

        <button
          onClick={goToNextPage}
          disabled={currentPage >= totalPages}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/90 dark:bg-zinc-800/90 shadow-lg backdrop-blur text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Wrapper to track visibility of individual pages (continuous mode) ─────
function VisiblePageWrapper({ pageIndex, documentId }) {
  const [isVisible, setIsVisible] = useState(false);
  const wrapperRef = useRef(null);
  const setCurrentPage = usePDFStore(state => state.setCurrentPage);

  useEffect(() => {
    // 1000px rootMargin triggers rendering of adjacent pages slightly before they scroll into view.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          setIsVisible(entry.isIntersecting);
          
          // If a significant portion of this page is visible, mark it as the current active page
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
             setCurrentPage(pageIndex + 1);
          }
        });
      },
      { 
        rootMargin: '1000px 0px 1000px 0px', 
        threshold: [0, 0.3] // Evaluate intersection initially, and when 30% visible
      }
    );
    
    if (wrapperRef.current) {
        observer.observe(wrapperRef.current);
    }
    
    return () => observer.disconnect();
  }, [pageIndex, setCurrentPage]);

  return (
    <div ref={wrapperRef} className="w-full flex justify-center" id={`pdf-page-${pageIndex + 1}`}>
      {<PageCanvas pageIndex={pageIndex} isVisible={isVisible} documentId={documentId} />}
    </div>
  );
}

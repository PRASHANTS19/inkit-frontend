import React, { useEffect, useRef, useState } from 'react';
import { usePDFProxy } from './PDFLoader';
import { usePDFStore } from '../../store/pdfStore';

function ThumbnailCanvas({ pageIndex, isVisible, onClick, isActive }) {
  const canvasRef = useRef(null);
  const pdfProxy = usePDFProxy();
  const [rendered, setRendered] = useState(false);
  // Default aspect ratio until PDF renders
  const [dimensions, setDimensions] = useState({ width: 150, height: 212 }); 

  useEffect(() => {
    // Only attempt to render once the thumbnail container is near the viewport
    // And do not re-render if it's already rendered
    if (!isVisible || !pdfProxy || !canvasRef.current || rendered) return;

    let active = true;
    
    (async () => {
      try {
        const page = await pdfProxy.getPage(pageIndex + 1);
        if (!active) return;
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // Target a consistent thumbnail width (150px)
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const scale = 150 / unscaledViewport.width;
        
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * dpr });
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;
        
        setDimensions({ 
          width: viewport.width / dpr, 
          height: viewport.height / dpr 
        });
        
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
        
        if (active) setRendered(true);
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
            console.error(`Thumbnail ${pageIndex + 1} render error:`, err);
        }
      }
    })();

    return () => { active = false; };
  }, [isVisible, pdfProxy, pageIndex, rendered]);

  return (
    <div 
      className={`relative cursor-pointer transition-all border-2 mb-6 mx-auto bg-white shadow-sm flex-shrink-0 ${isActive ? 'border-blue-500 shadow-md' : 'border-transparent hover:border-zinc-300'}`} 
      onClick={onClick}
      style={{ minHeight: `${dimensions.height}px`, width: `${dimensions.width}px` }}
    >
       <canvas ref={canvasRef} className={`block w-full transition-opacity duration-300 ${rendered ? 'opacity-100' : 'opacity-0'}`} />
       
       {!rendered && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50">
             <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
          </div>
       )}

       <div className={`absolute -bottom-6 left-0 right-0 text-center text-xs font-medium ${isActive ? 'text-blue-600' : 'text-zinc-500'}`}>
          {pageIndex + 1}
       </div>
    </div>
  );
}

export function ThumbnailList() {
  const totalPages = usePDFStore(state => state.totalPages);
  const currentPage = usePDFStore(state => state.currentPage);
  
  const handleThumbnailClick = (pageIndex) => {
    // Scroll the main document view to the selected page
    const el = document.getElementById(`pdf-page-${pageIndex + 1}`);
    if (el) {
       el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col py-4 bg-zinc-100/50 overflow-y-auto min-h-0 border-t border-slate-200">
       <div className="px-4 text-xs font-semibold text-slate-600 mb-2 mt-2 uppercase">Pages</div>
      {Array.from({ length: totalPages }).map((_, idx) => (
         <VisibilityWrapper key={idx} fallbackHeight={212}>
            {({ isVisible }) => (
               <ThumbnailCanvas 
                  pageIndex={idx} 
                  isVisible={isVisible} 
                  isActive={currentPage === idx + 1}
                  onClick={() => handleThumbnailClick(idx)} 
               />
            )}
         </VisibilityWrapper>
      ))}
    </div>
  );
}

// Simple Intersection Observer wrapper custom built for thumbnails
function VisibilityWrapper({ children, fallbackHeight }) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
         if (entries[0].isIntersecting) {
            setIsVisible(true);
            observer.disconnect(); // Thumbnails do not unload when scrolled out of view to save repeated heavy renders
         }
      },
      { rootMargin: '300px' }
    );
    
    if (containerRef.current) {
        observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
     <div ref={containerRef} className="w-full flex justify-center min-h-[212px]">
        {children({ isVisible })}
     </div>
  );
}

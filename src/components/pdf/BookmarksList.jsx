import React, { useEffect, useState } from 'react';
import { usePDFProxy } from './PDFLoader';
import { ChevronRight, ChevronDown, Bookmark } from 'lucide-react';

export function BookmarksList() {
  const pdfProxy = usePDFProxy();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pdfProxy) return;
    
    let active = true;
    pdfProxy.getOutline().then(outline => {
       if (active) {
          setBookmarks(outline || []);
          setLoading(false);
       }
    }).catch(() => {
       if (active) setLoading(false);
    });
    
    return () => { active = false; };
  }, [pdfProxy]);

  if (loading) return <div className="p-4 text-xs text-slate-500">Loading bookmarks...</div>;
  if (bookmarks.length === 0) return null; // Hide if no outline is present

  return (
    <div className="w-full flex shrink-0 flex-col py-2 border-t border-slate-200 bg-slate-50 relative z-10 max-h-64 overflow-y-auto">
      <div className="px-4 text-xs font-semibold text-slate-600 mb-2 mt-2 uppercase flex items-center gap-2">
         <Bookmark className="w-3 h-3" /> Outline
      </div>
      <div className="px-2 pb-2">
        {bookmarks.map((item, i) => <BookmarkItem key={i} item={item} level={0} pdfProxy={pdfProxy} />)}
      </div>
    </div>
  );
}

function BookmarkItem({ item, level, pdfProxy }) {
   const [expanded, setExpanded] = useState(false);
   
   const handleClick = async (e) => {
      e.stopPropagation();
      
      if (item.dest) {
         let destination = item.dest;
         
         // If Named Destination, resolve it
         if (typeof destination === 'string') {
             destination = await pdfProxy.getDestination(destination);
         }
         
         if (destination && destination.length > 0) {
             const pageRef = destination[0];
             let pageIndex = -1;
             
             try {
                if (typeof pageRef === 'object' && pageRef !== null) {
                    pageIndex = await pdfProxy.getPageIndex(pageRef);
                } else if (typeof pageRef === 'number') {
                    // Sometimes it acts as a direct 0-based page index depending on the PDF spec version
                    pageIndex = pageRef;
                }
             } catch (e) {
                console.warn("Could not find page index for bookmark destination", e);
             }
             
             if (pageIndex >= 0) {
                 const el = document.getElementById(`pdf-page-${pageIndex + 1}`);
                 if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
             }
         }
      }
      
      if (item.items && item.items.length > 0) {
          setExpanded(!expanded);
      }
   };
   
   const hasChildren = item.items && item.items.length > 0;
   
   return (
      <div className="flex flex-col">
         <div 
            className="flex items-center py-1 px-2 hover:bg-slate-200 cursor-pointer rounded-sm group select-none"
            style={{ paddingLeft: `${(level * 12) + 8}px` }}
            onClick={handleClick}
         >
            <div className="w-4 h-4 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-slate-700 mr-1">
               {hasChildren ? (expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />) : <div className="w-1 h-1 rounded-full bg-slate-300" />}
            </div>
            <span className="text-sm text-slate-800 truncate" title={item.title}>{item.title}</span>
         </div>
         
         {expanded && hasChildren && (
            <div className="ml-1 border-l border-slate-200/50">
               {item.items.map((sub, i) => <BookmarkItem key={i} item={sub} level={level + 1} pdfProxy={pdfProxy} />)}
            </div>
         )}
      </div>
   );
}

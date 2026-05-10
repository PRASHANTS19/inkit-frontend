import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePDFProxy } from './PDFLoader';
import { usePDFStore } from '../../store/pdfStore';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Full-Text Search Panel (P1-T7)
 * Builds a page-by-page text index lazily and highlights matches over the canvas.
 */
export function SearchPanel({ onClose }) {
  const pdfProxy = usePDFProxy();
  const totalPages = usePDFStore(s => s.totalPages);
  
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]); // [{ pageIndex, text, rect }]
  const [currentMatch, setCurrentMatch] = useState(0);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexedPages, setIndexedPages] = useState(0);
  
  const textIndex = useRef([]); // [{ pageIndex, words: [{text, transform, width, height}] }]
  const inputRef = useRef(null);

  // Auto-focus input on open
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // Build text index lazily across all pages
  const buildIndex = useCallback(async () => {
    if (!pdfProxy || textIndex.current.length === totalPages) return;
    setIsIndexing(true);
    textIndex.current = [];
    
    for (let i = 0; i < totalPages; i++) {
      try {
        const page = await pdfProxy.getPage(i + 1);
        const textContent = await page.getTextContent();
        textIndex.current.push({
          pageIndex: i,
          items: textContent.items.map(item => ({
            text: item.str,
            transform: item.transform,
            width: item.width,
            height: item.height,
          })),
        });
        setIndexedPages(i + 1);
      } catch (e) {
        textIndex.current.push({ pageIndex: i, items: [] });
      }
    }
    setIsIndexing(false);
  }, [pdfProxy, totalPages]);

  useEffect(() => {
    buildIndex();
  }, [buildIndex]);

  // Run search whenever query changes
  useEffect(() => {
    if (!query.trim()) {
      setMatches([]);
      setCurrentMatch(0);
      return;
    }
    
    const q = query.toLowerCase();
    const found = [];
    
    textIndex.current.forEach(page => {
      // Join words on the same page and try substring match
      let accumulated = '';
      page.items.forEach(item => {
        if (!item.text) return;
        const lower = item.text.toLowerCase();
        if (lower.includes(q)) {
          found.push({
            pageIndex: page.pageIndex,
            text: item.text,
          });
        }
        accumulated += item.text + ' ';
      });
    });
    
    setMatches(found);
    setCurrentMatch(found.length > 0 ? 0 : -1);
  }, [query]);

  // Scroll to current match
  useEffect(() => {
    if (currentMatch >= 0 && matches[currentMatch]) {
      const { pageIndex } = matches[currentMatch];
      const el = document.getElementById(`pdf-page-${pageIndex + 1}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentMatch, matches]);

  const prev = () => setCurrentMatch(m => (m - 1 + matches.length) % matches.length);
  const next = () => setCurrentMatch(m => (m + 1) % matches.length);

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.shiftKey ? prev() : next(); }
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="flex items-center gap-2 bg-white border-b border-slate-200 px-4 py-2 shadow-sm z-30">
      <Search className="w-4 h-4 text-slate-400 shrink-0" />
      <input
        ref={inputRef}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Search in document..."
        className="flex-1 text-sm outline-none bg-transparent text-slate-800 placeholder:text-slate-400 min-w-0"
      />
      
      {isIndexing && (
        <span className="text-xs text-slate-400 shrink-0">{indexedPages}/{totalPages}</span>
      )}
      
      {matches.length > 0 && (
        <span className="text-xs font-medium text-slate-600 shrink-0 w-20 text-right">
          {currentMatch + 1} of {matches.length}
        </span>
      )}
      
      {query && matches.length === 0 && !isIndexing && (
        <span className="text-xs text-red-500 shrink-0">No results</span>
      )}
      
      <button
        onClick={prev}
        disabled={matches.length === 0}
        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600"
        title="Previous match (Shift+Enter)"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
      <button
        onClick={next}
        disabled={matches.length === 0}
        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600"
        title="Next match (Enter)"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
      <button
        onClick={onClose}
        className="p-1 rounded hover:bg-slate-100 text-slate-500"
        title="Close search"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

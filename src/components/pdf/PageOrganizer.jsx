import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { usePDFProxy } from './PDFLoader';
import { usePDFStore } from '../../store/pdfStore';
import {
  RotateCcw,
  RotateCw,
  Trash2,
  Download,
  ArrowUp,
  ArrowDown,
  X,
  Layers,
  GripVertical,
  AlertTriangle,
} from 'lucide-react';

/**
 * PageOrganizer (P3-T1 through P3-T5)
 *
 * Modal panel for visual page management:
 *  - Reorder pages (move up / down)
 *  - Rotate individual pages (90° CW / CCW)
 *  - Delete pages
 *  - Download the modified PDF (all operations baked via pdf-lib)
 *
 * The component works client-side only using the original document URL.
 */
export function PageOrganizer({ documentUrl, documentTitle, onClose }) {
  const pdfProxy = usePDFProxy();
  const totalPages = usePDFStore(s => s.totalPages);

  // pageOrder[i] = { originalIndex, rotation }
  const [pageOrder, setPageOrder] = useState([]);
  const [thumbnails, setThumbnails] = useState({}); // { originalIndex: dataURL }
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('');
  const [error, setError] = useState(null);

  // Initialise order from current page count
  useEffect(() => {
    if (totalPages > 0 && pageOrder.length === 0) {
      setPageOrder(
        Array.from({ length: totalPages }, (_, i) => ({ originalIndex: i, rotation: 0 }))
      );
    }
  }, [totalPages, pageOrder.length]);

  // Render thumbnails
  useEffect(() => {
    if (!pdfProxy || pageOrder.length === 0) return;
    let active = true;

    const renderThumb = async (origIdx) => {
      if (thumbnails[origIdx]) return;
      try {
        const page = await pdfProxy.getPage(origIdx + 1);
        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = document.createElement('canvas');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: page.getViewport({ scale: 0.25 * dpr }) }).promise;
        if (active) {
          setThumbnails(prev => ({ ...prev, [origIdx]: canvas.toDataURL('image/jpeg', 0.6) }));
        }
      } catch (e) { /* skip */ }
    };

    pageOrder.forEach(({ originalIndex }) => renderThumb(originalIndex));
    return () => { active = false; };
  }, [pdfProxy, pageOrder]);

  // ── Page operations ────────────────────────────────────────────────────────
  const rotateAt = (listIdx, dir) => {
    setPageOrder(prev => prev.map((p, i) =>
      i === listIdx
        ? { ...p, rotation: ((p.rotation + dir + 360) % 360) }
        : p
    ));
  };

  const deleteAt = (listIdx) => {
    setPageOrder(prev => prev.filter((_, i) => i !== listIdx));
  };

  const moveUp = (listIdx) => {
    if (listIdx === 0) return;
    setPageOrder(prev => {
      const next = [...prev];
      [next[listIdx - 1], next[listIdx]] = [next[listIdx], next[listIdx - 1]];
      return next;
    });
  };

  const moveDown = (listIdx) => {
    setPageOrder(prev => {
      if (listIdx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[listIdx], next[listIdx + 1]] = [next[listIdx + 1], next[listIdx]];
      return next;
    });
  };

  // ── Build and download the modified PDF using pdf-lib ─────────────────────
  const handleDownload = useCallback(async () => {
    if (!documentUrl) { setError('Document URL not available.'); return; }
    setIsProcessing(true);
    setError(null);

    try {
      setProcessingLabel('Fetching document…');
      const response = await fetch(documentUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const srcBytes = await response.arrayBuffer();

      setProcessingLabel('Loading PDF…');
      const srcPdf = await PDFDocument.load(srcBytes);

      setProcessingLabel('Building modified PDF…');
      const newPdf = await PDFDocument.create();

      for (const { originalIndex, rotation } of pageOrder) {
        const [copiedPage] = await newPdf.copyPages(srcPdf, [originalIndex]);
        if (rotation !== 0) {
          const existing = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees((existing + rotation) % 360));
        }
        newPdf.addPage(copiedPage);
      }

      setProcessingLabel('Saving PDF…');
      const newBytes = await newPdf.save();
      const blob = new Blob([newBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentTitle || 'document'}_edited.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError(`Failed to process PDF: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingLabel('');
    }
  }, [documentUrl, documentTitle, pageOrder]);

  const deletedCount = totalPages - pageOrder.length;
  const hasChanges = pageOrder.some((p, i) => p.originalIndex !== i || p.rotation !== 0) || deletedCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[min(900px,95vw)] max-h-[88vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Page Organizer</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {pageOrder.length} of {totalPages} pages
                {deletedCount > 0 && <span className="text-red-500 ml-1">({deletedCount} deleted)</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                onClick={handleDownload}
                disabled={isProcessing || pageOrder.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                <Download className="w-4 h-4" />
                {isProcessing ? processingLabel : 'Download Modified PDF'}
              </button>
            )}
            {!hasChanges && (
              <button
                onClick={handleDownload}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-60 transition-colors"
              >
                <Download className="w-4 h-4" />
                {isProcessing ? processingLabel : 'Download PDF'}
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Legend */}
        <div className="px-6 pt-3 pb-1 shrink-0">
          <p className="text-xs text-slate-400">
            Rotate, delete, or reorder pages using the controls on each card. Changes are applied when you download.
          </p>
        </div>

        {/* Page Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {pageOrder.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <AlertTriangle className="w-10 h-10 mb-2" />
              <p className="text-sm">All pages deleted. Add pages back or close.</p>
              <button
                className="mt-3 text-xs text-blue-500 hover:underline"
                onClick={() => setPageOrder(Array.from({ length: totalPages }, (_, i) => ({ originalIndex: i, rotation: 0 })))}
              >
                Reset to original
              </button>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
              {pageOrder.map((page, listIdx) => (
                <PageCard
                  key={`${page.originalIndex}-${listIdx}`}
                  page={page}
                  listIdx={listIdx}
                  totalInList={pageOrder.length}
                  thumbnail={thumbnails[page.originalIndex]}
                  onRotateCCW={() => rotateAt(listIdx, -90)}
                  onRotateCW={() => rotateAt(listIdx, 90)}
                  onDelete={() => deleteAt(listIdx)}
                  onMoveUp={() => moveUp(listIdx)}
                  onMoveDown={() => moveDown(listIdx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center gap-4 text-xs text-slate-500">
          <span>{pageOrder.length} pages</span>
          {deletedCount > 0 && <span className="text-red-500">{deletedCount} deleted</span>}
          {pageOrder.some(p => p.rotation !== 0) && (
            <span className="text-amber-600">{pageOrder.filter(p => p.rotation !== 0).length} rotated</span>
          )}
          {hasChanges && <span className="ml-auto text-blue-600 font-medium">Unsaved changes — download to apply</span>}
        </div>
      </div>
    </div>
  );
}

// ── Page Card ─────────────────────────────────────────────────────────────────
function PageCard({ page, listIdx, totalInList, thumbnail, onRotateCCW, onRotateCW, onDelete, onMoveUp, onMoveDown }) {
  const isRotated = page.rotation !== 0;

  return (
    <div className="group relative bg-slate-50 border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-md transition-all flex flex-col">
      {/* Thumbnail area */}
      <div className="relative bg-slate-100 flex items-center justify-center overflow-hidden" style={{ height: 200 }}>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={`Page ${page.originalIndex + 1}`}
            className="max-h-full max-w-full object-contain transition-transform duration-300"
            style={{ transform: `rotate(${page.rotation}deg)` }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin mb-1" />
            <span className="text-xs">Loading…</span>
          </div>
        )}

        {/* Action overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
          <ActionBtn onClick={onRotateCCW} title="Rotate CCW"><RotateCcw className="w-4 h-4" /></ActionBtn>
          <ActionBtn onClick={onRotateCW} title="Rotate CW"><RotateCw className="w-4 h-4" /></ActionBtn>
          <ActionBtn onClick={onDelete} title="Delete page" danger><Trash2 className="w-4 h-4" /></ActionBtn>
        </div>

        {isRotated && (
          <div className="absolute top-1 right-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded font-medium">
            {page.rotation}°
          </div>
        )}
      </div>

      {/* Page label & reorder controls */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-white border-t border-slate-100">
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={onMoveUp}
            disabled={listIdx === 0}
            className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-25 hover:text-slate-700 transition-colors"
            title="Move page up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={listIdx === totalInList - 1}
            className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-25 hover:text-slate-700 transition-colors"
            title="Move page down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-xs font-medium text-slate-600">
          p.{page.originalIndex + 1}
        </span>
        <GripVertical className="w-3.5 h-3.5 text-slate-300" />
      </div>
    </div>
  );
}

function ActionBtn({ onClick, title, danger = false, children }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      title={title}
      className={`p-1.5 rounded-full backdrop-blur-sm transition-colors shadow-sm ${
        danger
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-white/90 text-slate-700 hover:bg-white'
      }`}
    >
      {children}
    </button>
  );
}

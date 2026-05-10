import React, { useState, useCallback } from 'react';
import { usePDFProxy } from './PDFLoader';
import { usePDFStore } from '../../store/pdfStore';
import { X, Image, Download, Loader2 } from 'lucide-react';

/**
 * ExportImageModal (P5-T1)
 *
 * Renders each PDF page to a canvas via PDF.js and downloads as:
 *   - Single PNG/JPG (for current page)
 *   - ZIP archive of all pages (using JSZip if available, otherwise sequential downloads)
 *
 * Props:
 *   onClose()  – called when modal is dismissed
 *   documentTitle – used for file naming
 */

export function ExportImageModal({ onClose, documentTitle }) {
  const pdfProxy = usePDFProxy();
  const totalPages = usePDFStore(s => s.totalPages);
  const currentPage = usePDFStore(s => s.currentPage);

  const [format, setFormat]         = useState('png');      // 'png' | 'jpg'
  const [jpgQuality, setJpgQuality] = useState(0.92);
  const [pageRange, setPageRange]   = useState('all');       // 'all' | 'current' | 'custom'
  const [customFrom, setCustomFrom] = useState(1);
  const [customTo, setCustomTo]     = useState(totalPages || 1);
  const [scale, setScale]           = useState(2);           // 1x, 1.5x, 2x
  const [status, setStatus]         = useState('idle');      // 'idle' | 'rendering' | 'done' | 'error'
  const [progress, setProgress]     = useState(0);
  const [errorMsg, setErrorMsg]     = useState('');

  const getPageIndices = useCallback(() => {
    if (pageRange === 'current') return [currentPage - 1];
    if (pageRange === 'custom') {
      const from = Math.max(1, Math.min(customFrom, totalPages));
      const to   = Math.max(from, Math.min(customTo, totalPages));
      return Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i);
    }
    // 'all'
    return Array.from({ length: totalPages }, (_, i) => i);
  }, [pageRange, currentPage, customFrom, customTo, totalPages]);

  /** Render a single page to a Blob of the chosen format */
  const renderPageToBlob = useCallback(async (pageNum1Based) => {
    const page = await pdfProxy.getPage(pageNum1Based);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width  = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    // White background for JPG (canvas is transparent by default)
    if (format === 'jpg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({ canvasContext: ctx, viewport }).promise;

    return new Promise(resolve => {
      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const quality = format === 'jpg' ? jpgQuality : undefined;
      canvas.toBlob(resolve, mime, quality);
    });
  }, [pdfProxy, scale, format, jpgQuality]);

  const handleExport = useCallback(async () => {
    if (!pdfProxy) {
      setErrorMsg('PDF not loaded yet. Please wait.');
      setStatus('error');
      return;
    }

    const indices = getPageIndices();
    setStatus('rendering');
    setProgress(0);
    setErrorMsg('');

    try {
      const ext = format === 'jpg' ? 'jpg' : 'png';
      const baseName = (documentTitle || 'document').replace(/[^a-z0-9_\-]/gi, '_');

      if (indices.length === 1) {
        // Single page — direct download
        const blob = await renderPageToBlob(indices[0] + 1);
        setProgress(100);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}_page${indices[0] + 1}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        setStatus('done');
        return;
      }

      // Multi-page — try JSZip, fall back to sequential downloads
      let JSZip;
      try {
        const module = await import('jszip');
        JSZip = module.default;
      } catch {
        JSZip = null;
      }

      if (JSZip) {
        const zip = new JSZip();
        for (let i = 0; i < indices.length; i++) {
          const pageNum = indices[i] + 1;
          const blob = await renderPageToBlob(pageNum);
          const paddedNum = String(pageNum).padStart(4, '0');
          zip.file(`${baseName}_page${paddedNum}.${ext}`, blob);
          setProgress(Math.round(((i + 1) / indices.length) * 90));
        }
        setProgress(95);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}_pages.zip`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Fallback: sequential individual file downloads
        for (let i = 0; i < indices.length; i++) {
          const pageNum = indices[i] + 1;
          const blob = await renderPageToBlob(pageNum);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${baseName}_page${pageNum}.${ext}`;
          a.click();
          URL.revokeObjectURL(url);
          setProgress(Math.round(((i + 1) / indices.length) * 100));
          // Small delay between downloads to avoid browser blocking
          await new Promise(r => setTimeout(r, 150));
        }
      }

      setProgress(100);
      setStatus('done');
    } catch (err) {
      console.error('ExportImageModal error:', err);
      setErrorMsg(err.message || 'Unknown error');
      setStatus('error');
    }
  }, [pdfProxy, getPageIndices, renderPageToBlob, format, documentTitle]);

  const pageCount = getPageIndices().length;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-[420px] max-w-[95vw] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
              <Image className="w-4 h-4 text-cyan-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 text-sm">Export as Images</h2>
              <p className="text-[11px] text-slate-400">{totalPages} pages in document</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Format */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Image Format</label>
            <div className="flex gap-2">
              {['png', 'jpg'].map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                    format === f
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            {format === 'jpg' && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">Quality</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {Math.round(jpgQuality * 100)}%
                  </span>
                </div>
                <input
                  type="range" min={0.5} max={1} step={0.01}
                  value={jpgQuality}
                  onChange={e => setJpgQuality(parseFloat(e.target.value))}
                  className="w-full accent-cyan-600"
                />
              </div>
            )}
          </div>

          {/* Resolution */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Resolution Scale</label>
            <div className="flex gap-2">
              {[
                { value: 1,   label: '1×', hint: '72 dpi' },
                { value: 1.5, label: '1.5×', hint: '108 dpi' },
                { value: 2,   label: '2×', hint: '144 dpi' },
                { value: 3,   label: '3×', hint: '216 dpi' },
              ].map(s => (
                <button
                  key={s.value}
                  onClick={() => setScale(s.value)}
                  className={`flex-1 py-2 flex flex-col items-center rounded-lg border text-xs transition-all ${
                    scale === s.value
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="font-semibold">{s.label}</span>
                  <span className="text-[10px] opacity-60 mt-0.5">{s.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Page Range */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Page Range</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all',     label: `All (${totalPages})` },
                { value: 'current', label: `Current (p.${currentPage})` },
                { value: 'custom',  label: 'Custom' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPageRange(opt.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    pageRange === opt.value
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {pageRange === 'custom' && (
              <div className="flex items-center gap-2 mt-3">
                <label className="text-xs text-slate-500 shrink-0">Pages</label>
                <input
                  type="number" min={1} max={totalPages}
                  value={customFrom}
                  onChange={e => setCustomFrom(parseInt(e.target.value) || 1)}
                  className="w-16 text-center border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-cyan-400"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="number" min={1} max={totalPages}
                  value={customTo}
                  onChange={e => setCustomTo(parseInt(e.target.value) || totalPages)}
                  className="w-16 text-center border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-cyan-400"
                />
                <span className="text-xs text-slate-400">of {totalPages}</span>
              </div>
            )}
          </div>

          {/* Progress */}
          {status === 'rendering' && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Loader2 className="w-3.5 h-3.5 text-cyan-600 animate-spin" />
                <span className="text-xs text-slate-600">Rendering pages… {progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 font-medium">
              ✅ {pageCount === 1 ? 'Page exported' : `${pageCount} pages exported`} successfully!
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
              <span className="font-semibold">Export failed:</span> {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            {pageCount} page{pageCount !== 1 ? 's' : ''} · {format.toUpperCase()} · {scale}×
            {pageCount > 1 ? ' · ZIP archive' : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {status === 'done' ? 'Close' : 'Cancel'}
            </button>
            <button
              onClick={handleExport}
              disabled={status === 'rendering'}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {status === 'rendering' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {status === 'rendering' ? 'Exporting…' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useCallback, useRef } from 'react';
import { usePDFProxy } from './PDFLoader';
import { usePDFStore } from '../../store/pdfStore';
import { useAuditStore } from '../../store/auditStore';
import { ScanText, Copy, Check, Loader2, ChevronDown, AlertTriangle } from 'lucide-react';

/**
 * OcrPanel (P6-T1)
 *
 * Right-panel "OCR" tab. Uses Tesseract.js (dynamic import) to extract text
 * from any rendered PDF page. The WASM module + language data (~10 MB) is
 * downloaded on first use and then cached by the browser.
 *
 * Props:
 *   documentId  – current document ID (for audit logging)
 */

const LANG_OPTIONS = [
  { value: 'eng', label: 'English' },
  { value: 'fra', label: 'French' },
  { value: 'spa', label: 'Spanish' },
  { value: 'deu', label: 'German' },
  { value: 'por', label: 'Portuguese' },
];

export function OcrPanel({ documentId }) {
  const pdfProxy = usePDFProxy();
  const totalPages = usePDFStore(s => s.totalPages);
  const currentPage = usePDFStore(s => s.currentPage);
  const addLog = useAuditStore(s => s.addLog);

  const [targetPage, setTargetPage] = useState(currentPage || 1);
  const [language, setLanguage] = useState('eng');
  const [status, setStatus]   = useState('idle');   // 'idle'|'rendering'|'recognizing'|'done'|'error'
  const [progress, setProgress] = useState(0);
  const [ocrText, setOcrText]   = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied]   = useState(false);
  const workerRef = useRef(null);

  const handleRun = useCallback(async () => {
    if (!pdfProxy) {
      setErrorMsg('PDF not loaded yet.');
      setStatus('error');
      return;
    }

    setStatus('rendering');
    setProgress(0);
    setOcrText('');
    setErrorMsg('');

    try {
      // Step 1: Render page to canvas
      const page = await pdfProxy.getPage(targetPage);
      const viewport = page.getViewport({ scale: 2 }); // 2× for better OCR accuracy
      const canvas = document.createElement('canvas');
      canvas.width  = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      setProgress(15);
      setStatus('recognizing');

      // Step 2: Dynamically import Tesseract.js
      const { createWorker } = await import('tesseract.js');

      // Tear down previous worker if any
      if (workerRef.current) {
        try { await workerRef.current.terminate(); } catch { /* ignore */ }
      }

      const worker = await createWorker(language, 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(15 + Math.round(m.progress * 80));
          }
        },
      });
      workerRef.current = worker;

      setProgress(20);

      const { data: { text } } = await worker.recognize(canvas);
      await worker.terminate();
      workerRef.current = null;

      setOcrText(text.trim() || '(No text detected — try a higher resolution scan)');
      setProgress(100);
      setStatus('done');

      addLog(documentId, 'search',
        `OCR extracted text from page ${targetPage} (lang: ${language})`);
    } catch (err) {
      console.error('OCR error:', err);
      setErrorMsg(err.message || 'OCR failed. Make sure tesseract.js is installed.');
      setStatus('error');
    }
  }, [pdfProxy, targetPage, language, documentId, addLog]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(ocrText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [ocrText]);

  const isRunning = status === 'rendering' || status === 'recognizing';

  // Status label
  const statusLabel = {
    rendering:   'Rendering page…',
    recognizing: 'Recognizing text…',
  }[status] || '';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <ScanText className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">OCR Text Extraction</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Powered by Tesseract.js (client-side)</p>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-2">
          {/* Page selector */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-500 w-12 shrink-0">Page</label>
            <input
              type="number"
              min={1}
              max={totalPages || 1}
              value={targetPage}
              onChange={e => setTargetPage(Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1)))}
              className="w-16 text-center border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-400"
            />
            <span className="text-[10px] text-slate-400">of {totalPages}</span>
            <button
              onClick={() => setTargetPage(currentPage)}
              className="ml-auto text-[10px] text-emerald-600 hover:underline"
            >
              Use current
            </button>
          </div>

          {/* Language selector */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-500 w-12 shrink-0">Lang</label>
            <div className="relative flex-1">
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full appearance-none border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-400 pr-6 bg-white"
              >
                {LANG_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isRunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ScanText className="w-3.5 h-3.5" />
          )}
          {isRunning ? statusLabel : 'Run OCR'}
        </button>

        {/* Progress bar */}
        {isRunning && (
          <div className="mt-2">
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 text-right">{progress}%</p>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 flex flex-col overflow-hidden p-3">
        {status === 'error' && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-2.5 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-700">OCR Failed</p>
              <p className="text-[11px] text-red-600 mt-0.5">{errorMsg}</p>
              {errorMsg.includes('tesseract') && (
                <p className="text-[10px] text-red-500 mt-1 font-mono">
                  Run: pnpm add tesseract.js
                </p>
              )}
            </div>
          </div>
        )}

        {status === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <ScanText className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-xs text-slate-400 font-medium">No results yet</p>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed max-w-[180px]">
              Select a page and language, then click Run OCR
            </p>
          </div>
        )}

        {(status === 'done' || ocrText) && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Copy header */}
            <div className="flex items-center justify-between mb-2 shrink-0">
              <span className="text-[11px] font-semibold text-slate-500">
                Extracted Text — Page {targetPage}
              </span>
              <button
                onClick={handleCopy}
                disabled={!ocrText}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-600 transition-colors disabled:opacity-30"
              >
                {copied ? (
                  <><Check className="w-3 h-3 text-emerald-500" /> Copied</>
                ) : (
                  <><Copy className="w-3 h-3" /> Copy</>
                )}
              </button>
            </div>

            {/* Text area */}
            <textarea
              readOnly
              value={ocrText}
              className="flex-1 resize-none border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 leading-relaxed focus:outline-none focus:border-emerald-400 bg-slate-50 font-mono"
              placeholder="OCR output will appear here…"
            />

            <p className="text-[10px] text-slate-300 mt-1.5 text-right">
              {ocrText.split(/\s+/).filter(Boolean).length} words · {ocrText.length} chars
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

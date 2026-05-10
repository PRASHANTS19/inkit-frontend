import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Layers, ArrowUp, ArrowDown, Trash2, Download, Upload, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MergePDFModal({ onClose }) {
  const [files, setFiles] = useState([]); // Array of { id, file, name, status }
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
    if (selectedFiles.length === 0) return;
    
    const newItems = selectedFiles.map(f => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      name: f.name,
      size: (f.size / 1024 / 1024).toFixed(2) + ' MB'
    }));
    
    setFiles(prev => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    setFiles(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx) => {
    setFiles(prev => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    setError(null);
    try {
      setProgress('Creating new document...');
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        setProgress(`Merging document ${i + 1} of ${files.length}...`);
        const item = files[i];
        const arrayBuffer = await item.file.arrayBuffer();
        const srcDoc = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach(p => mergedPdf.addPage(p));
      }

      setProgress('Saving...');
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Merged_Document_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Failed to merge PDFs: ' + err.message);
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Merge PDFs</h2>
              <p className="text-xs text-slate-500">Combine multiple PDF files into one</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center hover:bg-slate-50 hover:border-indigo-400 transition-colors cursor-pointer"
          >
            <Upload className="w-8 h-8 text-slate-400 mb-3" />
            <p className="text-sm font-medium text-slate-700">Click to add PDF files</p>
            <p className="text-xs text-slate-500 mt-1">Select 2 or more files to merge</p>
            <input
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          {files.length > 0 && (
            <div className="mt-2 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Files to merge (In order)</p>
              {files.map((file, idx) => (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <div className="flex flex-col gap-1 shrink-0 bg-slate-50 rounded">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveUp(idx); }}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveDown(idx); }}
                      disabled={idx === files.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{file.size}</p>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between mt-auto">
          <div className="text-sm font-medium text-indigo-600">
            {isProcessing && progress}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleMerge}
              disabled={files.length < 2 || isProcessing}
              className="bg-indigo-600 hover:bg-indigo-700 min-w-32"
            >
              {isProcessing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Merge & Download'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { FileUp, Minus, Plus, Search, Sidebar } from 'lucide-react';
import { PDFLoader } from './PDFLoader';
import { VirtualPageList } from './VirtualPageList';
import { usePDFStore } from '../../store/pdfStore';
import { Button } from '../ui/button';

export function PDFViewer() {
  return (
    <div className="flex flex-col h-full w-full bg-zinc-100 overflow-hidden">
      <PDFViewerHeader />
      <div className="flex-1 overflow-hidden relative">
        <PDFWorkspace />
      </div>
    </div>
  );
}

function PDFViewerHeader() {
  const zoomLevel = usePDFStore(state => state.zoomLevel);
  const setZoomLevel = usePDFStore(state => state.setZoomLevel);
  const totalPages = usePDFStore(state => state.totalPages);
  const currentPage = usePDFStore(state => state.currentPage);

  const handleZoomIn = () => setZoomLevel(zoomLevel + 0.1);
  const handleZoomOut = () => setZoomLevel(zoomLevel - 0.1);

  return (
    <header className="flex h-14 items-center justify-between border-b px-4 bg-white shrink-0 z-20 shadow-sm">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Sidebar className="h-4 w-4" />
        </Button>
        <span className="font-medium text-sm border-l pl-4 ml-2">PDF Viewer</span>
      </div>

      <div className="flex items-center gap-2 bg-zinc-100 rounded-md p-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-xs font-medium w-12 text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        {totalPages > 0 && (
          <span className="text-sm font-medium text-zinc-500">
            {currentPage} / {totalPages}
          </span>
        )}
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Search className="h-4 w-4" />
          <span>Find</span>
        </Button>
      </div>
    </header>
  );
}

function PDFWorkspace() {
  const [file, setFile] = useState(null);

  const onFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
    }
  };

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full gap-4">
        <div className="p-8 border-2 border-dashed border-zinc-300 rounded-xl bg-white w-96 text-center shadow-sm">
          <FileUp className="h-10 w-10 text-zinc-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 mb-1">Upload PDF Document</h3>
          <p className="text-sm text-zinc-500 mb-6">Select a local PDF to view and test the editor.</p>
          
          <label className="cursor-pointer">
            <span className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow transition-colors hover:bg-zinc-900/90 w-full">
              Browse Files
            </span>
            <input 
              type="file" 
              accept=".pdf,application/pdf" 
              className="hidden" 
              onChange={onFileChange} 
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50">
      <PDFLoader file={file}>
        <VirtualPageList />
      </PDFLoader>
    </div>
  );
}

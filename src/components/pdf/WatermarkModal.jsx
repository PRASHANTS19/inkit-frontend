import React, { useState } from 'react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { Type, AlertTriangle, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function WatermarkModal({ documentUrl, documentTitle, onClose }) {
  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.3);
  const [color, setColor] = useState('#FF0000');
  const [size, setSize] = useState(60);
  const [isDiagonal, setIsDiagonal] = useState(true);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);

  const handleApply = async () => {
    if (!text) return;
    setIsProcessing(true);
    setError(null);
    try {
      setProgress('Fetching PDF...');
      const response = await fetch(documentUrl);
      if (!response.ok) throw new Error("Could not fetch document");
      const arrayBuffer = await response.arrayBuffer();
      
      setProgress('Applying watermark...');
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const r = parseInt(color.slice(1, 3), 16) / 255;
      const g = parseInt(color.slice(3, 5), 16) / 255;
      const b = parseInt(color.slice(5, 7), 16) / 255;
      
      const pages = pdfDoc.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();
        
        const textSize = size;
        const textWidth = font.widthOfTextAtSize(text, textSize);
        const textHeight = font.heightAtSize(textSize);

        page.drawText(text, {
          x: width / 2 - textWidth / 2,
          y: height / 2 - textHeight / 2,
          size: textSize,
          font: font,
          color: rgb(r, g, b),
          opacity: opacity,
          rotate: isDiagonal ? degrees(45) : degrees(0),
        });
      }

      setProgress('Saving...');
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Watermarked_${documentTitle || 'document'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to watermark: ' + err.message);
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-50 rounded-lg">
              <Type className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Add Watermark</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Watermark Text</label>
            <Input 
              value={text} 
              onChange={e => setText(e.target.value)} 
              placeholder="e.g. CONFIDENTIAL"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Text Color</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={color} 
                  onChange={e => setColor(e.target.value)} 
                  className="w-8 h-8 rounded border-none p-0"
                />
                <Input value={color.toUpperCase()} readOnly className="flex-1 font-mono text-xs cursor-default" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Font Size</label>
              <Input 
                type="number" 
                value={size} 
                onChange={e => setSize(Number(e.target.value))} 
                min={10} 
                max={200}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Opacity ({Math.round(opacity * 100)}%)</label>
            <input 
              type="range" 
              min="0.05" 
              max="1" 
              step="0.05" 
              value={opacity} 
              onChange={e => setOpacity(Number(e.target.value))} 
              className="w-full accent-pink-600"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-2 text-sm text-slate-700">
            <input 
              type="checkbox" 
              checked={isDiagonal} 
              onChange={e => setIsDiagonal(e.target.checked)} 
              className="rounded accent-pink-600 text-pink-600"
            />
            Diagonal Text (45°)
          </label>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs font-medium text-pink-600">
            {isProcessing && progress}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={isProcessing || !text}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

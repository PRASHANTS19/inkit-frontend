import React, { useState, useRef, useEffect, useCallback } from 'react';
import SignaturePad from 'signature_pad';
import { useSignatureStore } from '../../store/signatureStore';
import { useAnnotationStore } from '../../store/annotationStore';
import { 
  X, 
  Pen, 
  Type, 
  Upload, 
  Trash2, 
  Check,
  RotateCcw,
} from 'lucide-react';

/**
 * SignatureModal (P4-T4)
 * 
 * Full modal for creating visual signatures via three methods:
 *   - Draw: HTML5 Canvas with signature_pad
 *   - Type: Text input with cursive font selection
 *   - Upload: File picker with white background removal
 * 
 * Also shows a library of previously saved signatures.
 */

const SIGNATURE_FONTS = [
  { name: 'Dancing Script', css: "'Dancing Script', cursive" },
  { name: 'Great Vibes', css: "'Great Vibes', cursive" },
  { name: 'Satisfy', css: "'Satisfy', cursive" },
  { name: 'Pacifico', css: "'Pacifico', cursive" },
];

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Satisfy&family=Pacifico&display=swap';

export function SignatureModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('draw'); // 'draw' | 'type' | 'upload' | 'library'
  const addSignature = useSignatureStore(s => s.addSignature);
  const savedSignatures = useSignatureStore(s => s.savedSignatures);
  const setActiveSignature = useSignatureStore(s => s.setActiveSignature);
  const removeSignature = useSignatureStore(s => s.removeSignature);
  const setActiveTool = useAnnotationStore(s => s.setActiveTool);

  // Load Google Fonts for typed signatures
  useEffect(() => {
    if (!document.querySelector(`link[href*="Dancing+Script"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = FONT_LINK;
      document.head.appendChild(link);
    }
  }, []);

  const handleUseSignature = useCallback((dataUrl, name) => {
    const sig = addSignature(name, dataUrl);
    setActiveSignature(sig);
    setActiveTool('signature');
    onClose();
  }, [addSignature, setActiveSignature, setActiveTool, onClose]);

  const handleSelectFromLibrary = useCallback((sig) => {
    setActiveSignature(sig);
    setActiveTool('signature');
    onClose();
  }, [setActiveSignature, setActiveTool, onClose]);

  const tabs = [
    { id: 'draw', label: 'Draw', icon: Pen },
    { id: 'type', label: 'Type', icon: Type },
    { id: 'upload', label: 'Upload', icon: Upload },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Create Signature</h2>
            <p className="text-xs text-slate-400 mt-0.5">Visual signature — not a legally binding digital signature</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-slate-100 px-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
          {savedSignatures.length > 0 && (
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ml-auto ${
                activeTab === 'library'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              Saved ({savedSignatures.length})
            </button>
          )}
        </div>

        {/* Tab content */}
        <div className="p-6 min-h-[280px]">
          {activeTab === 'draw' && <DrawTab onUse={handleUseSignature} />}
          {activeTab === 'type' && <TypeTab onUse={handleUseSignature} />}
          {activeTab === 'upload' && <UploadTab onUse={handleUseSignature} />}
          {activeTab === 'library' && (
            <LibraryTab
              signatures={savedSignatures}
              onSelect={handleSelectFromLibrary}
              onDelete={removeSignature}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── DRAW TAB ───────────────────────────────────────────────────────────────
function DrawTab({ onUse }) {
  const canvasRef = useRef(null);
  const padRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d').scale(ratio, ratio);

    const pad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: '#1e293b',
      minWidth: 1.5,
      maxWidth: 3.5,
    });

    pad.addEventListener('endStroke', () => {
      setIsEmpty(pad.isEmpty());
    });

    padRef.current = pad;

    return () => {
      pad.off();
    };
  }, []);

  const handleClear = () => {
    padRef.current?.clear();
    setIsEmpty(true);
  };

  const handleUse = () => {
    if (!padRef.current || padRef.current.isEmpty()) return;
    const dataUrl = padRef.current.toDataURL('image/png');
    onUse(dataUrl, 'Drawn Signature');
  };

  return (
    <div className="space-y-4">
      <div className="relative border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair"
          style={{ height: 180, touchAction: 'none' }}
        />
        <div className="absolute bottom-3 left-4 right-4 border-b border-slate-300/40" />
        <span className="absolute bottom-1 right-4 text-[10px] text-slate-300">Sign above the line</span>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear
        </button>
        <button
          onClick={handleUse}
          disabled={isEmpty}
          className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <Check className="w-4 h-4" />
          Use Signature
        </button>
      </div>
    </div>
  );
}

// ── TYPE TAB ───────────────────────────────────────────────────────────────
function TypeTab({ onUse }) {
  const [text, setText] = useState('');
  const [selectedFont, setSelectedFont] = useState(0);
  const previewCanvasRef = useRef(null);

  const renderPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !text.trim()) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    
    const font = SIGNATURE_FONTS[selectedFont];
    const fontSize = Math.min(48, canvas.offsetWidth / (text.length * 0.7));
    ctx.font = `${fontSize}px ${font.css}`;
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.offsetWidth / 2, canvas.offsetHeight / 2);
  }, [text, selectedFont]);

  useEffect(() => {
    // Small delay to allow fonts to load
    const timer = setTimeout(renderPreview, 200);
    return () => clearTimeout(timer);
  }, [renderPreview]);

  const handleUse = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !text.trim()) return;

    // Re-render at high res for export
    const exportCanvas = document.createElement('canvas');
    const w = 600, h = 200;
    const dpr = 2;
    exportCanvas.width = w * dpr;
    exportCanvas.height = h * dpr;
    const ctx = exportCanvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    const font = SIGNATURE_FONTS[selectedFont];
    const fontSize = Math.min(72, w / (text.length * 0.6));
    ctx.font = `${fontSize}px ${font.css}`;
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);

    const dataUrl = exportCanvas.toDataURL('image/png');
    onUse(dataUrl, text);
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type your name..."
        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
        autoFocus
      />

      {/* Font selector */}
      <div className="flex gap-2 flex-wrap">
        {SIGNATURE_FONTS.map((font, i) => (
          <button
            key={font.name}
            onClick={() => setSelectedFont(i)}
            className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
              selectedFont === i
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                : 'border-slate-200 hover:border-slate-300'
            }`}
            style={{ fontFamily: font.css }}
          >
            {text || font.name}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="relative border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
        <canvas
          ref={previewCanvasRef}
          className="w-full"
          style={{ height: 120 }}
        />
        <div className="absolute bottom-3 left-4 right-4 border-b border-slate-300/40" />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleUse}
          disabled={!text.trim()}
          className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <Check className="w-4 h-4" />
          Use Signature
        </button>
      </div>
    </div>
  );
}

// ── UPLOAD TAB ─────────────────────────────────────────────────────────────
function UploadTab({ onUse }) {
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);

  const removeWhiteBackground = (imageData) => {
    const data = imageData.data;
    const threshold = 240; // Near-white threshold
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r > threshold && g > threshold && b > threshold) {
        data[i + 3] = 0; // Make transparent
      }
    }
    return imageData;
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a PNG or JPG image.');
      return;
    }

    setProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Remove white background
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const cleaned = removeWhiteBackground(imageData);
      ctx.putImageData(cleaned, 0, 0);

      const dataUrl = canvas.toDataURL('image/png');
      setPreview(dataUrl);
      setProcessing(false);
    };
    img.onerror = () => {
      alert('Failed to load image.');
      setProcessing(false);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleUse = () => {
    if (!preview) return;
    onUse(preview, 'Uploaded Signature');
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
          {processing ? (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <div className="h-6 w-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <span className="text-sm">Processing...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Upload className="w-8 h-8" />
              <span className="text-sm font-medium">Click to upload signature image</span>
              <span className="text-xs">PNG or JPG — white background will be auto-removed</span>
            </div>
          )}
          <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFile} />
        </label>
      ) : (
        <>
          <div className="flex items-center justify-center h-48 border-2 border-dashed border-slate-200 rounded-xl bg-[repeating-conic-gradient(#e2e8f0_0_25%,transparent_0_50%)_0_0/16px_16px]">
            <img src={preview} alt="Signature preview" className="max-h-40 max-w-full object-contain" />
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPreview(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Choose different
            </button>
            <button
              onClick={handleUse}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              Use Signature
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── LIBRARY TAB ────────────────────────────────────────────────────────────
function LibraryTab({ signatures, onSelect, onDelete }) {
  if (signatures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400">
        <Pen className="w-8 h-8 mb-2" />
        <p className="text-sm">No saved signatures yet</p>
        <p className="text-xs mt-1">Create one using Draw, Type, or Upload</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {signatures.map(sig => (
        <div
          key={sig.id}
          className="group relative border border-slate-200 rounded-xl p-3 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all"
          onClick={() => onSelect(sig)}
        >
          <div className="h-20 flex items-center justify-center bg-[repeating-conic-gradient(#f1f5f9_0_25%,transparent_0_50%)_0_0/12px_12px] rounded-lg mb-2">
            <img src={sig.dataUrl} alt={sig.name} className="max-h-16 max-w-full object-contain" />
          </div>
          <p className="text-xs text-slate-600 truncate">{sig.name}</p>
          <span className="text-[10px] text-slate-400">{new Date(sig.createdAt).toLocaleDateString()}</span>

          <button
            onClick={(e) => { e.stopPropagation(); onDelete(sig.id); }}
            className="absolute top-2 right-2 p-1 rounded bg-white/80 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm"
            title="Delete signature"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

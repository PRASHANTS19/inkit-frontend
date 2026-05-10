import React, { useState, useMemo } from 'react';
import { useAnnotationStore } from '../../store/annotationStore';
import {
  Highlighter,
  Pen,
  Type,
  Square,
  Trash2,
  Download,
  ChevronDown,
  ChevronRight,
  StickyNote,
  Filter,
  MessageSquare,
  PenTool,
} from 'lucide-react';

// ── Type metadata maps ────────────────────────────────────────────────────────
const TYPE_META = {
  highlight:  { label: 'Highlight',   icon: Highlighter, color: 'text-yellow-600 bg-yellow-50',  dot: '#f59e0b' },
  ink:        { label: 'Drawing',     icon: Pen,         color: 'text-red-600 bg-red-50',         dot: '#ef4444' },
  rect:       { label: 'Rectangle',   icon: Square,      color: 'text-blue-600 bg-blue-50',       dot: '#3b82f6' },
  note:       { label: 'Sticky Note', icon: StickyNote,  color: 'text-amber-600 bg-amber-50',     dot: '#f59e0b' },
  signature:  { label: 'Signature',   icon: PenTool,     color: 'text-indigo-600 bg-indigo-50',   dot: '#6366f1' },
};

/**
 * AnnotationSidebar (P2-T8)
 * 
 * Right panel listing ALL annotations for the document, grouped by page.
 * Supports: filter by type, delete, scroll-to-page, and export.
 */
export function AnnotationSidebar({ documentId }) {
  const allAnnotations = useAnnotationStore(s => s.getAnnotations(documentId));
  const deleteAnnotation = useAnnotationStore(s => s.deleteAnnotation);
  const undo = useAnnotationStore(s => s.undo);
  const undoStack = useAnnotationStore(s => s.undoStack);

  const [filterType, setFilterType] = useState('all');
  const [expandedPages, setExpandedPages] = useState(new Set());

  // Filter and group by page
  const filtered = useMemo(() => {
    return filterType === 'all'
      ? allAnnotations
      : allAnnotations.filter(a => a.type === filterType);
  }, [allAnnotations, filterType]);

  const byPage = useMemo(() => {
    const map = new Map();
    filtered.forEach(ann => {
      const pg = ann.pageIndex;
      if (!map.has(pg)) map.set(pg, []);
      map.get(pg).push(ann);
    });
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  const togglePage = (pg) => {
    setExpandedPages(prev => {
      const next = new Set(prev);
      next.has(pg) ? next.delete(pg) : next.add(pg);
      return next;
    });
  };

  const scrollToPage = (pageIndex) => {
    const el = document.getElementById(`pdf-page-${pageIndex + 1}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // ── Export as JSON (P2-T9 basic) ──────────────────────────────────────────
  const handleExportJSON = () => {
    const json = JSON.stringify(allAnnotations, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotations_${documentId || 'document'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Export as XFDF (P2-T9 basic) ─────────────────────────────────────────
  const handleExportXFDF = () => {
    const xfdf = buildXFDF(allAnnotations);
    const blob = new Blob([xfdf], { type: 'application/vnd.adobe.xfdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotations_${documentId || 'document'}.xfdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const typeFilters = ['all', 'highlight', 'ink', 'rect', 'note', 'signature'];

  return (
    <div className="flex flex-col h-full text-sm">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-800 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            Annotations
            <span className="ml-1 text-xs font-normal bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5">
              {allAnnotations.length}
            </span>
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={handleExportJSON}
              disabled={allAnnotations.length === 0}
              className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
              title="Export as JSON"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className="px-1.5 py-0.5 text-xs rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
              title="Undo last annotation"
            >
              Undo
            </button>
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex gap-1 flex-wrap">
          {typeFilters.map(t => {
            const meta = TYPE_META[t];
            return (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors border ${
                  filterType === t
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {meta ? meta.label : 'All'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {byPage.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <Filter className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-slate-400 text-xs">
              {allAnnotations.length === 0
                ? 'No annotations yet. Use the toolbar to add highlights, drawings, or notes.'
                : 'No annotations match this filter.'}
            </p>
          </div>
        ) : (
          byPage.map(([pageIndex, anns]) => {
            const isExpanded = expandedPages.has(pageIndex) || byPage.length === 1;
            return (
              <div key={pageIndex} className="border-b border-slate-100">
                {/* Page group header */}
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
                  onClick={() => togglePage(pageIndex)}
                >
                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <span>Page {pageIndex + 1}</span>
                  <span className="ml-auto text-slate-400 font-normal">{anns.length}</span>
                </button>

                {/* Annotation items within this page */}
                {isExpanded && anns.map(ann => (
                  <AnnotationRow
                    key={ann.id}
                    ann={ann}
                    onScrollTo={() => scrollToPage(pageIndex)}
                    onDelete={() => deleteAnnotation(documentId, ann.id)}
                  />
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Export footer */}
      {allAnnotations.length > 0 && (
        <div className="p-2 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-1">
          <button
            onClick={handleExportJSON}
            className="flex-1 py-1.5 text-xs font-medium rounded border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 transition-colors"
          >
            Export JSON
          </button>
          <button
            onClick={handleExportXFDF}
            className="flex-1 py-1.5 text-xs font-medium rounded border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 transition-colors"
          >
            Export XFDF
          </button>
        </div>
      )}
    </div>
  );
}

// ── Annotation row ─────────────────────────────────────────────────────────────
function AnnotationRow({ ann, onScrollTo, onDelete }) {
  const meta = TYPE_META[ann.type] || { label: ann.type, icon: Square, color: 'text-slate-500 bg-slate-50', dot: '#94a3b8' };
  const Icon = meta.icon;

  const preview = ann.content
    ? ann.content.slice(0, 60)
    : ann.type === 'ink'
    ? `${ann.points?.length ?? 0} points`
    : ann.type === 'highlight' || ann.type === 'rect'
    ? `${Math.round(ann.rect?.w ?? 0)}×${Math.round(ann.rect?.h ?? 0)}px`
    : '';

  const time = ann.createdAt
    ? new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      className="group flex items-start gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
      onClick={onScrollTo}
    >
      <span className={`mt-0.5 p-1 rounded ${meta.color} shrink-0`}>
        <Icon className="w-3 h-3" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-slate-700">{meta.label}</span>
          {time && <span className="text-xs text-slate-400 ml-auto">{time}</span>}
        </div>
        {preview && (
          <p className="text-xs text-slate-500 truncate mt-0.5">{preview}</p>
        )}
      </div>
      <button
        className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
        onClick={e => { e.stopPropagation(); onDelete(); }}
        title="Delete annotation"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── XFDF Builder ─────────────────────────────────────────────────────────────
function buildXFDF(annotations) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const items = annotations.map(ann => {
    const page = ann.pageIndex;
    if (ann.type === 'highlight' || ann.type === 'rect') {
      const { x, y, w, h } = ann.rect || { x: 0, y: 0, w: 0, h: 0 };
      return `<highlight page="${page}" rect="${x},${y},${x + w},${y + h}" color="${esc(ann.color || '#f9e547')}"><contents>${esc(ann.content || '')}</contents></highlight>`;
    }
    if (ann.type === 'note') {
      return `<freetext page="${page}" rect="${ann.x},${ann.y},${ann.x + 20},${ann.y + 20}"><contents>${esc(ann.content || '')}</contents></freetext>`;
    }
    if (ann.type === 'ink') {
      const gestures = ann.points?.map(p => `${p.x};${p.y}`).join(' ') || '';
      return `<ink page="${page}"><inklist><gesture>${esc(gestures)}</gesture></inklist></ink>`;
    }
    return '';
  }).filter(Boolean).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">\n<annots>\n${items}\n</annots>\n</xfdf>`;
}

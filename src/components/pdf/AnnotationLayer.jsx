import React, { useRef, useState, useCallback } from 'react';
import { useAnnotationStore } from '../../store/annotationStore';
import { useSignatureStore } from '../../store/signatureStore';
import { useAuditStore } from '../../store/auditStore';

/**
 * AnnotationLayer (P2-T2 + P4-T5 Signature + P6-T2/T3 Textbox/Redact)
 *
 * SVG overlay that sits absolutely on top of each PageCanvas.
 * Handles rendering of all annotation types + freehand ink drawing +
 * signature placement + textbox editing + redaction rectangles.
 *
 * Props:
 *   pageIndex   - 0-based page index
 *   pageWidth   - rendered CSS pixel width of the canvas
 *   pageHeight  - rendered CSS pixel height of the canvas
 *   documentId  - used to read/write annotations from the store
 */
export function AnnotationLayer({ pageIndex, pageWidth, pageHeight, documentId }) {
  const activeTool      = useAnnotationStore(s => s.activeTool);
  const drawColor       = useAnnotationStore(s => s.drawColor);
  const allAnnotations  = useAnnotationStore(s => s.getAnnotations(documentId));
  const addAnnotation   = useAnnotationStore(s => s.addAnnotation);
  const updateAnnotation = useAnnotationStore(s => s.updateAnnotation);
  const deleteAnnotation = useAnnotationStore(s => s.deleteAnnotation);

  const activeSignature     = useSignatureStore(s => s.activeSignature);

  const addLog = useAuditStore(s => s.addLog);

  const pageAnnotations = allAnnotations.filter(a => a.pageIndex === pageIndex);

  const svgRef  = useRef(null);
  const [selected, setSelected] = useState(null);

  // ── INK DRAWING STATE ──────────────────────────────────
  const [isDrawing, setIsDrawing]   = useState(false);
  const [currentPath, setCurrentPath] = useState([]);

  // ── SHAPE DRAG STATE (rect / highlight / redact) ───────
  const [shapeStart, setShapeStart]     = useState(null);
  const [shapePreview, setShapePreview] = useState(null);

  const getSVGPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width)  * pageWidth,
      y: ((e.clientY - rect.top)  / rect.height) * pageHeight,
    };
  }, [pageWidth, pageHeight]);

  // ── POINTER DOWN ───────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    const skipTools = [null, 'select', 'signature', 'note', 'textbox'];
    if (!activeTool || skipTools.includes(activeTool)) return;
    e.preventDefault();
    svgRef.current?.setPointerCapture(e.pointerId);
    const pt = getSVGPoint(e);

    if (activeTool === 'draw') {
      setIsDrawing(true);
      setCurrentPath([pt]);
    } else if (['rect', 'highlight', 'redact'].includes(activeTool)) {
      setShapeStart(pt);
      setShapePreview(null);
    }
  }, [activeTool, getSVGPoint]);

  // ── POINTER MOVE ───────────────────────────────────────
  const onPointerMove = useCallback((e) => {
    if (!activeTool) return;
    const pt = getSVGPoint(e);

    if (activeTool === 'draw' && isDrawing) {
      setCurrentPath(prev => [...prev, pt]);
    } else if (['rect', 'highlight', 'redact'].includes(activeTool) && shapeStart) {
      setShapePreview({ x: shapeStart.x, y: shapeStart.y, w: pt.x - shapeStart.x, h: pt.y - shapeStart.y });
    }
  }, [activeTool, isDrawing, shapeStart, getSVGPoint]);

  // ── POINTER UP ─────────────────────────────────────────
  const onPointerUp = useCallback((e) => {
    const skipTools = [null, 'select', 'signature', 'note', 'textbox'];
    if (!activeTool || skipTools.includes(activeTool)) return;
    const pt = getSVGPoint(e);

    if (activeTool === 'draw' && isDrawing) {
      if (currentPath.length > 1) {
        addAnnotation(documentId, {
          type: 'ink',
          pageIndex,
          points: currentPath,
          color: drawColor,
          strokeWidth: 2,
        });
        addLog(documentId, 'annotate', `Added ink drawing on page ${pageIndex + 1}`);
      }
      setIsDrawing(false);
      setCurrentPath([]);

    } else if (['rect', 'highlight', 'redact'].includes(activeTool) && shapeStart) {
      const x = Math.min(shapeStart.x, pt.x);
      const y = Math.min(shapeStart.y, pt.y);
      const w = Math.abs(pt.x - shapeStart.x);
      const h = Math.abs(pt.y - shapeStart.y);

      if (w > 4 && h > 4) {
        if (activeTool === 'redact') {
          addAnnotation(documentId, {
            type: 'redact', pageIndex,
            rect: { x, y, w, h },
          });
          addLog(documentId, 'annotate', `Added redaction on page ${pageIndex + 1}`);
        } else {
          const annType = activeTool === 'highlight' ? 'highlight' : 'rect';
          addAnnotation(documentId, {
            type: annType, pageIndex,
            rect: { x, y, w, h },
            color: activeTool === 'highlight' ? '#f9e547' : 'transparent',
            strokeColor: activeTool === 'highlight' ? '#f9e547' : '#e74c3c',
            strokeWidth: 2,
            opacity: activeTool === 'highlight' ? 0.4 : 1,
          });
          addLog(documentId, annType === 'highlight' ? 'highlight' : 'annotate',
            `Added ${annType} on page ${pageIndex + 1}`);
        }
      }
      setShapeStart(null);
      setShapePreview(null);
    }
  }, [activeTool, isDrawing, currentPath, shapeStart, getSVGPoint,
      addAnnotation, addLog, documentId, pageIndex, drawColor]);

  // ── CLICK (note / textbox / signature) ─────────────────
  const onSVGClick = useCallback((e) => {
    if (activeTool === 'note') {
      const pt = getSVGPoint(e);
      addAnnotation(documentId, {
        type: 'note', pageIndex, x: pt.x, y: pt.y,
        content: '', color: '#f9c74f',
      });
      addLog(documentId, 'annotate', `Added sticky note on page ${pageIndex + 1}`);
      return;
    }

    if (activeTool === 'textbox') {
      const pt = getSVGPoint(e);
      addAnnotation(documentId, {
        type: 'textbox', pageIndex,
        rect: { x: pt.x, y: pt.y, w: 200, h: 60 },
        content: '',
        fontSize: 13,
        color: '#1e293b',
      });
      addLog(documentId, 'annotate', `Added text box on page ${pageIndex + 1}`);
      return;
    }

    if (activeTool === 'signature' && activeSignature) {
      const pt = getSVGPoint(e);
      const sigWidth = 160, sigHeight = 60;
      addAnnotation(documentId, {
        type: 'signature', pageIndex,
        rect: { x: pt.x - sigWidth / 2, y: pt.y - sigHeight / 2, w: sigWidth, h: sigHeight },
        dataUrl: activeSignature.dataUrl,
        signatureName: activeSignature.name,
        placedAt: new Date().toISOString(),
      });
      addLog(documentId, 'signature',
        `Placed signature "${activeSignature.name || 'Untitled'}" on page ${pageIndex + 1}`);
      return;
    }
  }, [activeTool, activeSignature, getSVGPoint, addAnnotation, addLog, documentId, pageIndex]);

  // path builder for ink
  const pointsToPath = (pts) => {
    if (pts.length < 2) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  };

  const cursor = {
    select:    'pointer',
    highlight: 'crosshair',
    draw:      'crosshair',
    rect:      'crosshair',
    redact:    'crosshair',
    note:      'cell',
    textbox:   'text',
    signature: 'copy',
  }[activeTool] || 'default';

  // Redaction preview colour
  const shapePreviewFill    = activeTool === 'highlight' ? '#f9e547'
                            : activeTool === 'redact'    ? '#000000'
                            : 'transparent';
  const shapePreviewOpacity = activeTool === 'highlight' ? 0.35
                            : activeTool === 'redact'    ? 0.7
                            : 0;
  const shapePreviewStroke  = activeTool === 'highlight' ? '#f0c800'
                            : activeTool === 'redact'    ? '#000000'
                            : '#e74c3c';

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 overflow-visible"
      style={{ width: pageWidth, height: pageHeight, cursor, pointerEvents: activeTool ? 'all' : 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={onSVGClick}
    >
      {/* ── EXISTING ANNOTATIONS ──────────────── */}
      {pageAnnotations.map(ann => (
        <AnnotationShape
          key={ann.id}
          ann={ann}
          isSelected={selected === ann.id}
          onSelect={() => setSelected(ann.id)}
          onDelete={() => {
            deleteAnnotation(documentId, ann.id);
            addLog(documentId, 'delete', `Deleted ${ann.type} annotation on page ${ann.pageIndex + 1}`);
            setSelected(null);
          }}
          onUpdate={(updates) => updateAnnotation(documentId, ann.id, updates)}
          pageWidth={pageWidth}
          pageHeight={pageHeight}
        />
      ))}

      {/* ── LIVE INK STROKE ────────────────────── */}
      {isDrawing && currentPath.length > 1 && (
        <path
          d={pointsToPath(currentPath)}
          stroke={drawColor}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85}
        />
      )}

      {/* ── SHAPE PREVIEW (rect / highlight / redact) ── */}
      {shapePreview && (
        <rect
          x={shapePreview.w < 0 ? shapePreview.x + shapePreview.w : shapePreview.x}
          y={shapePreview.h < 0 ? shapePreview.y + shapePreview.h : shapePreview.y}
          width={Math.abs(shapePreview.w)}
          height={Math.abs(shapePreview.h)}
          fill={shapePreviewFill}
          fillOpacity={shapePreviewOpacity}
          stroke={shapePreviewStroke}
          strokeWidth={1.5}
          strokeDasharray={activeTool !== 'redact' ? '4 2' : '0'}
        />
      )}

      {/* ── SIGNATURE CURSOR HINT ───────────── */}
      {activeTool === 'signature' && activeSignature && (
        <text
          x={pageWidth / 2} y={pageHeight / 2}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={12} fill="#3b82f6" opacity={0.6}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          Click to place signature
        </text>
      )}

      {/* ── TEXTBOX CURSOR HINT ─────────────── */}
      {activeTool === 'textbox' && (
        <text
          x={pageWidth / 2} y={pageHeight / 2}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={12} fill="#8b5cf6" opacity={0.6}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          Click to place text box
        </text>
      )}

      {/* ── REDACT CURSOR HINT ─────────────── */}
      {activeTool === 'redact' && !shapePreview && (
        <text
          x={pageWidth / 2} y={pageHeight / 2}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={12} fill="#1e293b" opacity={0.5}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          Drag to redact area
        </text>
      )}
    </svg>
  );
}

// ── Individual Annotation Renderer ─────────────────────────────────────────────
function AnnotationShape({ ann, isSelected, onSelect, onDelete, onUpdate, pageWidth, pageHeight }) {
  const [showNote, setShowNote]   = useState(false);
  const [noteText, setNoteText]   = useState(ann.content || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveNote = () => {
    onUpdate({ content: noteText });
    setShowNote(false);
  };

  // ── REDACT ANNOTATION ───────────────────────────────────
  if (ann.type === 'redact') {
    const { x, y, w, h } = ann.rect;
    return (
      <g onClick={(e) => { e.stopPropagation(); onSelect(); }}>
        {/* Black fill */}
        <rect x={x} y={y} width={w} height={h} fill="#000000" />
        {/* REDACTED label */}
        <text
          x={x + w / 2} y={y + h / 2}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={Math.min(11, h * 0.45)}
          fill="#ffffff"
          fontWeight="bold"
          letterSpacing="1"
          style={{ userSelect: 'none', pointerEvents: 'none', fontFamily: 'monospace' }}
        >
          REDACTED
        </text>
        {/* Selection outline + delete */}
        {isSelected && (
          <g>
            <rect
              x={x - 2} y={y - 2} width={w + 4} height={h + 4}
              fill="none" stroke="#ef4444" strokeWidth={2}
              strokeDasharray="5 3" rx={2}
            />
            <circle
              cx={x + w + 2} cy={y - 2} r={7}
              fill="#ef4444" stroke="white" strokeWidth={1.5}
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            />
            <text
              x={x + w + 2} y={y - 2}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={9} fill="white"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >✕</text>
          </g>
        )}
      </g>
    );
  }

  // ── TEXTBOX ANNOTATION ──────────────────────────────────
  if (ann.type === 'textbox') {
    const { x, y, w, h } = ann.rect;
    return (
      <g onClick={(e) => { e.stopPropagation(); onSelect(); onSelect(); }}>
        {/* Background when selected or editing */}
        {(isSelected || isEditing) && (
          <rect
            x={x - 2} y={y - 2} width={w + 4} height={h + 4}
            fill="rgba(139,92,246,0.06)"
            stroke="#8b5cf6"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            rx={3}
          />
        )}
        {/* Inline editable text */}
        <foreignObject x={x} y={y} width={w} height={Math.max(h, 40)}>
          <div
            contentEditable={isSelected}
            suppressContentEditableWarning
            onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            onBlur={(e) => {
              const text = e.target.innerText || '';
              onUpdate({ content: text });
              setIsEditing(false);
            }}
            style={{
              width: '100%',
              minHeight: `${h}px`,
              outline: 'none',
              fontSize: `${ann.fontSize || 13}px`,
              color: ann.color || '#1e293b',
              fontFamily: 'system-ui, sans-serif',
              lineHeight: 1.4,
              cursor: isSelected ? 'text' : 'pointer',
              userSelect: isSelected ? 'text' : 'none',
              wordBreak: 'break-word',
              padding: '2px 4px',
            }}
            dangerouslySetInnerHTML={isEditing ? undefined : { __html: ann.content || '<span style="opacity:0.4">Type here…</span>' }}
          />
        </foreignObject>
        {/* Delete button */}
        {isSelected && (
          <g>
            <circle
              cx={x + w + 2} cy={y - 2} r={7}
              fill="#ef4444" stroke="white" strokeWidth={1.5}
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            />
            <text
              x={x + w + 2} y={y - 2}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={9} fill="white"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >✕</text>
          </g>
        )}
      </g>
    );
  }

  // ── SIGNATURE ANNOTATION ────────────────────────────────
  if (ann.type === 'signature') {
    const { x, y, w, h } = ann.rect;
    return (
      <g onClick={(e) => { e.stopPropagation(); onSelect(); }}>
        <image
          href={ann.dataUrl}
          x={x} y={y} width={w} height={h}
          preserveAspectRatio="xMidYMid meet"
          style={{ cursor: 'move' }}
        />
        {isSelected && (
          <g>
            <rect
              x={x - 2} y={y - 2} width={w + 4} height={h + 4}
              fill="none" stroke="#3b82f6" strokeWidth={1.5}
              strokeDasharray="6 3" rx={3}
            />
            {ann.placedAt && (
              <text
                x={x + w / 2} y={y + h + 14}
                textAnchor="middle" fontSize={9} fill="#64748b"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                Signed {new Date(ann.placedAt).toLocaleDateString()}
              </text>
            )}
            <circle
              cx={x + w + 2} cy={y - 2} r={7}
              fill="#ef4444" stroke="white" strokeWidth={1.5}
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            />
            <text
              x={x + w + 2} y={y - 2}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={9} fill="white"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >✕</text>
          </g>
        )}
      </g>
    );
  }

  // ── HIGHLIGHT / RECT ────────────────────────────────────
  if (ann.type === 'highlight' || ann.type === 'rect') {
    const { x, y, w, h } = ann.rect;
    return (
      <g onClick={(e) => { e.stopPropagation(); onSelect(); }}>
        <rect
          x={x} y={y} width={w} height={h}
          fill={ann.color || 'transparent'}
          fillOpacity={ann.opacity || 0.35}
          stroke={isSelected ? '#3b82f6' : (ann.strokeColor || ann.color || 'none')}
          strokeWidth={isSelected ? 2 : ann.strokeWidth || 1}
        />
        {isSelected && (
          <g>
            <circle
              cx={x + w} cy={y} r={5}
              fill="#ef4444" stroke="white" strokeWidth={1.5}
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            />
            <text
              x={x + w} y={y}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={7} fill="white"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >✕</text>
          </g>
        )}
      </g>
    );
  }

  // ── INK ─────────────────────────────────────────────────
  if (ann.type === 'ink') {
    const d = ann.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    return (
      <g onClick={(e) => { e.stopPropagation(); onSelect(); }}>
        <path
          d={d}
          stroke={isSelected ? '#3b82f6' : (ann.color || '#e74c3c')}
          strokeWidth={isSelected ? 3 : ann.strokeWidth || 2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {isSelected && ann.points.length > 0 && (
          <circle
            cx={ann.points[0].x} cy={ann.points[0].y} r={6}
            fill="#ef4444" stroke="white" strokeWidth={1.5}
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          />
        )}
      </g>
    );
  }

  // ── STICKY NOTE ─────────────────────────────────────────
  if (ann.type === 'note') {
    return (
      <g>
        <g
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); setShowNote(!showNote); onSelect(); }}
        >
          <rect
            x={ann.x - 2} y={ann.y - 2} width={24} height={24} rx={4}
            fill={ann.color || '#f9c74f'}
            stroke={isSelected ? '#3b82f6' : '#d4a017'}
            strokeWidth={1.5}
          />
          <text
            x={ann.x + 10} y={ann.y + 14}
            textAnchor="middle" fontSize={13} fill="#333"
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >📝</text>
        </g>
        {showNote && (
          <foreignObject x={ann.x + 26} y={ann.y - 4} width={200} height={140}>
            <div
              className="bg-white border border-slate-200 rounded-lg shadow-xl p-2 flex flex-col gap-2"
              style={{ fontFamily: 'system-ui', fontSize: 12 }}
            >
              <textarea
                rows={4}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add a note..."
                className="w-full resize-none border border-slate-200 rounded p-1 text-xs outline-none focus:border-blue-400"
              />
              <div className="flex gap-1 justify-end">
                <button
                  onClick={handleSaveNote}
                  className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                >Save</button>
                <button
                  onClick={() => { setShowNote(false); onDelete(); }}
                  className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                >Delete</button>
              </div>
            </div>
          </foreignObject>
        )}
      </g>
    );
  }

  return null;
}

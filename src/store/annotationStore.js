/**
 * Annotation Store (Phase 2 - P2-T1)
 * 
 * Client-side Zustand store for managing annotations with undo/redo.
 * Annotations are persisted per-document to localStorage as a simple offline store
 * until the backend API is wired up.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_UNDO = 50;

function pushUndo(history, action) {
  return [...history.slice(-(MAX_UNDO - 1)), action];
}

export const useAnnotationStore = create(
  persist(
    (set, get) => ({
      // Map of documentId -> annotation[]
      annotationsByDoc: {},
      // Undo / redo stacks
      undoStack: [],
      redoStack: [],
      // Active tool: 'highlight' | 'note' | 'draw' | 'rect' | 'textbox' | 'redact' | 'select' | 'signature' | null
      activeTool: null,
      // Ink color for freehand drawing tool
      drawColor: '#e74c3c',

      // ── TOOLS ──────────────────────────────────────────
      setActiveTool: (tool) => set({ activeTool: tool }),
      setDrawColor: (color) => set({ drawColor: color }),

      // ── ANNOTATIONS ────────────────────────────────────
      getAnnotations: (documentId) => {
        return get().annotationsByDoc[documentId] || [];
      },

      addAnnotation: (documentId, annotation) => {
        const current = get().annotationsByDoc[documentId] || [];
        const newAnnotation = {
          id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
          ...annotation,
        };
        const next = [...current, newAnnotation];

        set(state => ({
          annotationsByDoc: { ...state.annotationsByDoc, [documentId]: next },
          undoStack: pushUndo(state.undoStack, { type: 'add', documentId, annotation: newAnnotation }),
          redoStack: [],
        }));

        return newAnnotation;
      },

      updateAnnotation: (documentId, annotationId, updates) => {
        const current = get().annotationsByDoc[documentId] || [];
        const old = current.find(a => a.id === annotationId);
        if (!old) return;
        const next = current.map(a => a.id === annotationId ? { ...a, ...updates } : a);

        set(state => ({
          annotationsByDoc: { ...state.annotationsByDoc, [documentId]: next },
          undoStack: pushUndo(state.undoStack, { type: 'update', documentId, annotationId, old }),
          redoStack: [],
        }));
      },

      deleteAnnotation: (documentId, annotationId) => {
        const current = get().annotationsByDoc[documentId] || [];
        const deleted = current.find(a => a.id === annotationId);
        if (!deleted) return;
        const next = current.filter(a => a.id !== annotationId);

        set(state => ({
          annotationsByDoc: { ...state.annotationsByDoc, [documentId]: next },
          undoStack: pushUndo(state.undoStack, { type: 'delete', documentId, annotation: deleted }),
          redoStack: [],
        }));
      },

      undo: () => {
        const stack = get().undoStack;
        if (stack.length === 0) return;
        const action = stack[stack.length - 1];
        const remaining = stack.slice(0, -1);

        set(state => {
          const current = state.annotationsByDoc[action.documentId] || [];
          let next = current;

          if (action.type === 'add') {
            next = current.filter(a => a.id !== action.annotation.id);
          } else if (action.type === 'delete') {
            next = [...current, action.annotation];
          } else if (action.type === 'update') {
            next = current.map(a => a.id === action.annotationId ? action.old : a);
          }

          return {
            annotationsByDoc: { ...state.annotationsByDoc, [action.documentId]: next },
            undoStack: remaining,
            redoStack: pushUndo(state.redoStack, action),
          };
        });
      },

      redo: () => {
        const stack = get().redoStack;
        if (stack.length === 0) return;
        const action = stack[stack.length - 1];
        const remaining = stack.slice(0, -1);

        set(state => {
          const current = state.annotationsByDoc[action.documentId] || [];
          let next = current;

          if (action.type === 'add') {
            next = [...current, action.annotation];
          } else if (action.type === 'delete') {
            next = current.filter(a => a.id !== action.annotation.id);
          } else if (action.type === 'update') {
            next = current.map(a => a.id === action.annotationId ? { ...a, ...action.updates } : a);
          }

          return {
            annotationsByDoc: { ...state.annotationsByDoc, [action.documentId]: next },
            redoStack: remaining,
            undoStack: pushUndo(state.undoStack, action),
          };
        });
      },
    }),
    {
      name: 'inkit-pdf-annotations',
      partialize: (state) => ({ annotationsByDoc: state.annotationsByDoc }),
    }
  )
);

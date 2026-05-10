import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * auditStore (P5-T5)
 *
 * Tracks viewer actions per document for the Activity panel.
 * Persisted to localStorage so log survives page refresh.
 *
 * State shape:
 *   logs: { [documentId]: [{ id, action, description, timestamp }] }
 */

const ACTION_ICONS = {
  open:       '📂',
  close:      '✖️',
  annotate:   '✏️',
  delete:     '🗑️',
  highlight:  '🖊️',
  signature:  '✍️',
  form_save:  '💾',
  form_reset: '↩️',
  export:     '📤',
  print:      '🖨️',
  share:      '🔗',
  organize:   '📑',
  watermark:  '🔏',
  search:     '🔍',
};

export const ACTION_LABELS = ACTION_ICONS;

export const useAuditStore = create(
  persist(
    (set, get) => ({
      logs: {}, // { [documentId]: [...entries] }

      /**
       * Add a log entry for a document.
       * @param {string} documentId
       * @param {string} action  – one of keys in ACTION_ICONS
       * @param {string} description
       */
      addLog: (documentId, action, description) => {
        const docLogs = get().logs[documentId] || [];
        const entry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          action,
          description,
          timestamp: new Date().toISOString(),
        };
        // Keep latest 200 entries per document
        const trimmed = [entry, ...docLogs].slice(0, 200);
        set((state) => ({
          logs: { ...state.logs, [documentId]: trimmed },
        }));
      },

      /**
       * Get all logs for a document, most-recent first.
       * @param {string} documentId
       * @returns {Array}
       */
      getLogs: (documentId) => {
        return get().logs[documentId] || [];
      },

      /**
       * Clear all logs for a document.
       * @param {string} documentId
       */
      clearLogs: (documentId) => {
        set((state) => {
          const next = { ...state.logs };
          delete next[documentId];
          return { logs: next };
        });
      },
    }),
    {
      name: 'inkit-audit-logs',
      // Only persist logs, not computed values
      partialize: (state) => ({ logs: state.logs }),
    }
  )
);

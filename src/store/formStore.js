/**
 * Form Store (Phase 4 - P4-T1/T2)
 * 
 * Zustand store for managing PDF AcroForm field values.
 * Persists field values to localStorage so users don't lose work mid-session.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useFormStore = create(
  persist(
    (set, get) => ({
      // Map of documentId -> { fieldName: value }
      formValuesByDoc: {},
      // Track whether any fields have been modified
      dirtyDocs: new Set(),

      getFormValues: (documentId) => {
        return get().formValuesByDoc[documentId] || {};
      },

      setFieldValue: (documentId, fieldName, value) => {
        set(state => {
          const current = state.formValuesByDoc[documentId] || {};
          const newDirty = new Set(state.dirtyDocs);
          newDirty.add(documentId);
          return {
            formValuesByDoc: {
              ...state.formValuesByDoc,
              [documentId]: { ...current, [fieldName]: value },
            },
            dirtyDocs: newDirty,
          };
        });
      },

      setMultipleFieldValues: (documentId, values) => {
        set(state => {
          const current = state.formValuesByDoc[documentId] || {};
          const newDirty = new Set(state.dirtyDocs);
          newDirty.add(documentId);
          return {
            formValuesByDoc: {
              ...state.formValuesByDoc,
              [documentId]: { ...current, ...values },
            },
            dirtyDocs: newDirty,
          };
        });
      },

      resetForm: (documentId) => {
        set(state => {
          const newValues = { ...state.formValuesByDoc };
          delete newValues[documentId];
          const newDirty = new Set(state.dirtyDocs);
          newDirty.delete(documentId);
          return {
            formValuesByDoc: newValues,
            dirtyDocs: newDirty,
          };
        });
      },

      isDirty: (documentId) => {
        return get().dirtyDocs.has(documentId);
      },

      clearDirty: (documentId) => {
        set(state => {
          const newDirty = new Set(state.dirtyDocs);
          newDirty.delete(documentId);
          return { dirtyDocs: newDirty };
        });
      },
    }),
    {
      name: 'inkit-pdf-form-data',
      partialize: (state) => ({ formValuesByDoc: state.formValuesByDoc }),
    }
  )
);

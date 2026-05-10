/**
 * Signature Store (Phase 4 - P4-T4)
 * 
 * Zustand store for managing saved visual signatures.
 * Uses sessionStorage for security — signatures do NOT persist across browser sessions.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const MAX_SIGNATURES = 5;

export const useSignatureStore = create(
  persist(
    (set, get) => ({
      // Array of saved signatures
      savedSignatures: [], // [{ id, name, dataUrl, createdAt }]
      // Currently selected signature for placement
      activeSignature: null, // { id, dataUrl }

      addSignature: (name, dataUrl) => {
        const newSig = {
          id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: name || 'Untitled',
          dataUrl,
          createdAt: new Date().toISOString(),
        };

        set(state => {
          const sigs = [newSig, ...state.savedSignatures].slice(0, MAX_SIGNATURES);
          return {
            savedSignatures: sigs,
            activeSignature: newSig,
          };
        });

        return newSig;
      },

      removeSignature: (id) => {
        set(state => ({
          savedSignatures: state.savedSignatures.filter(s => s.id !== id),
          activeSignature: state.activeSignature?.id === id ? null : state.activeSignature,
        }));
      },

      setActiveSignature: (sig) => {
        set({ activeSignature: sig });
      },

      clearActiveSignature: () => {
        set({ activeSignature: null });
      },

      getSignatureCount: () => get().savedSignatures.length,
    }),
    {
      name: 'inkit-pdf-signatures',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

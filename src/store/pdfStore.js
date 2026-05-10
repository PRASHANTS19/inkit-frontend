import { create } from 'zustand';

export const usePDFStore = create((set, get) => ({
  documentId: null,
  currentPage: 1,
  totalPages: 0,
  zoomLevel: 1.0,
  fitMode: 'width', // 'width', 'page', 'actual', 'custom'
  layoutMode: 'continuous', // 'continuous', 'single'
  hasFormFields: false, // whether the loaded PDF contains AcroForm fields

  setDocumentId: (id) => set({ documentId: id }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (total) => set({ totalPages: total }),
  setZoomLevel: (zoom) => set({ zoomLevel: Math.min(Math.max(zoom, 0.1), 6.4) }),
  setFitMode: (mode) => set({ fitMode: mode }),
  setLayoutMode: (mode) => set({ layoutMode: mode }),
  setHasFormFields: (val) => set({ hasFormFields: val }),

  // Single-page navigation
  goToNextPage: () => {
    const { currentPage, totalPages } = get();
    if (currentPage < totalPages) {
      set({ currentPage: currentPage + 1 });
    }
  },
  goToPrevPage: () => {
    const { currentPage } = get();
    if (currentPage > 1) {
      set({ currentPage: currentPage - 1 });
    }
  },
  goToPage: (page) => {
    const { totalPages } = get();
    const clamped = Math.min(Math.max(1, page), totalPages);
    set({ currentPage: clamped });
  },
}));

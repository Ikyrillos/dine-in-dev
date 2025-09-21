// stores/foundation-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Delegation } from '../dtos/dtos';

interface FoundationState {
  selectedFoundation: Delegation | null;
  setSelectedFoundation: (foundation: Delegation) => void;
  clearSelectedFoundation: () => void;
  getFoundationId: () => string | null;
}

export const useFoundationStore = create<FoundationState>()(
  persist(
    (set, get) => ({
      selectedFoundation: null,

      setSelectedFoundation: (foundation: Delegation) => {
        set({ selectedFoundation: foundation });
        // Ensure localStorage is in sync
        localStorage.setItem("x-foundation-id", foundation.foundation._id);
      },

      clearSelectedFoundation: () => {
        set({ selectedFoundation: null });
        // Also clear from localStorage
        localStorage.removeItem("x-foundation-id");
      },

      getFoundationId: () => {
        const { selectedFoundation } = get();
        const storeId = selectedFoundation?.foundation._id;
        const localStorageId = localStorage.getItem("x-foundation-id");

        // Return the store value if available, otherwise fall back to localStorage
        return storeId || localStorageId;
      },
    }),
    {
      name: 'foundation-storage', // localStorage key
      partialize: (state) => ({ selectedFoundation: state.selectedFoundation }),
    }
  )
);
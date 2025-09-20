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
        localStorage.setItem("x-foundation-id", foundation.foundation._id);
      },
      
      clearSelectedFoundation: () => {
        set({ selectedFoundation: null });
      },
      
      getFoundationId: () => {
        const { selectedFoundation } = get();
        return selectedFoundation?.foundation._id || null;
      },
    }),
    {
      name: 'foundation-storage', // localStorage key
      partialize: (state) => ({ selectedFoundation: state.selectedFoundation }),
    }
  )
);
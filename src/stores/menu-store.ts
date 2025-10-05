import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MenuStore {
  menuId: string | null;
  setMenuId: (menuId: string) => void;
  clearMenuId: () => void;
}

export const useMenuStore = create<MenuStore>()(
  persist(
    (set) => ({
      menuId: null,
      setMenuId: (menuId: string) => set({ menuId }),
      clearMenuId: () => set({ menuId: null }),
    }),
    {
      name: 'menu-store', // name of the item in localStorage
    }
  )
);
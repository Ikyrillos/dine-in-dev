

// Create the custom hook to use fake menu categories

import { useMenuStore } from "@/stores/menu-store";
import { useQuery } from "@tanstack/react-query";
import { menuCategoryApi } from "../repositories/categories-repository";

export const useGetMenuCategories = () => {
  const menuId = useMenuStore(state => state.menuId);

  return useQuery({
    queryKey: ['menuCategories', menuId],
    queryFn: () => menuCategoryApi.fetchAllMenuCategories(menuId!),
    enabled: !!menuId,
  });
};

export const useGetMenuCategoriesByMenu = (menuId?: string) => {
  const storedMenuId = useMenuStore(state => state.menuId);
  const finalMenuId = menuId || storedMenuId;

  console.log("useGetMenuCategoriesByMenu called with menuId:", finalMenuId, "enabled:", !!finalMenuId);

  return useQuery({
    queryKey: ["menuCategories", "by-menu", finalMenuId],
    queryFn: () => {
      console.log("EXECUTING QUERY: Fetching categories for menuId:", finalMenuId);
      console.log("API call will be to: /menu-categories/by-menu/" + finalMenuId);
      return menuCategoryApi.fetchMenuCategories(finalMenuId!);
    },
    enabled: !!finalMenuId,
    staleTime: 1000 * 60 * 5, // Data fresh for 5 minutes
    retry: 3, // Retry on failure
  });
};
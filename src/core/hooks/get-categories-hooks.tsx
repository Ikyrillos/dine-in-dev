

// Create the custom hook to use fake menu categories

import { useQuery } from "@tanstack/react-query";
import { menuCategoryApi } from "../repositories/categories-repository";

export const useGetMenuCategories = () => {
  // const router = useRouter();
    return useQuery({
    queryKey: ['menuCategories'],
    queryFn: () => menuCategoryApi.fetchAllMenuCategories(),
  }
  );
};

export const useGetMenuCategoriesByMenu = (menuId?: string) => {
  console.log("useGetMenuCategoriesByMenu called with menuId:", menuId, "enabled:", !!menuId);

  return useQuery(
    ["menuCategories", "by-menu", menuId],
    () => {
      console.log("EXECUTING QUERY: Fetching categories for menuId:", menuId);
      console.log("API call will be to: /menu-categories/by-menu/" + menuId);
      return menuCategoryApi.fetchMenuCategories(menuId!);
    },
    {
      enabled: !!menuId,
      onError: (error) => {
        console.error("Error fetching menu categories by menu:", error);
      },
      onSuccess: (data) => {
        console.log("Successfully fetched categories by menu:", data);
      },
      staleTime: 1000 * 60 * 5, // Data fresh for 5 minutes
      retry: 3, // Retry once on failure
    }
  );
};
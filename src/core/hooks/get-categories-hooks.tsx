

// Create the custom hook to use fake menu categories

import { useQuery } from "@tanstack/react-query";
import { menuCategoryApi } from "../repositories/categories-repository";

export const useGetMenuCategories = () => {
  // const router = useRouter();
    return useQuery({
    queryKey: ['menuCategories'],
    queryFn: () => menuCategoryApi.fetchMenuCategories(),
  }
  );
};
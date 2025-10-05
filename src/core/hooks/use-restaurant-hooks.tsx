import { useFoundationStore } from "@/features/foundations/store/foundation-store";
import { useMenuStore } from "@/stores/menu-store";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { restaurantApi } from "../repositories/restaurant-repository";

export const queryKeys = {
    restaurants: 'restaurants',
    restaurant: (id: string) => ['restaurant', id],
};

export const useGetRestaurantById = () => {
  const foundation = localStorage.getItem("x-foundation-id") || "";
  const setMenuId = useMenuStore(state => state.setMenuId);

  console.log("foundation", foundation);

  const query = useQuery(
    {
      queryKey: queryKeys.restaurant(foundation),
      queryFn: () => restaurantApi.findOne(foundation),
      refetchOnWindowFocus: false, // Optional: Prevent refetching on window focus
    }
  );

  // Extract and store menu ID when restaurant data loads
  useEffect(() => {
    if (query.data?.data?.dineInMenu) {
      console.log("Setting menu ID from restaurant data:", query.data.data.dineInMenu);
      setMenuId(query.data.data.dineInMenu);
    }
  }, [query.data?.data?.dineInMenu, setMenuId]);

  return query;
};


export const useGetRestaurantByIdParams = () => {
  const selectedFoundation = useFoundationStore(state => state.selectedFoundation);
  const setMenuId = useMenuStore(state => state.setMenuId);

  console.log("selectedFoundation", selectedFoundation);
  
  const query = useQuery({
    queryKey: ['restaurant', selectedFoundation?.foundation._id],
    queryFn: async () => {
      // Fallback to API call if no store data or ID mismatch
      return restaurantApi.findOne(selectedFoundation!.foundation._id);
    },
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    }
  });

  // Extract and store menu ID when restaurant data loads
  useEffect(() => {
    if (query.data?.data?.dineInMenu) {
      console.log("Setting menu ID from restaurant params data:", query.data.data.dineInMenu);
      setMenuId(query.data.data.dineInMenu);
    }
  }, [query.data?.data?.dineInMenu, setMenuId]);

  return query;
};
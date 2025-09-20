import { useFoundationStore } from "@/features/foundations/store/foundation-store";
import { useQuery } from "@tanstack/react-query";
import { restaurantApi } from "../repositories/restaurant-repository";

export const queryKeys = {
    restaurants: 'restaurants',
    restaurant: (id: string) => ['restaurant', id],
};

export const useGetRestaurantById = () => {

  const foundation = localStorage.getItem("x-foundation-id") || "";
  console.log("foundation", foundation);
  return useQuery(
    {
      queryKey: queryKeys.restaurant(foundation),
      queryFn: () => restaurantApi.findOne(foundation),

      refetchOnWindowFocus: false, // Optional: Prevent refetching on window focus
    }
   
  );
};


export const useGetRestaurantByIdParams = () => {
  const selectedFoundation = useFoundationStore(state => state.selectedFoundation);

  console.log("selectedFoundation", selectedFoundation);
  
  return useQuery({
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
};
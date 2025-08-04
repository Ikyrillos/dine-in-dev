import { useQuery } from "@tanstack/react-query";
import { RESTAURANT_ID } from "../apis-endpoints";
import { restaurantApi } from "../repositories/restaurant-repository";

export const queryKeys = {
    restaurants: 'restaurants',
    restaurant: (id: string) => ['restaurant', id],
};

export const useGetRestaurantById = () => {

  return useQuery(
    {
      queryKey: queryKeys.restaurant(RESTAURANT_ID),
      queryFn: () => restaurantApi.findOne(RESTAURANT_ID),
      refetchOnWindowFocus: false, // Optional: Prevent refetching on window focus
    }
   
  );
};

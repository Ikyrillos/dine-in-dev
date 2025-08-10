import { useQuery } from "@tanstack/react-query";
import { menuItemApi } from "../repositories/menu-items-repository";

export const useGetMenuItems = () => {
    return useQuery({
        queryKey: ['menuItems'],
        queryFn: () => menuItemApi.fetchMenuItems(),
    });
};
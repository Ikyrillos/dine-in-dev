import { useMenuStore } from "@/stores/menu-store";
import { useQuery } from "@tanstack/react-query";
import { menuItemApi } from "../repositories/menu-items-repository";

export const useGetMenuItems = () => {
    const menuId = useMenuStore(state => state.menuId);

    return useQuery({
        queryKey: ['menuItems', menuId],
        queryFn: () => menuItemApi.fetchMenuItemsByMenu(menuId!),
        enabled: !!menuId,
    });
};

export const useGetMenuItemsByMenu = (menuId?: string) => {
    const storedMenuId = useMenuStore(state => state.menuId);
    const finalMenuId = menuId || storedMenuId;

    console.log("useGetMenuItemsByMenu called with menuId:", finalMenuId, "enabled:", !!finalMenuId);

    return useQuery({
        queryKey: ["menuItems", "by-menu", finalMenuId],
        queryFn: () => {
            console.log("EXECUTING QUERY: Fetching menu items for menuId:", finalMenuId);
            console.log("API call will be to: /menu-items/by-menu/" + finalMenuId);
            return menuItemApi.fetchMenuItemsByMenu(finalMenuId!);
        },
        enabled: !!finalMenuId,
        staleTime: 1000 * 60 * 5, // Data fresh for 5 minutes
        retry: 3, // Retry on failure
    });
};
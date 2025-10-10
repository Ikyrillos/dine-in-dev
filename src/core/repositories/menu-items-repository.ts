import { BASE_URL } from "../apis-endpoints";
import { makeRequest } from "../make-request";
import type { IMenuItem } from "../models/IMenuItem";

class MenuItemRepository {
    /**
     * Create a new menu item
     * @param data Menu item creation data
     * @returns Created menu item data
     */
    async create(data: Omit<IMenuItem, '_id' | 'createdAt' | 'updatedAt'>) {
        return await makeRequest<typeof data, IMenuItem>({
            method: 'POST',
            url: `${BASE_URL}/menu-items`,
            data,
        });
    }

    // /menu-items/upload-photo
    async uploadImage(data: FormData) {
        return await makeRequest<typeof data, {
            fileUrl: string;
        }>({
            method: 'POST',
            url: `${BASE_URL}/restaurants/upload-file`,
            isFormData: true,
            data,
        });
    }

    /**
     * Retrieve all menu items
     * @returns List of all menu items
     */
    async findAll() {
        return await makeRequest<void, IMenuItem[]>({
            method: 'GET',
            url: `${BASE_URL}/menu-items`,
        });
    }

    /**
     * Retrieve a specific menu item by ID
     * @param id Menu item ID
     * @returns Menu item data
     */
    async findOne(id: string) {
        return await makeRequest<void, IMenuItem>({
            method: 'GET',
            url: `${BASE_URL}/menu-items/${id}`,
        });
    }

    /**
     * Update a specific menu item by ID
     * @param id Menu item ID
     * @param data Updated menu item data
     * @returns Updated menu item data
     */
    async update(id: string, data: IMenuItem) {
        return await makeRequest<typeof data, IMenuItem>({
            method: 'PATCH',
            url: `${BASE_URL}/menu-items/${id}`,
            data,
        });
    }

    /**
     * Remove a specific menu item by ID
     * @param id Menu item ID
     * @returns Deletion response
     */
    async remove(id: string) {
        return await makeRequest<void, unknown>({
            method: 'DELETE',
            url: `${BASE_URL}/menu-items/${id}`,
        });
    }

    /**
     * Restore a specific menu item by ID
     * @param id Menu item ID
     * @returns Restoration response
     */
    async restore(id: string) {
        return await makeRequest<void, unknown>({
            method: 'POST',
            url: `${BASE_URL}/menu-items/${id}/restore`,
        });
    }


    async fetchMenuItems() {
        return await makeRequest<void, IMenuItem[]>({
            method: 'GET',
            url: `${BASE_URL}/menu-items`,
        });
    }

    /**
     * Retrieve menu items by menu ID
     * @param menuId Menu ID
     * @returns List of menu items for the specific menu
     */
    async fetchMenuItemsByMenu(menuId: string) {
        return await makeRequest<void, IMenuItem[]>({
            method: 'GET',
            url: `${BASE_URL}/menu-items/by-menu/${menuId}`,
        });
    }
}

export const menuItemApi = new MenuItemRepository();
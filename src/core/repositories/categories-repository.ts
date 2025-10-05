import { BASE_URL } from "../apis-endpoints";
import { makeRequest } from "../make-request";
import type { IMenuCategory } from "../models/IMenuCategory";

class MenuCategoryRepository {
    /**
     * Create a new menu category
     * @param data Menu category creation data
     * @returns Created menu category data
     */
    async create(data: Omit<IMenuCategory, 'id' | 'createdAt' | 'updatedAt'>) {
        return await makeRequest<typeof data, IMenuCategory>({
            method: 'POST',
            url: `${BASE_URL}/menu-categories`,
            data,
        });
    }

    /**
     * Retrieve all menu categories
     * @returns List of all menu categories
     */
    async findAll() {
        return await makeRequest<void, IMenuCategory[]>({
            method: 'GET',
            url: `${BASE_URL}/menu-categories`,
        });
    }

    /**
     * Retrieve a specific menu category by ID
     * @param id Menu category ID
     * @returns Menu category data
     */
    async findOne(id: string) {
        return await makeRequest<void, IMenuCategory>({
            method: 'GET',
            url: `${BASE_URL}/menu-categories/${id}`,
        });
    }

    /**
     * Update a specific menu category by ID
     * @param id Menu category ID
     * @param data Updated menu category data
     * @returns Updated menu category data
     */
    async update(id: string, data: Partial<Omit<IMenuCategory, 'createdAt' | 'updatedAt'>>) {
        return await makeRequest<typeof data, IMenuCategory>({
            method: 'PATCH',
            url: `${BASE_URL}/menu-categories/${id}`,
            data,
        });
    }

    /**
     * Remove a specific menu category by ID
     * @param id Menu category ID
     * @returns Deletion response
     */
    async remove(id: string) {
        return await makeRequest<void, unknown>({
            method: 'DELETE',
            url: `${BASE_URL}/menu-categories/${id}`,
        });
    }

    /**
     * Restore a specific menu category by ID
     * @param id Menu category ID
     * @returns Restoration response
     */
    async restore(id: string) {
        return await makeRequest<void, unknown>({
            method: 'POST',
            url: `${BASE_URL}/menu-categories/${id}/restore`,
        });
    }


    async fetchMenuCategories(menuId: string) {
        return await makeRequest<void, IMenuCategory[]>({
            method: 'GET',
            url: `${BASE_URL}/menu-categories/by-menu/${menuId}`,
        });
    }

    async fetchAllMenuCategories(menuId: string) {
        return await makeRequest<void, IMenuCategory[]>({
            method: 'GET',
            url: `${BASE_URL}/menu-categories/by-menu/${menuId}`,
        });
    }
}

export const menuCategoryApi = new MenuCategoryRepository();
import { BASE_URL } from "../apis-endpoints";
import { makeRequest } from "../make-request";
import type { AddItemToCartDto, Cart, UpdateCartItemDto } from "../models/dtos/cart-dtos";

class CartRepository {
    /**
     * Add item to table cart
     * @param tableId Table ID
     * @param data Item addition data
     * @returns Updated cart data
     */
    async addItemToTable(tableId: string, data: AddItemToCartDto) {
        return await makeRequest<typeof data, Cart>({
            method: 'POST',
            url: `${BASE_URL}/tables/${tableId}/add-to-table`,
            data,
        });
    }

    /**
     * Update cart item quantity
     * @param optionsHash Options hash identifier
     * @param data Update data containing new quantity
     * @returns Updated cart data
     */
    async updateCartItem(optionsHash: string, data: UpdateCartItemDto, tableId: string) {
        return await makeRequest<typeof data, Cart>({
            method: 'PUT',
            url: `${BASE_URL}/tables/${tableId}/${optionsHash}`,
            data,
        });
    }

    /**
     * Remove item from table cart
     * @param tableId Table ID
     * @param optionsHash Options hash identifier
     * @returns Updated cart data
     */
    async removeCartItem(tableId: string, optionsHash: string) {
        return await makeRequest<void, Cart>({
            method: 'DELETE',
            url: `${BASE_URL}/tables/${tableId}/${optionsHash}`,
        });
    }

    /**
     * Clear entire table cart
     * @param tableId Table ID
     * @returns Cleared cart data
     */
    async clearCart(tableId: string) {
        return await makeRequest<void, Cart>({
            method: 'DELETE',
            url: `${BASE_URL}/tables/${tableId}/clear-cart`,
        });
    }

    /**
     * Get table cart by fetching table data (assuming cart is part of table data)
     * @param tableId Table ID
     * @returns Table data with cart information
     */
    async getTable(tableId: string) {
        return await makeRequest<void, Cart>({
            method: 'GET',
            url: `${BASE_URL}/tables/${tableId}?`,
        });
    }
}

export const cartApi = new CartRepository();
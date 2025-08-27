import { BASE_URL } from "../apis-endpoints";
import { makeRequest } from "../make-request";
import type {
    AddItemToCartDto,
    Cart,
    UpdateCartItemDto,
} from "../models/dtos/cart-dtos";

interface CheckoutRequest {
    tableId: string;
    note?: string;
    promoCode?: string;
    source: string;
    successUrl?: string;
    failUrl?: string;
}

class CartRepository {
    checkoutCart(
        tableId: string,
        note?: string,
        promoCode?: string,
    ): Promise<unknown> {
        return makeRequest<CheckoutRequest, unknown>({
            method: "POST",
            url: `${BASE_URL}/tables/${tableId}/checkout`,
            data: {
                tableId,
                note,
                promoCode,
                source: "Dine-in",
                successUrl: "https://www.secondserving.uk/",
                failUrl: "https://www.secondserving.uk/",
            },
        });
    }

    // Post /tables/:id/print-pos-order
    async printPosOrder(tableId: string): Promise<unknown> {
        return makeRequest<void, unknown>({
            method: "POST",
            url: `${BASE_URL}/tables/${tableId}/print-pos-order`,
        });
    }
    /**
     * Add item to table cart
     * @param tableId Table ID
     * @param data Item addition data
     * @returns Updated cart data
     */
    async addItemToTable(tableId: string, data: AddItemToCartDto) {
        const foundationId = localStorage.getItem("x-foundation-id");
        return await makeRequest<typeof data, Cart>({
            method: "POST",
            url: `${BASE_URL}/tables/${tableId}/add-to-table`,
            data,
            headers: { "x-foundation-id": foundationId || "" },
        });
    }

    /**
     * Update cart item quantity
     * @param optionsHash Options hash identifier
     * @param data Update data containing new quantity
     * @returns Updated cart data
     */
    async updateCartItem(
        optionsHash: string,
        data: UpdateCartItemDto,
        tableId: string,
    ) {
        return await makeRequest<typeof data, Cart>({
            method: "PUT",
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
            method: "DELETE",
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
            method: "DELETE",
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
            method: "GET",
            url: `${BASE_URL}/tables/${tableId}?`,
        });
    }
}

export const oldCartApi = new CartRepository();

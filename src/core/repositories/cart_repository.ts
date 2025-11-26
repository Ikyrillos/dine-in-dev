import { BASE_URL } from "../apis-endpoints";
import { makeRequest } from "../make-request";
import type {
    AddToCartDto,
    Cart,
    UpdateCartItemDto,
} from "../models/dtos/cart-dtos";

interface CheckoutRequest {
    tableId: string;
    note?: string;
    discount?: number;
    source: string;
    successUrl?: string;
    failUrl?: string;
    paymentMethod: "cash" | "credit";

}

class CartRepository {
    checkoutCart(
        tableId: string,
        paymentMethod: "cash" | "credit",
        note?: string,
        discount?: number,
    ): Promise<unknown> {
        return makeRequest<CheckoutRequest, unknown>({
            method: "POST",
            url: `${BASE_URL}/tables/${tableId}/checkout`,
            data: {
                tableId,
                note,
                discount,
                source: "Dine-in",
                successUrl: "https://www.secondserving.uk/",
                failUrl: "https://www.secondserving.uk/",
                paymentMethod: paymentMethod,
            },
        });
    }

    // Post /tables/:id/print-pos-order
    async printPosOrder(tableId: string, note?: string, discount?: number, source?: string, paymentMethod?: string): Promise<unknown> {

        return makeRequest<{
            tableId: string;
            note?: string;
            discount?: number;
            source?: string;
            paymentMethod?: string;
        }, unknown>({
            method: "POST",
            url: `${BASE_URL}/tables/${tableId}/print-pos-order`,
            data: {
                tableId,
                note,
                discount,
                source: source || "Dine-in",
                paymentMethod: paymentMethod || "cash",
            },
        });
    }
    /**
     * Add item to table cart
     * @param tableId Table ID
     * @param data Item addition data
     * @returns Updated cart data
     */
    async addItemToTable(tableId: string, data: AddToCartDto) {
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
     * Print cart for a table
     * @param tableId Table ID
     * @returns Print response data
     */
    async printCart(tableId: string) {
        const foundationId = localStorage.getItem("x-foundation-id");
        return await makeRequest<void, unknown>({
            method: "POST",
            url: `${BASE_URL}/tables/${tableId}/print`,
            headers: { "x-foundation-id": foundationId || "" },
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

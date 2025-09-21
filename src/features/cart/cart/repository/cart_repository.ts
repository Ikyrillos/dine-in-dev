import { BASE_URL } from "@/core/apis-endpoints";
import { makeRequest } from "@/core/make-request";
import { AxiosError } from "axios";
import type { ICart } from "../models/cart-item-model";


export interface CheckoutResponse {
    _id: string;
    user: string;
    restaurant: string;
    orderDate: string; // ISO Date string
    orderNumber: string;
    totalAmount: number;
    subTotal: number;
    tax: number;
    note: string;
    source: "web" | "mobile" | string; // extendable
    shippingCost: number;
    items: any[];
    status: "PAID" | "PENDING" | "CANCELLED" | string; // extendable
    deleted: boolean;
    createdAt: string; // ISO Date string
    updatedAt: string; // ISO Date string
}


export interface CheckoutData {
    successUrl: string;
    failUrl: string;
    addressId?: string;
    note?: string;
    discount?: number;
    source: "Dine-in" | "web",
}

/**
 * {
    "discount": 0,
    "tax": 0,
    "shippingCost": 0,
    "applicationFeeAmount": 299,
    "totalAmount": 6659
}
 */

export interface BreakdownResponse {
    discount: number;
    tax: number;
    shippingCost: number;
    applicationFeeAmount: number;
    totalAmount: number;
}
class CartRepository {
    /**
     * Add item to cart
     * @param data Item data to add to the cart
     * @returns Response from the cart
     */
    async addItemToCart(data: {
        menuItemId: string;
        quantity: number;
        selectedOptions: {
            optionId: string;
            choiceIds: string[];
        }[];
    }) {
        return await makeRequest({
            method: "POST",
            url: `${BASE_URL}/pickup-cart`,
            data: {
                menuItemId: data.menuItemId,
                quantity: data.quantity,
                selectedOptions: data.selectedOptions.map(option => ({
                    optionId: option.optionId,
                    choiceIds: option.choiceIds,
                })),
            },
            withCredentials: true,
        });
    }

    /**
     * Get user cart
     * @returns User cart data
     */
    async getCart() {
        const { data } = await makeRequest<unknown, ICart>({
            method: "GET",
            url: `${BASE_URL}/pickup-cart`,
        });
        return data;
    }

    async postCheckout({ successUrl, failUrl, addressId, note, discount }: CheckoutData): Promise<CheckoutResponse> {
        const { data } = await makeRequest<CheckoutData, CheckoutResponse>({
            method: "POST",
            url: `${BASE_URL}/pickup-cart/checkout`,
            data: {
                successUrl,
                failUrl,
                addressId: addressId ? addressId : undefined,
                note,
                discount: discount,
                source: 'Dine-in',
            },
        });
        return data;
    };


    breakdown = async ({ addressId, note, discount }: {
        addressId?: string;
        note?: string;
        discount?: string;
    }): Promise<BreakdownResponse> => {
        try {

            const { data } = await makeRequest<{
                successUrl: string;
                failUrl: string;
                addressId?: string;
                note?: string;
                discount?: string;
                source: "web";
            }, BreakdownResponse>({
                method: "POST",
                url: `${BASE_URL}/pickup-cart/breakdown`,
                data: {
                    successUrl: "",
                    failUrl: "",
                    addressId: addressId ? addressId : undefined,
                    note,
                    discount,
                    source: "web",
                },
            });
            return data;
        } catch (error) {
            if (error instanceof AxiosError && error?.response?.status === 400) {
                return error?.response?.data;
            }
            throw error;
        }
    };

    /**
     * Clear user cart
     * @returns Response after clearing the cart
     */
    async clearCart() {
        return await makeRequest<void, unknown>({
            method: "DELETE",
            url: `${BASE_URL}/pickup-cart`,
        });
    }

    /**
     * Update item quantity in cart
     * @param itemId Item ID in the cart
     * @param quantity New quantity for the item
     * @returns Response from the cart
     */
    async updateItemQuantity(itemId: string, quantity: number) {
        return await makeRequest<{ quantity: number }, unknown>({
            method: "PUT",
            url: `${BASE_URL}/pickup-cart/items/${itemId}`,
            data: { quantity },
        });
    }

    /**
     * Remove item from cart
     * @param itemId Item ID to remove
     * @returns Response after removing the item
     */
    async removeItemFromCart(itemId: string) {
        return await makeRequest<void, unknown>({
            method: "DELETE",
            url: `${BASE_URL}/pickup-cart/items/${itemId}`,
        });
    }
}

export const cartApi = new CartRepository();

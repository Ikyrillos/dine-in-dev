import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type {
    AddItemToCartDto,
    Cart,
    UpdateCartItemDto,
} from "../models/dtos/cart-dtos";
import { oldCartApi } from "../repositories/cart_repository";

// Query Keys
export const CART_QUERY_KEYS = {
    cart: (tableId: string) => ["cart", tableId],
    allCarts: () => ["carts"],
} as const;

/**
 * Hook to get table cart data
 */
export const useGetTableCart = (tableId: string) => {
    return useQuery({
        queryKey: CART_QUERY_KEYS.cart(tableId),
        queryFn: async () => {
            const response = await oldCartApi.getTable(tableId);
            // Handle different possible response structures
            if (response?.data) {
                return response.data;
            }
            return response;
        },
        enabled: !!tableId,
    });
};

/**
 * Hook to add item to table cart
 */
export const useAddItemToCart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (
            { tableId, data }: { tableId: string; data: AddItemToCartDto },
        ) => oldCartApi.addItemToTable(tableId, data),
        onSuccess: (response, { tableId }) => {
            // Update the cart data in cache with the response
            queryClient.setQueryData(
                CART_QUERY_KEYS.cart(tableId),
                (response && typeof response === "object" && "data" in response)
                    ? (response as any).data
                    : response,
            );
            // Also invalidate to ensure fresh data
            queryClient.invalidateQueries({
                queryKey: CART_QUERY_KEYS.cart(tableId),
            });
        },
        onError: (error) => {
            console.error("Error adding item to cart:", error);
        },
    });
};

// checkout
export const useCheckoutCart = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ tableId, note, discount, paymentMethod }: {
            tableId: string;
            note?: string;
            discount?: number;
            paymentMethod: "cash" | "card";
        }
        ) => oldCartApi.checkoutCart(tableId, note, discount, paymentMethod),
        onSuccess: (_response, data) => {
            // Invalidate the cart query to ensure it refetch
            queryClient.invalidateQueries({
                queryKey: CART_QUERY_KEYS.cart(data.tableId),
            });
        },
        onError: (error) => {
            console.error("Error during checkout:", error);
        },
    });
};

/**
 * Hook to update cart item quantity
 */
export const useUpdateCartItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ optionsHash, data, tableId }: {
            optionsHash: string;
            data: UpdateCartItemDto;
            tableId: string;
        }) => oldCartApi.updateCartItem(optionsHash, data, tableId),
        onSuccess: (response, { tableId }) => {
            // Update the cart data in cache with the response
            queryClient.setQueryData(
                CART_QUERY_KEYS.cart(tableId),
                response?.data || response,
            );
            // Also invalidate to ensure fresh data
            queryClient.invalidateQueries({
                queryKey: CART_QUERY_KEYS.cart(tableId),
            });
        },
        onError: (error) => {
            console.error("Error updating cart item:", error);
        },
    });
};

/**
 * Hook to remove item from cart
 */
export const useRemoveCartItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (
            { tableId, optionsHash }: { tableId: string; optionsHash: string },
        ) => oldCartApi.removeCartItem(tableId, optionsHash),
        onSuccess: (response, { tableId }) => {
            // Update the cart data in cache with the response
            queryClient.setQueryData(
                CART_QUERY_KEYS.cart(tableId),
                response?.data || response,
            );
            // Also invalidate to ensure fresh data
            queryClient.invalidateQueries({
                queryKey: CART_QUERY_KEYS.cart(tableId),
            });
        },
        onError: (error) => {
            console.error("Error removing cart item:", error);
        },
    });
};

/**
 * Hook to clear entire cart
 */
export const useClearCart = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (tableId: string) => oldCartApi.clearCart(tableId),
        onSuccess: (_response, tableId) => {
            // Invalidate the cart query to ensure it refetch
            queryClient.invalidateQueries({
                queryKey: CART_QUERY_KEYS.cart(tableId),
            });
            navigate({
                reloadDocument: true,
            });
        },
        onError: (error) => {
            console.error("Error clearing cart:", error);
        },
    });
};

/**
 * Combined hook for all cart operations
 * Provides all cart-related mutations and queries in one place
 */
export const useCartOperations = (tableId: string) => {
    const cartQuery = useGetTableCart(tableId);
    const addItemMutation = useAddItemToCart();
    const updateItemMutation = useUpdateCartItem();
    const removeItemMutation = useRemoveCartItem();
    const clearCartMutation = useClearCart();

    return {
        // Query data
        cart: cartQuery.data as Cart | undefined,
        isLoading: cartQuery.isLoading,
        isError: cartQuery.isError,
        error: cartQuery.error,

        // Mutations
        addItem: (data: AddItemToCartDto) =>
            addItemMutation.mutate({ tableId, data }),
        updateItem: (optionsHash: string, data: UpdateCartItemDto) =>
            updateItemMutation.mutate({ optionsHash, data, tableId }),
        removeItem: (optionsHash: string) =>
            removeItemMutation.mutate({ tableId, optionsHash }),
        clearCart: () => clearCartMutation.mutate(tableId),

        getCart: () => {
            console.log("Refetching cart data... tableId:", tableId);
            return cartQuery.refetch();
        },

        // Mutation states
        isAddingItem: addItemMutation.isPending,
        isUpdatingItem: updateItemMutation.isPending,
        isRemovingItem: removeItemMutation.isPending,
        isClearingCart: clearCartMutation.isPending,

        // Any mutation in progress
        isProcessing: addItemMutation.isPending ||
            updateItemMutation.isPending ||
            removeItemMutation.isPending ||
            clearCartMutation.isPending,
    };
};

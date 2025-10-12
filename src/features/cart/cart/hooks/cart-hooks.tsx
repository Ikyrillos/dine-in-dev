import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ICart } from "../models/cart-item-model";
import { cartApi } from "../repository/cart_repository";
import { reactKeys } from "./cart-keys";

// ---------------------
// Get Cart
// ---------------------
export const useGetCart = () => {
  return useQuery({
    queryKey: [reactKeys.cart],
    queryFn: async () => {
      try {
        return await cartApi.getCart();
      } catch (error: any) {
        if (error?.response?.status !== 401) {
          console.error("Error fetching cart:", error);
        }
        return null;
      }
    },
    staleTime: 0,
    retry: 1,
  });
};

// ---------------------
// Get Cart Breakdown
// ---------------------
export const useGetBreakDown = (promoCode?: string) => {
  return useQuery({
    queryKey: [reactKeys.cartBreakdown, promoCode],
    queryFn: async () => {
      try {
        return await cartApi.breakdown({
          addressId: "",
          note: "",
          discount: promoCode,
        });
      } catch (error: any) {
        if (error?.response?.status !== 401) {
          console.error("Error fetching cart breakdown:", error);
        }
        return null;
      }
    },
    staleTime: 0,
    retry: 1,
    enabled: true,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
};

// ---------------------
// Add to Cart
// ---------------------
export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      menuItemId: string;
      quantity: number;
      selectedOptions: { optionId: string; choiceIds: string[] }[];
    }) => cartApi.addItemToCart(data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [reactKeys.cart] });
      queryClient.invalidateQueries({ queryKey: [reactKeys.cartBreakdown] });
    },

    onError: (error) => {
      console.error("Error adding item to cart:", error);
    },
  });
};

// ---------------------
// Clear Cart
// ---------------------
export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cartApi.clearCart(),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [reactKeys.cart] });
      const previousCart = queryClient.getQueryData<ICart>([reactKeys.cart]);

      queryClient.setQueryData([reactKeys.cart], {
        items: [],
        totalAmount: 0,
      });

      return { previousCart };
    },

    onError: (error, _variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData([reactKeys.cart], context.previousCart);
      }
      console.error("Error clearing cart:", error);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [reactKeys.cart] });
      queryClient.invalidateQueries({ queryKey: [reactKeys.cartBreakdown] });
    },
  });
};

// ---------------------
// Update Cart Item Quantity
// ---------------------
export const useUpdateCartItemQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateItemQuantity(itemId, quantity),

    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: [reactKeys.cart] });
      const previousCart = queryClient.getQueryData<ICart>([reactKeys.cart]);

      if (previousCart) {
        const updatedItems = previousCart.items.map((item) =>
          item._id === itemId ? { ...item, quantity } : item
        );

        queryClient.setQueryData([reactKeys.cart], {
          ...previousCart,
          items: updatedItems,
        });
      }

      return { previousCart };
    },

    onError: (error, _variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData([reactKeys.cart], context.previousCart);
      }
      console.error("Error updating cart item quantity:", error);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [reactKeys.cart] });
      queryClient.invalidateQueries({ queryKey: [reactKeys.cartBreakdown] });
    },
  });
};

// ---------------------
// Remove Item from Cart
// ---------------------
export const useRemovePickupCartItem = () => {
  const queryClient = useQueryClient();
  const cart = useGetCart();

  return useMutation({
    mutationFn: (itemId: string) => cartApi.removeItemFromCart(itemId),

    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: [reactKeys.cart] });
      const previousCart = queryClient.getQueryData<ICart>([reactKeys.cart]);

      if (previousCart) {
        const updatedItems = previousCart.items.filter(
          (item) => item._id !== itemId
        );

        queryClient.setQueryData([reactKeys.cart], {
          ...previousCart,
          items: updatedItems,
        });
      }

      cart.refetch();
      return { previousCart };
    },

    onError: (error, _variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData([reactKeys.cart], context.previousCart);
      }
      console.error("Error removing item from cart:", error);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [reactKeys.cart] });
      queryClient.invalidateQueries({ queryKey: [reactKeys.cartBreakdown] });
    },
  });
};

// ---------------------
// Checkout Pickup Cart
// ---------------------
export const useCheckoutPickupCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      successUrl,
      failUrl,
      addressId,
      note,
      discount,
      paymentMethod
    }: {
      successUrl: string;
      failUrl: string;
      addressId?: string;
      note?: string;
      discount?: number;
      paymentMethod: "cash" | "card";
    }) => cartApi.postCheckout({
      successUrl,
      failUrl,
      addressId,
      note,
      discount,
      source: "Dine-in",
      paymentMethod,
    }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [reactKeys.cart] });
      queryClient.invalidateQueries({ queryKey: [reactKeys.cartBreakdown] });
    },

    onError: (error) => {
      console.error("Error during pickup checkout:", error);
    },
  });
};

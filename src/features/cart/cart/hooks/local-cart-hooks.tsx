import type { IMenuItem } from "@/core/models/IMenuItem";
import type { CartItemOption } from "@/core/models/dtos/cart-dtos";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { localCartApi } from "../repository/local_cart_repository";
import { useLocalCartStore } from "../stores/localCartStore";
import { reactKeys } from "./cart-keys";

// Hook to add item to local cart
export const useAddToLocalCart = () => {
  const addItem = useLocalCartStore(state => state.addItem);

  return {
    addItem: (menuItem: IMenuItem, quantity: number, selectedOptions: CartItemOption[] = []) => {
      addItem(menuItem, quantity, selectedOptions);
    }
  };
};

// Hook to remove item from local cart
export const useRemoveFromLocalCart = () => {
  const removeItem = useLocalCartStore(state => state.removeItem);

  return {
    removeItem: (optionsHash: string) => {
      removeItem(optionsHash);
    }
  };
};

// Hook to update item quantity in local cart
export const useUpdateLocalCartItem = () => {
  const updateItemQuantity = useLocalCartStore(state => state.updateItemQuantity);

  return {
    updateQuantity: (optionsHash: string, quantity: number) => {
      updateItemQuantity(optionsHash, quantity);
    }
  };
};

// Hook to clear local cart
export const useClearLocalCart = () => {
  const clearCart = useLocalCartStore(state => state.clearCart);

  return {
    clearCart
  };
};

// Hook to submit batch operations to server
export const useSubmitCartOperations = (tableId?: string) => {
  const queryClient = useQueryClient();
  const getOperations = useLocalCartStore(state => state.getOperations);
  const clearOperations = useLocalCartStore(state => state.clearOperations);

  return useMutation({
    mutationFn: async () => {
      const operations = getOperations();
      if (operations.length === 0) {
        throw new Error('No operations to submit');
      }
      return await localCartApi.submitBatchOperations(operations, tableId);
    },

    onSuccess: () => {
      // Clear operations after successful submission
      clearOperations();

      // Invalidate server cart queries to refresh data
      queryClient.invalidateQueries({ queryKey: [reactKeys.cart] });
      queryClient.invalidateQueries({ queryKey: [reactKeys.cartBreakdown] });
    },

    onError: (error) => {
      console.error("Error submitting cart operations:", error);
    },

    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook to automatically submit operations when certain conditions are met
export const useAutoSubmitCartOperations = (options?: {
  maxOperations?: number;
  autoSubmitDelay?: number;
  tableId?: string;
}) => {
  const { maxOperations = 10, autoSubmitDelay = 5000, tableId } = options || {};
  const operations = useLocalCartStore(state => state.operations);
  const submitOperations = useSubmitCartOperations(tableId);

  React.useEffect(() => {
    // Auto-submit when reaching max operations
    if (operations.length >= maxOperations && !submitOperations.isPending) {
      submitOperations.mutate();
      return;
    }

    // Auto-submit after delay if there are operations
    if (operations.length > 0 && !submitOperations.isPending) {
      const timer = setTimeout(() => {
        submitOperations.mutate();
      }, autoSubmitDelay);

      return () => clearTimeout(timer);
    }
  }, [operations.length, maxOperations, autoSubmitDelay, submitOperations]);

  return {
    isAutoSubmitting: submitOperations.isPending,
    operationsCount: operations.length,
    manualSubmit: () => submitOperations.mutate()
  };
};

// Hook to sync local cart with server
export const useSyncCartWithServer = () => {
  const queryClient = useQueryClient();
  const clearCart = useLocalCartStore(state => state.clearCart);

  return useMutation({
    mutationFn: () => localCartApi.syncWithServer(),

    onSuccess: (serverCart) => {
      // Clear local cart and operations
      clearCart();

      // Update server cart cache
      queryClient.setQueryData([reactKeys.cart], serverCart);
      queryClient.invalidateQueries({ queryKey: [reactKeys.cartBreakdown] });
    },

    onError: (error) => {
      console.error("Error syncing cart with server:", error);
    },
  });
};

// Hook to get local cart state
export const useLocalCart = () => {
  const items = useLocalCartStore(state => state.items);
  const operations = useLocalCartStore(state => state.operations);
  const currentTableId = useLocalCartStore(state => state.currentTableId);
  const setCurrentTableId = useLocalCartStore(state => state.setCurrentTableId);
  const getTotalAmount = useLocalCartStore(state => state.getTotalAmount);
  const getItemByHash = useLocalCartStore(state => state.getItemByHash);
  const loadFromLocalStorage = useLocalCartStore(state => state.loadFromLocalStorage);

  return {
    items,
    operations,
    currentTableId,
    setCurrentTableId,
    totalAmount: getTotalAmount(),
    getItemByHash,
    loadFromLocalStorage,
    hasOperations: operations.length > 0
  };
};
import type { IMenuItem } from '@/core/models/IMenuItem';
import type {
  AddToCartDto,
  BatchCartOperation,
  CartItemOption,
  LocalCartItem
} from '@/core/models/dtos/cart-dtos';
import { create } from 'zustand';
import { generateOptionsHash } from '../utils/hash-generator';

interface LocalCartState {
  items: LocalCartItem[];
  operations: BatchCartOperation[];
  currentTableId: string | null;
  setCurrentTableId: (tableId: string | null) => void;
  addItem: (menuItem: IMenuItem, quantity: number, selectedOptions: CartItemOption[]) => void;
  removeItem: (optionsHash: string) => void;
  updateItemQuantity: (optionsHash: string, quantity: number) => void;
  clearCart: () => void;
  clearOperations: () => void;
  getOperations: () => BatchCartOperation[];
  getTotalAmount: () => number;
  getItemByHash: (optionsHash: string) => LocalCartItem | undefined;
  loadFromLocalStorage: () => void;
}

const CART_STORAGE_KEY = 'local-cart';
const OPERATIONS_STORAGE_KEY = 'cart-operations';

// Helper functions to generate table-specific storage keys
const getTableStorageKey = (baseKey: string, tableId: string | null) => {
  if (!tableId) return baseKey; // For pickup orders or when no table is specified
  return `${baseKey}-table-${tableId}`;
};

export const useLocalCartStore = create<LocalCartState>((set, get) => ({
  items: [],
  operations: [],
  currentTableId: null,

  setCurrentTableId: (tableId) => {
    set({ currentTableId: tableId });
    // Load items and operations for the new table
    get().loadFromLocalStorage();
  },

  addItem: (menuItem, quantity, selectedOptions) => {
    const optionsHash = generateOptionsHash(menuItem._id, selectedOptions);
    const now = new Date().toISOString();

    set((state) => {
      const existingItemIndex = state.items.findIndex(item => item.optionsHash === optionsHash);
      let newItems: LocalCartItem[];
      let newOperations: BatchCartOperation[];

      if (existingItemIndex !== -1) {
        // Update existing item
        const existingItem = state.items[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;

        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: newQuantity, updatedAt: now }
            : item
        );

        // Check if there's already an add-item operation for this item configuration
        const existingAddOperation = state.operations.find(
          op => op.action === 'add-item' &&
               op.data &&
               (op.data as AddToCartDto).menuItemId === menuItem._id &&
               JSON.stringify((op.data as AddToCartDto).selectedOptions) === JSON.stringify(selectedOptions)
        );

        if (existingAddOperation) {
          // If there's an add-item operation, update its quantity
          newOperations = state.operations.map(op =>
            op === existingAddOperation
              ? {
                  ...op,
                  data: {
                    ...(op.data as AddToCartDto),
                    quantity: newQuantity
                  }
                } as BatchCartOperation
              : op
          );
        } else {
          // Add update operation, removing any previous update operations for this hash
          newOperations = [
            ...state.operations.filter(op => !('optionsHash' in op && op.optionsHash === optionsHash && op.action === 'update-item')),
            {
              action: 'update-item',
              optionsHash,
              data: { quantity: newQuantity }
            } as BatchCartOperation
          ];
        }
      } else {
        // Add new item
        const newItem: LocalCartItem = {
          menuItem,
          quantity,
          selectedOptions,
          optionsHash,
          createdAt: now,
          updatedAt: now
        };

        newItems = [...state.items, newItem];

        // Add add-item operation
        newOperations = [
          ...state.operations,
          {
            action: 'add-item',
            data: {
              menuItemId: menuItem._id,
              quantity,
              selectedOptions
            }
          } as BatchCartOperation
        ];
      }

      // Save to localStorage with table-specific keys
      const { currentTableId } = get();
      const cartKey = getTableStorageKey(CART_STORAGE_KEY, currentTableId);
      const operationsKey = getTableStorageKey(OPERATIONS_STORAGE_KEY, currentTableId);

      localStorage.setItem(cartKey, JSON.stringify(newItems));
      localStorage.setItem(operationsKey, JSON.stringify(newOperations));

      return { items: newItems, operations: newOperations };
    });
  },

  removeItem: (optionsHash) => {
    set((state) => {
      const newItems = state.items.filter(item => item.optionsHash !== optionsHash);

      // Find the item that's being removed to get its menuItem and selectedOptions
      const itemToRemove = state.items.find(item => item.optionsHash === optionsHash);

      // Check if there's an add-item operation for this item configuration
      const existingAddOperation = itemToRemove ? state.operations.find(
        op => op.action === 'add-item' &&
             op.data &&
             (op.data as AddToCartDto).menuItemId === itemToRemove.menuItem._id &&
             JSON.stringify((op.data as AddToCartDto).selectedOptions) === JSON.stringify(itemToRemove.selectedOptions)
      ) : null;

      let newOperations: BatchCartOperation[];

      if (existingAddOperation) {
        // If there's an add-item operation, just remove it
        // (no need to send remove-item for something that was just added locally)
        newOperations = state.operations.filter(op => op !== existingAddOperation);
      } else {
        // Add remove operation, removing any previous operations for this hash
        newOperations = [
          ...state.operations.filter(op => !('optionsHash' in op && op.optionsHash === optionsHash)),
          {
            action: 'remove-item',
            optionsHash,
            data: null
          } as BatchCartOperation
        ];
      }

      // Save to localStorage with table-specific keys
      const { currentTableId } = get();
      localStorage.setItem(getTableStorageKey(CART_STORAGE_KEY, currentTableId), JSON.stringify(newItems));
      localStorage.setItem(getTableStorageKey(OPERATIONS_STORAGE_KEY, currentTableId), JSON.stringify(newOperations));

      return { items: newItems, operations: newOperations };
    });
  },

  updateItemQuantity: (optionsHash, quantity) => {
    if (quantity <= 0) {
      get().removeItem(optionsHash);
      return;
    }

    set((state) => {
      const now = new Date().toISOString();
      const newItems = state.items.map(item =>
        item.optionsHash === optionsHash
          ? { ...item, quantity, updatedAt: now }
          : item
      );

      // Find the item to get its menuItem and selectedOptions
      const item = state.items.find(item => item.optionsHash === optionsHash);
      if (!item) return { items: state.items, operations: state.operations };

      // Check if there's an add-item operation for this item configuration
      const existingAddOperation = state.operations.find(
        op => op.action === 'add-item' &&
             op.data &&
             (op.data as AddToCartDto).menuItemId === item.menuItem._id &&
             JSON.stringify((op.data as AddToCartDto).selectedOptions) === JSON.stringify(item.selectedOptions)
      );

      let newOperations: BatchCartOperation[];

      if (existingAddOperation) {
        // If there's an add-item operation, update its quantity
        newOperations = state.operations.map(op =>
          op === existingAddOperation
            ? {
                ...op,
                data: {
                  ...(op.data as AddToCartDto),
                  quantity
                }
              } as BatchCartOperation
            : op
        );
      } else {
        // Add update operation, removing any previous update operations for this hash
        newOperations = [
          ...state.operations.filter(op => !('optionsHash' in op && op.optionsHash === optionsHash && op.action === 'update-item')),
          {
            action: 'update-item',
            optionsHash,
            data: { quantity }
          } as BatchCartOperation
        ];
      }

      // Save to localStorage with table-specific keys
      const { currentTableId } = get();
      localStorage.setItem(getTableStorageKey(CART_STORAGE_KEY, currentTableId), JSON.stringify(newItems));
      localStorage.setItem(getTableStorageKey(OPERATIONS_STORAGE_KEY, currentTableId), JSON.stringify(newOperations));

      return { items: newItems, operations: newOperations };
    });
  },

  clearCart: () => {
    const { currentTableId } = get();
    localStorage.removeItem(getTableStorageKey(CART_STORAGE_KEY, currentTableId));
    localStorage.removeItem(getTableStorageKey(OPERATIONS_STORAGE_KEY, currentTableId));
    set({ items: [], operations: [] });
  },

  clearOperations: () => {
    const { currentTableId } = get();
    localStorage.removeItem(getTableStorageKey(OPERATIONS_STORAGE_KEY, currentTableId));
    set((state) => ({ ...state, operations: [] }));
  },

  getOperations: () => get().operations,

  getTotalAmount: () => {
    const { items } = get();
    return items.reduce((total, item) => {
      const basePrice = item.menuItem.price * item.quantity;
      const optionsPrice = item.selectedOptions.reduce((optTotal, selectedOption) => {
        const option = item.menuItem.options.find(opt => opt._id === selectedOption.optionId);
        if (!option) return optTotal;

        const choicesPrice = selectedOption.choiceIds.reduce((choiceTotal, choiceId) => {
          const choice = option.choices?.find(c => c._id === choiceId);
          return choiceTotal + (choice?.price || 0);
        }, 0);

        return optTotal + choicesPrice;
      }, 0);

      return total + basePrice + (optionsPrice * item.quantity);
    }, 0);
  },

  getItemByHash: (optionsHash) => {
    return get().items.find(item => item.optionsHash === optionsHash);
  },

  loadFromLocalStorage: () => {
    try {
      const { currentTableId } = get();
      const cartKey = getTableStorageKey(CART_STORAGE_KEY, currentTableId);
      const operationsKey = getTableStorageKey(OPERATIONS_STORAGE_KEY, currentTableId);

      const storedItems = localStorage.getItem(cartKey);
      const storedOperations = localStorage.getItem(operationsKey);

      const items = storedItems ? JSON.parse(storedItems) : [];
      const operations = storedOperations ? JSON.parse(storedOperations) : [];

      set({
        items,
        operations
      });
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      set({ items: [], operations: [] });
    }
  }
}));
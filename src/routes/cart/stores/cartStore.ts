import type { IOption } from '@/core/models/IMenuItem';
import { create } from "zustand";

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    options?: IOption[];
    uniqueId?: string;
    createdAt?: string;
    totalItemPrice?: number; // New field to store calculated total price
}

interface CartState {
    cart: CartItem[];
    isEditing: boolean;
    editingItem: CartItem | null;
    addToCart: (item: CartItem) => void;
    removeFromCart: (item: CartItem) => void;
    removeWholeItem: (item: CartItem) => void;
    clearCart: () => void;
    setEditingItem: (item: CartItem | null) => void;
    setIsEditing: (status: boolean) => void;
    editCartItem: (updatedItem: CartItem) => void;
    loadCartFromLocalStorage: () => void;
    calculateItemTotalPrice: (item: CartItem) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    cart: [],
    isEditing: false,
    editingItem: null,

    calculateItemTotalPrice: (item) => {
        // Calculate base item price
        let totalPrice = item.price * item.quantity;

        // Add prices of selected options
        if (item.options) {
            item.options.forEach(option => {
                // Assuming the option already contains the selected items
                totalPrice += option.price * item.quantity;
            });
        }

        return totalPrice;
    },

    addToCart: (item) => {
        const { cart, calculateItemTotalPrice } = get();

        // Calculate total item price including options
        const totalItemPrice = calculateItemTotalPrice(item);

        // Find an exact match including options
        const existingItemIndex = cart.findIndex(
            (cartItem) =>
                cartItem.id === item.id &&
                cartItem.name === item.name)

        if (existingItemIndex !== -1) {
            // Update quantity if exact match exists
            const updatedCart = cart.map((cartItem, index) =>
                index === existingItemIndex
                    ? {
                        ...cartItem,
                        quantity: cartItem.quantity + item.quantity,
                        totalItemPrice: calculateItemTotalPrice({
                            ...cartItem,
                            quantity: cartItem.quantity + item.quantity
                        })
                    }
                    : cartItem
            );
            set({ cart: updatedCart });
            saveCartToLocalStorage(updatedCart);
        } else {
            // Add new item with unique ID for distinct options
            const newItem = {
                ...item,
                uniqueId: `${item.id}-${Date.now()}`,
                createdAt: new Date().toISOString(),
                totalItemPrice: totalItemPrice
            };
            const updatedCart = [...cart, newItem];
            set({ cart: updatedCart });
            saveCartToLocalStorage(updatedCart);
        }
    },

    removeFromCart: (currentItem) => {
        const { cart, calculateItemTotalPrice } = get();

        // Find exact match including options
        const itemIndex = cart.findIndex(
            item =>
                item.id === currentItem.id &&
                item.name === currentItem.name
        );

        if (itemIndex === -1) return; // Item not found

        let updatedCart;
        if (cart[itemIndex].quantity > 1) {
            // Reduce quantity of exact match
            updatedCart = cart.map((item, index) =>
                index === itemIndex
                    ? {
                        ...item,
                        quantity: item.quantity - 1,
                        totalItemPrice: calculateItemTotalPrice({
                            ...item,
                            quantity: item.quantity - 1
                        })
                    }
                    : item
            );
        } else {
            // Remove exact match item completely
            updatedCart = cart.filter((_item, index) => index !== itemIndex);
        }

        set({ cart: updatedCart });
        saveCartToLocalStorage(updatedCart);
    },

    removeWholeItem: (item) => {
        const { cart } = get();

        // Remove only the exact match with same id, name, and options
        const updatedCart = cart.filter(
            cartItem =>
                !(cartItem.id === item.id &&
                    cartItem.name === item.name)
        );

        if (cart.length === updatedCart.length) return; // Item not found

        set({ cart: updatedCart });
        saveCartToLocalStorage(updatedCart);
    },

    clearCart: () => {
        set({ cart: [] });
        localStorage.removeItem("cart");
    },

    setEditingItem: (item) => set({ editingItem: item, isEditing: !!item }),
    setIsEditing: (status) => set({ isEditing: status }),

    editCartItem: (updatedItem) => {
        const { cart, calculateItemTotalPrice, editingItem } = get();
        if (!editingItem) return;

        const updatedCart = cart.map((item) =>
            item.uniqueId === editingItem.uniqueId
                ? {
                    ...updatedItem,
                    totalItemPrice: calculateItemTotalPrice(updatedItem)
                }
                : item
        );
        set({ cart: updatedCart, isEditing: false, editingItem: null });
        saveCartToLocalStorage(updatedCart);
    },

    loadCartFromLocalStorage: () => {
        const storedCart = localStorage.getItem("cart");
        if (storedCart) {
            set({ cart: JSON.parse(storedCart) });
        }
    },
}));

const saveCartToLocalStorage = (cart: CartItem[]) => {
    localStorage.setItem("cart", JSON.stringify(cart));
};

// function _areOptionsEqual(
//     options1: OptionItem[] | undefined,
//     options2: OptionItem[] | undefined
// ): boolean {
//     // Handle undefined or empty arrays
//     if (!options1 && !options2) return true;
//     if (!options1 || !options2) return false;
//     if (options1.length !== options2.length) return false;

//     // Sort and compare options by id to ensure consistent comparison
//     const sortedOptions1 = [...options1].sort((a, b) => a.id - b.id);
//     const sortedOptions2 = [...options2].sort((a, b) => a.id - b.id);

//     // Deep compare sorted options
//     return sortedOptions1.every((option, index) =>
//         option.id === sortedOptions2[index].id &&
//         option.name === sortedOptions2[index].name
//     );
// }
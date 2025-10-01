import type { ICartItem } from "@/features/cart/cart/models/cart-item-model";
import type { IMenuItem, IOption } from "../IMenuItem";

// ✅ make types match API response
export interface CartItemOption {
  optionId: string;
  choiceIds: string[];
}

export interface CartItem {
  menuItem: {
    _id: string;            // treat as string; backend sends ObjectId
    name: string;
    price: number;
    photoUrl?: string;
    options: IOption[];

  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedOptions: CartItemOption[];
  optionsHash: string;      // unique per config — perfect for keys/actions
  createdAt: string;        // JSON strings, not Date instances
  updatedAt: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: ICartItem[];
  printedItems: ICartItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

// Local cart types for new implementation
export interface LocalCartItem {
  menuItem: IMenuItem;
  quantity: number;
  selectedOptions: CartItemOption[];
  optionsHash: string;
  createdAt: string;
  updatedAt: string;
}

// Base interface for cart operations
interface BaseCartOperation {
  action: 'add-item' | 'remove-item' | 'update-item';
  data: AddToCartDto | UpdateCartItemDto | null;
}

// Add item operation (no optionsHash required)
interface AddItemOperation extends BaseCartOperation {
  action: 'add-item';
  data: AddToCartDto;
  optionsHash: string;
}

// Update item operation (requires optionsHash)
interface UpdateItemOperation extends BaseCartOperation {
  action: 'update-item';
  optionsHash: string;
  data: UpdateCartItemDto;
}

// Remove item operation (requires optionsHash)
interface RemoveItemOperation extends BaseCartOperation {
  action: 'remove-item';
  optionsHash: string;
  data: null;
}

export type BatchCartOperation = AddItemOperation | UpdateItemOperation | RemoveItemOperation;

// DTOs for API requests
export interface AddToCartDto {
    menuItemId: string;
    quantity: number;
    selectedOptions: CartItemOption[];
}

export interface UpdateCartItemDto {
    quantity: number;
}


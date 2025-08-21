
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
    // add whatever else you actually use (category, description...)
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
  items: CartItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}


// DTOs for API requests
export interface AddItemToCartDto {
    menuItemId: string;
    quantity: number;
    selectedOptions: CartItemOption[];
}

export interface UpdateCartItemDto {
    quantity: number;
}
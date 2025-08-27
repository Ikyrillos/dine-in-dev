// Define a type for each order item.
export interface IOrderItem {
    menuItemId: string;
    quantity: number;
  }
  
  // Define union types for known statuses or methods if applicable.
  // Otherwise, you can leave them as string.
  export type OrderStatus = "pending" | "processing" | "completed" | "cancelled" | string;
  export type PaymentMethod = "credit-card" | "paypal" | "cash" | string;
  export type PaymentStatus = "paid" | "unpaid" | string;
  
  // Define the main Order type.
  export interface IOrder {
    _id: string;
    status: OrderStatus;
    items: IOrderItem[];
    deliveryAddress: string;
    expectedDeliveryTime: string; // ISO date string. Use Date if you're parsing it.
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    createdAt: string; // ISO date string.
    updatedAt: string; // ISO date string.
  }
  
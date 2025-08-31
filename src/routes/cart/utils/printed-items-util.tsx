// src/core/utils/compareCartWithPrintedItems.ts
import type { ICartItem } from "@/routes/cart/models/cart-item-model";

export function getUnprintedItems(
  originalItems: ICartItem[],
  printedItems: ICartItem[]
): ICartItem[] {
  // Create a map of printed quantities by optionsHash
  const printedMap = new Map<string, number>();

  for (const item of printedItems) {
    printedMap.set(
      item.optionsHash,
      (printedMap.get(item.optionsHash) || 0) + item.quantity
    );
  }

  const result: ICartItem[] = [];

  for (const item of originalItems) {
    const printedQty = printedMap.get(item.optionsHash) || 0;

    if (item.quantity > printedQty) {
      // Push a copy with adjusted quantity & totalPrice
      result.push({
        ...item,
        quantity: item.quantity - printedQty,
        totalPrice: (item.quantity - printedQty) * item.unitPrice,
      });
    }
  }

  return result;
}

import { BASE_URL } from "@/core/apis-endpoints";
import { makeRequest } from "@/core/make-request";
import type { BatchCartOperation } from "@/core/models/dtos/cart-dtos";

class LocalCartRepository {
  /**
   * Submit batch cart operations to the server
   * @param operations Array of cart operations to submit
   * @param tableId Optional table ID for table orders (uses pickup-cart if not provided)
   * @returns Response from the server
   */
  async submitBatchOperations(operations: BatchCartOperation[], tableId?: string) {
    const foundationId = localStorage.getItem("x-foundation-id");

    // Validate operations before sending
    const validatedOperations = operations.map(op => {
      if (op.action === 'add-item' && !op.data) {
        console.error('add-item operation missing data:', op);
        throw new Error('add-item operation requires data');
      }
      if (op.action === 'update-item' && !op.data) {
        console.error('update-item operation missing data:', op);
        throw new Error('update-item operation requires data');
      }
      return op;
    });

    // Format operations according to API specification
    const requestData = {
      actions: validatedOperations
    };

    console.log('Submitting batch operations:', JSON.stringify(requestData, null, 2));

    const url = tableId
      ? `${BASE_URL}/tables/${tableId}/batch-actions`
      : `${BASE_URL}/pickup-cart/batch-actions`;

    return await makeRequest({
      method: "POST",
      url,
      data: requestData,
      headers: { "x-foundation-id": foundationId || "" },
      withCredentials: true,
    });
  }

  /**
   * Clear all pending operations and sync with server cart
   * @returns Server cart data
   */
  async syncWithServer() {
    const foundationId = localStorage.getItem("x-foundation-id");

    const { data } = await makeRequest({
      method: "GET",
      url: `${BASE_URL}/pickup-cart?populate=menuItem`,
      headers: { "x-foundation-id": foundationId || "" },
    });

    return data;
  }
}

export const localCartApi = new LocalCartRepository();
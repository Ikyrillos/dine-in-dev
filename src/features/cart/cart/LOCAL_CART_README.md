# Local Cart Implementation

This directory contains the new local cart implementation that replaces server-side cart operations with local state management and batch submissions.

## Key Features

- **Local State Management**: Cart items are stored locally using Zustand
- **Hash-based Item Identification**: Uses MD5 hash generation for unique item identification
- **Batch Operations**: Groups cart operations and submits them to the server in batches
- **Automatic Retry**: Failed submissions are automatically retried with exponential backoff
- **Persistence**: Cart state is persisted to localStorage

## File Structure

```
/cart/
├── utils/
│   └── hash-generator.ts         # Hash generation algorithm
├── stores/
│   └── localCartStore.ts         # Local cart state management
├── repository/
│   └── local_cart_repository.ts  # API calls for batch operations
└── hooks/
    └── local-cart-hooks.tsx      # React hooks for cart operations
```

## Usage

### Basic Cart Operations

```tsx
import {
  useAddToLocalCart,
  useRemoveFromLocalCart,
  useUpdateLocalCartItem,
  useLocalCart
} from '@/features/cart/cart/hooks/local-cart-hooks';

function MyComponent() {
  const { addItem } = useAddToLocalCart();
  const { removeItem } = useRemoveFromLocalCart();
  const { updateQuantity } = useUpdateLocalCartItem();
  const { items, totalAmount, hasOperations } = useLocalCart();

  const handleAddItem = (menuItem, selectedOptions) => {
    addItem(menuItem, 1, selectedOptions);
  };

  return (
    <div>
      <p>Cart has {items.length} items</p>
      <p>Total: £{totalAmount.toFixed(2)}</p>
      {hasOperations && <p>Has pending operations</p>}
    </div>
  );
}
```

### Batch Submission

```tsx
import { useSubmitCartOperations } from '@/features/cart/cart/hooks/local-cart-hooks';

function SubmitButton() {
  const submitOperations = useSubmitCartOperations();

  const handleSubmit = () => {
    submitOperations.mutate();
  };

  return (
    <button
      onClick={handleSubmit}
      disabled={submitOperations.isPending}
    >
      {submitOperations.isPending ? 'Submitting...' : 'Submit to Server'}
    </button>
  );
}
```

### Auto-Submit

```tsx
import { useAutoSubmitCartOperations } from '@/features/cart/cart/hooks/local-cart-hooks';

function AutoSubmitCart() {
  const { isAutoSubmitting, operationsCount } = useAutoSubmitCartOperations({
    maxOperations: 10,    // Auto-submit after 10 operations
    autoSubmitDelay: 5000 // Auto-submit after 5 seconds of inactivity
  });

  return (
    <div>
      {isAutoSubmitting && <p>Auto-submitting operations...</p>}
      <p>{operationsCount} pending operations</p>
    </div>
  );
}
```

## Hash Generation

The cart uses MD5 hashing to create unique identifiers for cart items based on:
- Menu item ID
- Selected options and choices

```tsx
import { generateOptionsHash } from '@/features/cart/cart/utils/hash-generator';

const hash = generateOptionsHash(menuItemId, selectedOptions);
```

## Batch Operation Format

Operations are submitted to the server in the following format:

```json
{
  "actions": [
    {
      "action": "add-item",
      "data": {
        "menuItemId": "674b203c4068e001a50a1865",
        "quantity": 2,
        "selectedOptions": [
          {
            "optionId": "option1",
            "choiceIds": ["choice1", "choice2"]
          }
        ]
      }
    },
    {
      "action": "update-item",
      "optionsHash": "abc123def456",
      "data": {
        "quantity": 3
      }
    },
    {
      "action": "remove-item",
      "optionsHash": "def456gh1789",
      "data": null
    }
  ]
}
```

### API Endpoints

- **Table Orders**: `POST /tables/{tableId}/batch-actions`
- **Pickup Orders**: `POST /pickup-cart/batch`

## Migration from Server-Side Cart

To migrate from the existing server-side cart implementation:

1. Replace `useGetCart()` with `useLocalCart()`
2. Replace `useAddToCart()` with `useAddToLocalCart()`
3. Replace cart item operations with local cart hooks
4. Add batch submission logic where needed
5. Update cart display components to use local cart state

## Error Handling

The local cart includes automatic retry logic with exponential backoff. Failed operations remain in the queue and will be retried automatically.

## Performance Benefits

- **Immediate UI Updates**: No waiting for server responses
- **Reduced Server Load**: Fewer API calls through batching
- **Better User Experience**: Instant feedback on cart operations
- **Offline Support**: Cart works even when server is temporarily unavailable
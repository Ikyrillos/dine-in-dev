import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { IMenuItem } from '@/core/models/IMenuItem';
import type { CartItemOption } from '@/core/models/dtos/cart-dtos';
import {
  useAddToLocalCart,
  useClearLocalCart,
  useLocalCart,
  useRemoveFromLocalCart,
  useSubmitCartOperations,
  useUpdateLocalCartItem
} from '@/features/cart/cart/hooks/local-cart-hooks';
import { Minus, Plus, Trash2 } from 'lucide-react';
import React, { useEffect } from 'react';

interface LocalCartExampleProps {
  menuItems?: IMenuItem[];
  tableId?: string; // Optional table ID for table orders
}

export const LocalCartExample: React.FC<LocalCartExampleProps> = ({
  menuItems = [],
  tableId
}) => {
  const { addItem } = useAddToLocalCart();
  const { removeItem } = useRemoveFromLocalCart();
  const { updateQuantity } = useUpdateLocalCartItem();
  const { clearCart } = useClearLocalCart();
  const submitOperations = useSubmitCartOperations(tableId);
  const { items, operations, totalAmount, loadFromLocalStorage, hasOperations } = useLocalCart();

  // Load cart from localStorage on component mount
  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  const handleAddItem = (menuItem: IMenuItem, selectedOptions: CartItemOption[] = []) => {
    addItem(menuItem, 1, selectedOptions);
  };

  const handleSubmitToServer = () => {
    submitOperations.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Cart Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Local Cart Status
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {items.length} items
              </Badge>
              {hasOperations && (
                <Badge variant="outline">
                  {operations.length} pending operations
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Total: £{totalAmount.toFixed(2)}</span>
            <div className="space-x-2">
              <Button
                onClick={handleSubmitToServer}
                disabled={!hasOperations || submitOperations.isPending}
                size="sm"
              >
                {submitOperations.isPending ? 'Submitting...' : 'Submit to Server'}
              </Button>
              <Button
                onClick={clearCart}
                variant="outline"
                size="sm"
              >
                Clear Cart
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Sample Items */}
      {menuItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Add Items to Cart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.slice(0, 6).map((item) => (
                <Card key={item._id} className="cursor-pointer hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <img
                        src={item.photoUrl || "/placeholder.png"}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{item.name}</h3>
                        <p className="text-lg font-bold text-primary">
                          £{item.price.toFixed(2)}
                        </p>
                        <Button
                          onClick={() => handleAddItem(item)}
                          size="sm"
                          className="mt-2"
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cart Items */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cart Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.optionsHash}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{item.menuItem.name}</h4>
                    <p className="text-sm text-gray-600">
                      £{item.menuItem.price.toFixed(2)} × {item.quantity}
                    </p>
                    {item.selectedOptions.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Options: {item.selectedOptions.length} selected
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.optionsHash, item.quantity - 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.optionsHash, item.quantity + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.optionsHash)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Operations */}
      {operations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {operations.map((operation, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm font-medium">
                    {operation.action.replace('-', ' ').toUpperCase()}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {operation.optionsHash.substring(0, 8)}...
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
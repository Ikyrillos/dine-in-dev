// import React, { useState } from 'react';
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Separator } from "@/components/ui/separator";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { ShoppingCart, Trash2, Minus, Plus, Loader2, Table } from "lucide-react";
// import { useCartOperations } from '@/core/hooks/cart_hooks';
// import { useGetMenuItems } from '@/core/hooks/get-menu-items';
// import type { Cart } from '@/core/models/dtos/cart-dtos';
// import type { IMenuItem } from '@/core/models/IMenuItem';
// import type { CartItem } from '@/core/store/menu-store';
// import { Cancel } from '@radix-ui/react-alert-dialog';
// import { get } from 'http';

// interface CartSidebarProps {
//   tableId: string;
//   onConfirmOrder?: (cart: Cart, notes: string) => void;
// }

// interface CartItemWithDetails extends CartItem {
//   menuItemDetails?: IMenuItem;
// }

// const CartSidebar: React.FC<CartSidebarProps> = ({ 
//   tableId, 
//   onConfirmOrder 
// }) => {
//   const [notes, setNotes] = useState("");
//   const [showConfirmDialog, setShowConfirmDialog] = useState(false);

//   const {
//     cart,
//     isLoading: isCartLoading,
//     isError: isCartError,
//     error: cartError,
//     updateItem,
//     removeItem,
//     clearCart,
//     isProcessing,
//   } = useCartOperations(tableId);

//   // Fetch menu items to get details for cart items
//   const { data: rawMenuItems = [], isLoading: isMenuLoading } = useGetMenuItems();
//   const menuItems: IMenuItem[] = Array.isArray(rawMenuItems)
//     ? rawMenuItems
//     : (rawMenuItems && Array.isArray(rawMenuItems.data) ? rawMenuItems.data : []);

//   // Helper function to get menu item details by ID
//   const getMenuItemDetails = (menuItemId: string): IMenuItem | undefined => {
//     return menuItems.find(item => item._id === menuItemId);
//   };

//   // Helper function to get cart items with menu details
//   const getCartItemsWithDetails = (): CartItemWithDetails[] => {
//     if (!cart?.items) return [];
    
//     return cart.items.map(cartItem => ({
//       ...cartItem,
//       menuItemDetails: getMenuItemDetails(cartItem.menuItem)
//     }));
//   };

//   // Helper function to format selected options
//   const formatSelectedOptions = (cartItem: CartItemWithDetails): string[] => {
//     if (!cartItem.selectedOptions.length || !cartItem.menuItemDetails?.options) {
//       return [];
//     }

//     const formattedOptions: string[] = [];
    
//     cartItem.selectedOptions.forEach(selectedOption => {
//       const option = cartItem.menuItemDetails?.options.find(
//         opt => opt._id === selectedOption.optionId
//       );
      
//       if (option) {
//         const choiceNames = selectedOption.choiceIds
//           .map(choiceId => 
//             option.choices?.find(choice => choice._id === choiceId)?.name
//           )
//           .filter(Boolean);
        
//         if (choiceNames.length > 0) {
//           formattedOptions.push(`${option.displayName || option.name}: ${choiceNames.join(', ')}`);
//         }
//       }
//     });

//     return formattedOptions;
//   };

//   // Helper function to calculate total from cart items
//   const calculateTotal = () => {
//     if (!cart?.items) return 0;
//     return cart.totalAmount / 100; // Convert from cents to dollars/pounds
//   };

//   // Helper function to update item quantity
//   const updateCartItemQuantity = (optionsHash: string, newQuantity: number) => {
//     if (newQuantity <= 0) {
//       removeItem(optionsHash);
//     } else {
//       updateItem(optionsHash, { quantity: newQuantity });
//     }
//   };

//   // Handle order confirmation
//   const handleConfirmOrder = () => {
//     if (cart && onConfirmOrder) {
//       onConfirmOrder(cart, notes);
//     }
//     setShowConfirmDialog(false);
//   };

//   // Get cart items with details
//   const cartItemsWithDetails = getCartItemsWithDetails();
//   const total = calculateTotal();

//   const isLoading = isCartLoading || isMenuLoading;
//   const isError = isCartError;

//   if (isError) {
//     return (
//       <div className="flex flex-col h-full">
//         <div className="p-6 border-b border-slate-200">
//           <h2 className="text-xl font-bold text-destructive">Error Loading Cart</h2>
//         </div>
//         <div className="flex-1 flex items-center justify-center">
//           <div className="text-center text-muted-foreground">
//             <p>Failed to load cart data</p>
//             <p className="text-sm mt-2">{cartError?.message}</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const sidebarContent = (
//     <div className="flex flex-col h-full">
//       {/* Header - Fixed */}
//       <div className="p-6 border-b border-slate-200 flex-shrink-0">
//         <div className="flex items-center justify-between">
//           <h2 className="text-xl font-bold">Your Order</h2>
//           <div className="flex items-center space-x-2">
//             <Badge variant="secondary">
//               {cartItemsWithDetails.length} item{cartItemsWithDetails.length !== 1 ? "s" : ""}
//             </Badge>
//             {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
//           </div>
//         </div>
//         {cartItemsWithDetails.length > 0 && (
//           <div className="mt-2 flex justify-between items-center">
//             <span className="text-sm text-muted-foreground">Table {tableId}</span>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={clearCart}
//               disabled={isProcessing}
//               className="text-destructive hover:text-destructive text-xs"
//             >
//               Clear All
//             </Button>
//           </div>
//         )}
//       </div>

//       {/* Scrollable Cart Items Section */}
//       <div className="flex-1 overflow-hidden">
//         <ScrollArea className="h-full p-6">
//           {isLoading && cartItemsWithDetails.length === 0 ? (
//             <div className="text-center text-muted-foreground py-12">
//               <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
//               <p>Loading cart...</p>
//             </div>
//           ) : cartItemsWithDetails.length === 0 ? (
//             <div className="text-center text-muted-foreground py-12">
//               <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
//               <p>Your cart is empty</p>
//               <p className="text-sm mt-2">Add items to get started</p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {cartItemsWithDetails.map((cartItem: CartItemWithDetails) => {
//                 const selectedOptions = formatSelectedOptions(cartItem);
                
//                 return (
//                   <Card key={cartItem.optionsHash} className="border-slate-200 relative">
//                     {isProcessing && (
//                       <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg">
//                         <Loader2 className="h-4 w-4 animate-spin" />
//                       </div>
//                     )}
//                     <CardContent className="p-4">
//                       <div className="flex justify-between items-start mb-3">
//                         <div className="flex-1">
//                           <h4 className="font-medium leading-tight">
//                             {cartItem.menuItemDetails?.displayName || 
//                              cartItem.menuItemDetails?.name || 
//                              `Menu Item ${cartItem.menuItem}`}
//                           </h4>
                          
//                           {/* Menu item description */}
//                           {cartItem.menuItemDetails?.description && (
//                             <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
//                               {cartItem.menuItemDetails.description}
//                             </p>
//                           )}
                          
//                           {/* Selected options */}
//                           {selectedOptions.length > 0 && (
//                             <div className="mt-2 space-y-1">
//                               {selectedOptions.map((option, index) => (
//                                 <div key={index} className="text-xs bg-slate-50 px-2 py-1 rounded">
//                                   {option}
//                                 </div>
//                               ))}
//                             </div>
//                           )}
//                         </div>
                        
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => removeItem(cartItem.optionsHash)}
//                           disabled={isProcessing}
//                           className="text-destructive hover:text-destructive ml-2"
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
                      
//                       <div className="flex justify-between items-center">
//                         <div className="flex flex-col">
//                           <span className="font-bold text-primary">
//                             £{(cartItem.totalPrice / 100).toFixed(2)}
//                           </span>
//                           {cartItem.quantity > 1 && (
//                             <span className="text-xs text-muted-foreground">
//                               £{(cartItem.unitPrice / 100).toFixed(2)} each
//                             </span>
//                           )}
//                         </div>
                        
//                         <div className="flex items-center space-x-2">
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={() =>
//                               updateCartItemQuantity(
//                                 cartItem.optionsHash,
//                                 cartItem.quantity - 1,
//                               )}
//                             disabled={isProcessing}
//                             className="h-8 w-8 p-0"
//                           >
//                             <Minus className="h-3 w-3" />
//                           </Button>
//                           <span className="w-8 text-center font-medium">
//                             {cartItem.quantity}
//                           </span>
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={() =>
//                               updateCartItemQuantity(
//                                 cartItem.optionsHash,
//                                 cartItem.quantity + 1,
//                               )}
//                             disabled={isProcessing}
//                             className="h-8 w-8 p-0"
//                           >
//                             <Plus className="h-3 w-3" />
//                           </Button>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 );
//               })}
//             </div>
//           )}
//         </ScrollArea>
//       </div>

//       {/* Fixed Bottom Section - Order Summary */}
//       {cartItemsWithDetails.length > 0 && (
//         <div className="border-t border-slate-200 p-6 space-y-4 flex-shrink-0 bg-white">
//           <div>
//             <Label className="text-sm font-medium">Special Instructions</Label>
//             <Textarea
//               placeholder="Any special requests..."
//               value={notes}
//               onChange={(e) => setNotes(e.target.value)}
//               className="mt-2"
//               rows={3}
//               disabled={isProcessing}
//             />
//           </div>
//           <Separator />
//           <div className="space-y-2">
//             <div className="flex justify-between items-center text-sm">
//               <span>Subtotal ({cartItemsWithDetails.length} items)</span>
//               <span>£{total.toFixed(2)}</span>
//             </div>
//             <div className="flex justify-between items-center">
//               <span className="text-lg font-semibold">Total</span>
//               <span className="text-xl font-bold text-primary">
//                 £{total.toFixed(2)}
//               </span>
//             </div>
//           </div>
//           <Button
//             onClick={() => setShowConfirmDialog(true)}
//             className="w-full"
//             size="lg"
//             disabled={isProcessing || cartItemsWithDetails.length === 0}
//           >
//             {isProcessing ? (
//               <>
//                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                 Processing...
//               </>
//             ) : (
//               "Confirm Order"
//             )}
//           </Button>
//         </div>
//       )}

//       {/* Confirmation Dialog */}
//       {showConfirmDialog && (
//         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
//             <h3 className="text-lg font-semibold mb-4">Confirm Your Order</h3>
            
//             {/* Order Items */}
//             <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
//               {cartItemsWithDetails.map((item) => (
//                 <div key={item.optionsHash} className="flex justify-between items-start text-sm border-b pb-2">
//                   <div className="flex-1">
//                     <span className="font-medium">
//                       {item.menuItemDetails?.displayName || item.menuItemDetails?.name || 'Menu Item'}
//                     </span>
//                     <span className="text-muted-foreground ml-2">x{item.quantity}</span>
//                     {formatSelectedOptions(item).length > 0 && (
//                       <div className="text-xs text-muted-foreground mt-1">
//                         {formatSelectedOptions(item).join(', ')}
//                       </div>
//                     )}
//                   </div>
//                   <span className="font-medium">
//                     £{(item.totalPrice / 100).toFixed(2)}
//                   </span>
//                 </div>
//               ))}
//             </div>

//             {/* Order Summary */}
//             <div className="space-y-2 mb-4 pt-2 border-t">
//               <div className="flex justify-between">
//                 <span>Items:</span>
//                 <span>{cartItemsWithDetails.length}</span>
//               </div>
//               <div className="flex justify-between font-bold">
//                 <span>Total:</span>
//                 <span>£{total.toFixed(2)}</span>
//               </div>
//               {notes && (
//                 <div className="pt-2 border-t">
//                   <span className="text-sm font-medium">Notes:</span>
//                   <p className="text-sm text-muted-foreground mt-1 max-h-20 overflow-y-auto">
//                     {notes}
//                   </p>
//                 </div>
//               )}
//             </div>
            
//             <div className="flex space-x-3">
//               <Button
//                 variant="outline"
//                 onClick={() => setShowConfirmDialog(false)}
//                 className="flex-1"
//                 disabled={isProcessing}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleConfirmOrder}
//                 className="flex-1"
//                 disabled={isProcessing}
//               >
//                 {isProcessing ? (
//                   <>
//                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                     Confirming...
//                   </>
//                 ) : (
//                   "Confirm"
//                 )}
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );

//   return sidebarContent;
// };

// export default CartSidebar;
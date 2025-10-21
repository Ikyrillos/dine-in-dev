"use client";

import CategoryChooserDialog from "@/components/CategoriesDialog";
import { DiscountDisplay } from "@/components/DiscountDisplay";
import TawilaShimmer from "@/components/LoadingBranded";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useGetMenuCategories } from "@/core/hooks/get-categories-hooks";
import { useGetMenuItems } from "@/core/hooks/get-menu-items";
import type { CartItemOption } from "@/core/models/dtos/cart-dtos";
import type { IMenuItem } from "@/core/models/IMenuItem";
import { oldCartApi } from "@/core/repositories/cart_repository";
import { getTableCheckoutData, setTableCheckoutData } from "@/utils/table-checkout-storage";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Banknote,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ResizableLayout } from "../components/resizable-layout";
import {
  useAddToLocalCart,
  useClearLocalCart,
  useLocalCart,
  useRemoveFromLocalCart,
  useSubmitCartOperations,
  useUpdateLocalCartItem,
} from "../features/cart/cart/hooks/local-cart-hooks";
import { cartApi } from "../features/cart/cart/repository/cart_repository";
import { useCurrencyStore } from "../features/cart/cart/stores/currency-store";

// Import pickup cart hooks and utilities

export const Route = createFileRoute("/menu")({
  component: Menu,
  beforeLoad: ({ context }: { context: any }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/",
        search: { redirect: "/tables" },
      });
    }
  },
});

export default function Menu() {
  const navigate = useNavigate();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<IMenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedTable] = useState("");
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string[]>
  >({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [discount, setDiscount] = useState<number | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Check if this is a pickup order (no tableId)
  const tableId = new URLSearchParams(window.location.search).get("tableId");
  const tableName = new URLSearchParams(window.location.search).get("name");
  const isPickupOrder = tableName?.toLowerCase().includes("pickup") ?? false;
  console.log("isPickupOrder:", isPickupOrder);

  // Hooks for categories and menu items
  const { data: categories, isLoading: categoriesLoading } =
    useGetMenuCategories();
  const { data: menuItems, isLoading: menuItemsLoading } = useGetMenuItems();

  // Local cart hooks (used for both pickup and table orders)
  const { addItem } = useAddToLocalCart();
  const { removeItem } = useRemoveFromLocalCart();
  const { updateQuantity } = useUpdateLocalCartItem();
  const { clearCart } = useClearLocalCart();
  const {
    items: localCartItems,
    totalAmount: localCartTotal,
    setCurrentTableId
  } = useLocalCart();
  const submitCartOperations = useSubmitCartOperations(isPickupOrder ? undefined : tableId || undefined);
  const { currencySymbol } = useCurrencyStore();

  // Set current table ID for local cart filtering
  useEffect(() => {
    setCurrentTableId(isPickupOrder ? null : tableId);
    // Note: setCurrentTableId automatically calls loadFromLocalStorage()
  }, [tableId, isPickupOrder, setCurrentTableId]);

  // For table orders, we'll create a simple breakdown calculation
  const tableBreakdown = useMemo(() => {
    if ((discount || 0) <= 0) return null;

    const cartTotal = localCartTotal;
    const discountAmount = cartTotal * ((discount || 0) / 100); // Calculate discount as percentage of cart total
    const newTotal = Math.max(0, cartTotal - discountAmount);

    return {
      discount: discountAmount * 100, // Convert to cents for consistency
      subTotal: cartTotal * 100, // Convert to cents
      totalAmount: newTotal * 100, // Convert to cents
      tax: 0,
      shippingCost: 0,
      applicationFeeAmount: 0,
    };
  }, [discount, localCartTotal, localCartItems.length]);

  // Use breakdown based on discount
  const breakdown = tableBreakdown;


  // Load stored checkout data for table orders when component mounts or tableId changes
  useEffect(() => {
    if (!isPickupOrder && tableId) {
      const storedData = getTableCheckoutData(tableId);
      setDiscount(storedData.discount);
      setNotes(storedData.notes);
      setDataLoaded(true);
    }
  }, [tableId, isPickupOrder]);

  // Save checkout data to local storage whenever discount or notes change (for table orders)
  // Only save after initial data has been loaded to prevent overwriting
  useEffect(() => {
    if (!isPickupOrder && tableId && dataLoaded) {
      setTableCheckoutData(tableId, { discount: (discount || 0), notes });
    }
  }, [discount, notes, tableId, isPickupOrder, dataLoaded]);

  // Get cart data from local cart
  const cartItems = localCartItems;

  const totalAmount = useMemo(() => {
    // Use breakdown if discount is applied, otherwise use local cart total
    if (breakdown && (discount || 0) > 0) {
      return breakdown.totalAmount / 100;
    }

    return localCartTotal;
  }, [
    breakdown?.totalAmount,
    discount,
    localCartTotal,
    localCartItems.length,
  ]);

  // Computed values
  const filteredItems = useMemo(() => {
    const items = menuItems?.data ?? [];
    if (!items.length) return [];

    const selected = selectedCategory?.toString().trim();
    const hasCategory = !!selected;

    return items.filter((item: any) => {
      const itemCat = item.categoryId ??
        item.category?.id ??
        item.category?._id ??
        item.category ??
        item.category_id ??
        item.categoryID;

      const matchCategory = !hasCategory || String(itemCat) === selected;

      const q = (searchQuery || "").trim().toLowerCase();
      const matchSearch = !q ||
        (item.name ?? "").toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q);

      return matchCategory && matchSearch;
    });
  }, [menuItems?.data, selectedCategory, searchQuery]);

  const currentOption = useMemo(() => {
    if (!selectedItem?.options?.length) return null;
    return selectedItem.options[currentOptionIndex];
  }, [selectedItem, currentOptionIndex]);

  const isLastStep = useMemo(() => {
    if (!selectedItem?.options?.length) return true;
    return currentOptionIndex === selectedItem.options.length - 1;
  }, [selectedItem, currentOptionIndex]);

  // Helper functions
  const resetConfiguration = () => {
    setCurrentOptionIndex(0);
    setSelectedOptions({});
  };

  // Helper function to get selected choice names for local cart items
  const getSelectedChoiceNamesForLocalCartItem = (localCartItem: any): string[] => {
    const selectedChoices: string[] = [];
    const menuItem = localCartItem.menuItem;
    const optionsMap: Record<string, any> = {};

    // Create a map of optionId to options
    menuItem.options?.forEach((option: any) => {
      optionsMap[option._id] = option;
    });

    // Iterate over selected options
    localCartItem.selectedOptions?.forEach((selectedOption: any) => {
      const option = optionsMap[selectedOption.optionId];
      if (option) {
        const choiceMap: Record<string, string> = {};

        // Create a map of choiceId to choice name
        option.choices?.forEach((choice: any) => {
          choiceMap[choice._id] = choice.name;
        });

        // Retrieve selected choice names
        selectedOption.choiceIds.forEach((choiceId: string) => {
          if (choiceMap[choiceId]) {
            selectedChoices.push(choiceMap[choiceId]);
          }
        });
      }
    });

    return selectedChoices;
  };

  // Helper function to calculate local cart item total price
  const calculateLocalCartItemTotalPrice = (localCartItem: any): number => {
    const basePrice = localCartItem.menuItem.price * localCartItem.quantity;
    let optionsPrice = 0;

    localCartItem.selectedOptions?.forEach((selectedOption: any) => {
      const option = localCartItem.menuItem.options?.find((opt: any) => opt._id === selectedOption.optionId);
      if (option) {
        selectedOption.choiceIds.forEach((choiceId: string) => {
          const choice = option.choices?.find((c: any) => c._id === choiceId);
          if (choice) {
            optionsPrice += choice.price || 0;
          }
        });
      }
    });

    return basePrice + (optionsPrice * localCartItem.quantity);
  };

  const startConfigForItem = (item: any) => {
    setSelectedItem(item);
    setQuantity(1);
    resetConfiguration();
  };

  const handleOptionChange = (
    optionId: string,
    choiceId: string,
    isSelected: boolean,
  ) => {
    setSelectedOptions((prev) => {
      const currentSelections = prev[optionId] || [];

      if (isSelected) {
        const option = selectedItem?.options?.find((opt: any) =>
          opt._id === optionId
        );
        if (option?.type === "radio") {
          return { ...prev, [optionId]: [choiceId] };
        } else {
          return { ...prev, [optionId]: [...currentSelections, choiceId] };
        }
      } else {
        return {
          ...prev,
          [optionId]: currentSelections.filter((id) => id !== choiceId),
        };
      }
    });
  };


  const canProceed = () => {
    if (!currentOption) return true;
    if (!currentOption.required) return true;

    const optionSelections = selectedOptions[currentOption._id];
    return optionSelections && optionSelections.length > 0;
  };

  const calculateItemPrice = (item: any, itemSelectedOptions: any) => {
    let basePrice = item.price;
    let optionsPrice = 0;

    item.options?.forEach((option: any) => {
      const selections = itemSelectedOptions[option._id] || [];
      selections.forEach((choiceId: string) => {
        const choice = option.choices?.find((c: any) => c._id === choiceId);
        if (choice) {
          optionsPrice += choice.price || 0;
        }
      });
    });

    return basePrice + optionsPrice;
  };

  const nextStep = () => {
    setCurrentOptionIndex((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentOptionIndex((prev) => Math.max(0, prev - 1));
  };

  const isFirstStep = currentOptionIndex === 0;

  const nextOrAddToCart = () => {
    if (!selectedItem) return;

    if (isLastStep || selectedItem.options.length === 0) {
      const cartItemOptions: CartItemOption[] = Object.entries(selectedOptions).map((
        [optionId, choiceIds],
      ) => ({
        optionId,
        choiceIds: Array.isArray(choiceIds) ? choiceIds : [choiceIds],
      }));

      // Use local cart for both pickup and table orders
      addItem(selectedItem, quantity, cartItemOptions);

      setSelectedItem(null);
      resetConfiguration();
    } else {
      nextStep();
    }
  };

  const incQty = () => setQuantity((prev) => prev + 1);
  const decQty = () => setQuantity((prev) => Math.max(1, prev - 1));

  // Local cart item quantity update
  const updateCartItemQuantity = (
    optionsHash: string,
    newQuantity: number,
  ) => {
    updateQuantity(optionsHash, newQuantity);
  };

  // Local cart item removal
  const handleRemoveItem = (optionsHash: string) => {
    removeItem(optionsHash);
  };

  // Payment method selection for pickup orders
  const handlePaymentMethodSelect = async (method: "cash" | "credit") => {
    try {
      // First submit the local cart operations to the server
      await submitCartOperations.mutateAsync();

      if (isPickupOrder) {
  // Pickup checkout with payment method using direct API call
        const response = await cartApi.postCheckout({
          failUrl: "https://www.secondserving.uk/",
          successUrl: "https://www.secondserving.uk/",
          addressId: "",
          note: notes,
          discount: (discount || 0),
          source: "Dine-in",
          paymentMethod: method,
        });

        if (response._id) {
          clearCart();
          navigate({ to: `/tables` });
        }
      }
    } catch (error) {
      console.error("Error during checkout:", error);
    } finally {
      setShowPaymentOptions(false);
      setShowConfirmDialog(false);
    }
  };

  // Conditional checkout (now only for table orders)
  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      // Submit local cart operations to server
      await submitCartOperations.mutateAsync();

      // Table checkout only (pickup orders use handlePaymentMethodSelect directly)
      const response = await oldCartApi.printPosOrder(tableId || "", notes, (discount || 0), "Dine-in", paymentMethod);
      if (response) {
        clearCart();
        navigate({ to: `/tables` });
      }
    } catch (error) {
      console.error("Error during checkout:", error);
    } finally {
      setIsCheckingOut(false);
      setShowConfirmDialog(false);
    }
  };

  if (menuItemsLoading || categoriesLoading) {
    return <TawilaShimmer />;
  }

  const mainContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/tables" })}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tables
          </Button>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {isPickupOrder
                ? "Pickup Order"
                : (tableName ? tableName.replaceAll('"', "") : "Table Order")}
            </p>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="grid grid-cols-4 gap-2">
            <CategoryChooserDialog
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={(value) => setSelectedCategory(value)}
              triggerLabel="Categories"
            />
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className="min-h-12 h-auto rounded-lg p-3"
            >
              <span className="break-words text-left">All</span>
            </Button>
            {categories?.data.slice(0, 10).map((category) => (
              <Button
                key={category.id}
                variant={String(selectedCategory) === String(category.id)
                  ? "default"
                  : "outline"}
                onClick={() => setSelectedCategory(String(category.id))}
                className="min-h-12 h-auto rounded-lg p-3"
              >
                <span className="truncate">{category.name}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card
                key={item._id}
                className={`cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] rounded-xl overflow-hidden h-auto ${
                  selectedItem?._id === item._id
                    ? "border-primary border-4"
                    : "border-gray-200"
                }`}
                onClick={() => startConfigForItem(item)}
              >
                <CardContent className=" h-full">
                  <div className="flex items-start space-x-3 h-full">
                    <img
                      src={item.photoUrl || "/placeholder.png"}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <h3 className="font-semibold text-gray-900 text-base leading-tight break-words">
                        {item.name}
                      </h3>
                      <p className="text-lg font-bold text-primary mt-2">
                        {currencySymbol}
                        {item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        {selectedItem
          ? (
            <div className="text-sm text-muted-foreground">
              {currentOption
                ? `${currentOptionIndex + 1} of ${selectedItem.options.length}`
                : ""}
            </div>
          )
          : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">Your Order</h2>
              <Badge variant="secondary">
                {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          )}
        
        {/* Cancel/Close button when configuring item */}
        {selectedItem && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedItem(null);
              resetConfiguration();
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {/* Item Configuration View */}
          {selectedItem && (
            <div className="px-6 pb-32">
              <div className="pt-6 flex flex-col items-center">
                <div className="w-28 h-28 rounded-xl bg-gray-100 overflow-hidden mb-4">
                  <img
                    src={selectedItem.photoUrl || "/placeholder.png"}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 text-center">
                  {selectedItem.name}
                </h2>
                {selectedItem.description && (
                  <p className="mt-2 text-sm text-gray-600 text-center max-w-[36ch]">
                    {selectedItem.description}
                  </p>
                )}
              </div>

              {/* Options */}
              {selectedItem.options.length > 0 && currentOption && (
                <div className="mt-8">
                  <p className="text-2xl font-bold">
                    {currentOption.name}{" "}
                    {currentOption.required && (
                      <span className="text-destructive">*</span>
                    )}
                  </p>

                  <div className="mt-4 space-y-3">
                    {currentOption.type === "radio"
                      ? (
                        <RadioGroup
                          value={selectedOptions[currentOption._id]?.[0] || ""}
                          onValueChange={(value) =>
                            handleOptionChange(currentOption._id, value, true)}
                        >
                          {currentOption.choices?.map((choice: any) => (
                            <label
                              key={choice._id}
                              htmlFor={choice._id}
                              className={`
                              flex items-center justify-between rounded-xl border px-4 py-5 cursor-pointer
                              ${
                                selectedOptions[currentOption._id]?.[0] ===
                                    choice._id
                                  ? "border-primary ring-2 ring-primary/30"
                                  : "border-slate-200 hover:border-slate-300"
                              }
                            `}
                            >
                              <div className="flex items-center gap-3">
                                <RadioGroupItem
                                  id={choice._id}
                                  value={choice._id}
                                />
                                <span className="text-base">{choice.name}</span>
                              </div>
                              {choice.price > 0 && (
                                <span className="text-primary font-semibold">
                                  +{currencySymbol}
                                  {choice.price.toFixed(2)}
                                </span>
                              )}
                            </label>
                          ))}
                        </RadioGroup>
                      )
                      : (
                        currentOption.choices?.map((choice: any) => {
                          const isSelected =
                            selectedOptions[currentOption._id]?.includes(
                              choice._id,
                            ) || false;
                          return (
                            <label
                              key={choice._id}
                              htmlFor={choice._id}
                              className={`
                              flex items-center justify-between rounded-xl border px-4 py-5 cursor-pointer
                              ${
                                isSelected
                                  ? "border-primary ring-2 ring-primary/30"
                                  : "border-slate-200 hover:border-slate-300"
                              }
                            `}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  id={choice._id}
                                  checked={isSelected}
                                  onCheckedChange={(checked) =>
                                    handleOptionChange(
                                      currentOption._id,
                                      choice._id,
                                      !!checked,
                                    )}
                                />
                                <span className="text-base">{choice.name}</span>
                              </div>
                              {choice.price > 0 && (
                                <span className="text-primary font-semibold">
                                  +{currencySymbol}
                                  {choice.price.toFixed(2)}
                                </span>
                              )}
                            </label>
                          );
                        })
                      )}
                  </div>
                </div>
              )}

              {/* Quantity selector - only on last step */}
              {(isLastStep || selectedItem.options.length === 0) && (
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center gap-6">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={decQty}
                      className="h-14 w-14 rounded-full"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <span className="text-3xl font-bold tabular-nums min-w-[3ch] text-center">
                      {quantity}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={incQty}
                      className="h-14 w-14 rounded-full"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cart View */}
          {!selectedItem && (
            <div className="px-6 py-6">
              {showPaymentOptions && isPickupOrder
                ? (
                  <div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-12"
                      onClick={() => setShowPaymentOptions(false)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <h3 className="font-semibold text-gray-900 text-lg my-4 text-center">
                      Confirm Pickup Order
                    </h3>

                    {/* Cart Items Summary */}
                    <ScrollArea className="max-h-64 mb-4">
                      <div className="space-y-2">
                        {cartItems.map((cartItem: any) => (
                          <div
                            key={cartItem.optionsHash}
                            className="flex justify-between items-center p-2 bg-slate-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {cartItem.menuItem.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Qty: {cartItem.quantity}
                              </p>
                              {cartItem.selectedOptions?.length > 0 && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {getSelectedChoiceNamesForLocalCartItem(cartItem).join(", ")}
                                </p>
                              )}
                            </div>
                            <p className="font-bold text-primary text-sm">
                              {currencySymbol}
                              {calculateLocalCartItemTotalPrice(cartItem).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Show notes if any */}
                    {orderNote && (
                      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Special Instructions:</p>
                        <p className="text-sm text-muted-foreground">{orderNote}</p>
                      </div>
                    )}

                    {/* Discount Display for all orders */}
                    {breakdown && breakdown.discount > 0 && (
                      <div className="mb-4">
                        <DiscountDisplay
                          discount={breakdown.discount}
                          subTotal={breakdown.subTotal || 0}
                          totalAmount={breakdown.totalAmount}
                          size="md"
                        />
                      </div>
                    )}

                    {/* Total Amount */}
                    <div className="mb-6 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">
                          Total
                        </span>
                        <span className="text-xl font-bold text-primary">
                          {currencySymbol}{totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="space-y-3">
                      <p className="text-center text-sm font-medium text-gray-700 mb-3">
                        Choose Payment Method
                      </p>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-14 text-base font-medium"
                        onClick={() => handlePaymentMethodSelect("credit")}
                      >
                        <CreditCard className="mr-3 h-5 w-5" />
                        Card
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-14 text-base font-medium"
                        onClick={() => handlePaymentMethodSelect("cash")}
                      >
                        <Banknote className="mr-3 h-5 w-5" />
                        Cash
                      </Button>
                    </div>
                  </div>
                )
                : cartItems.length === 0
                ? (
                  <div className="text-center text-muted-foreground py-12">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Your cart is empty</p>
                    <p className="text-sm mt-2">Add items to get started</p>
                  </div>
                )
                : (
                  <div className="space-y-4">
                      {cartItems.map((cartItem) => (
                        <Card
                          key={cartItem.optionsHash}
                          className="border-slate-200"
                        >
                          <CardContent className="">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium">
                                {cartItem.menuItem.name}
                              </h4>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemoveItem(
                                  cartItem.optionsHash,
                                )}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Expandable Options Section - Only show if there are options */}
                          {getSelectedChoiceNamesForLocalCartItem(cartItem).length >
                            0 && (
                              <div className="mt-2 w-full">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setExpandedItems((prev) => ({
                                      ...prev,
                                      [cartItem.optionsHash]:
                                        !prev[cartItem.optionsHash],
                                    }))}
                                  className=" text-gray-600 hover:text-gray-800"
                                >
                                  <span className="max-w-80 truncate inline-block text-left">
                                  {getSelectedChoiceNamesForLocalCartItem(cartItem)
                                    .join(", ")}
                                </span>
                                {expandedItems[cartItem.optionsHash]
                                  ? (
                                    <ChevronUp className="h-3 w-3 ml-1 flex-shrink-0" />
                                  )
                                  : (
                                    <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0" />
                                  )}
                              </Button>

                              {expandedItems[cartItem.optionsHash] && (
                                <div className="mt-2 pl-2 border-l-2 border-gray-100">
                                  <div className="text-sm text-gray-600 space-y-1">
                                      {getSelectedChoiceNamesForLocalCartItem(cartItem)
                                        .map((choice, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center w-full"
                                          >
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2">
                                            </span>
                                            {choice}
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                          <div className="flex justify-between items-center mt-3">
                            <span className="font-bold text-primary">
                              {currencySymbol}
                              {calculateLocalCartItemTotalPrice(cartItem).toFixed(2)}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  updateCartItemQuantity(
                                    cartItem.optionsHash,
                                    cartItem.quantity - 1,
                                  )}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">
                                {cartItem.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  updateCartItemQuantity(
                                    cartItem.optionsHash,
                                    cartItem.quantity + 1,
                                  )}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Discount Display for all orders */}

            </div>
          )}
        </ScrollArea>
      </div>

      {/* Sticky Bottom Bar */}
      {selectedItem
        ? (
          <div className="sticky bottom-0 left-0 right-0 bg-white border-t px-6 py-4">
            {/* Show back button when not on first step and has options */}
            {!isFirstStep && selectedItem.options.length > 0 && (
              <div className="flex gap-3 mb-3">
                <Button
                  onClick={prevStep}
                  variant="outline"
                  className="flex-1 h-12 text-base font-semibold"
                >
                  Back
                </Button>
                <Button
                  onClick={nextOrAddToCart}
                  disabled={!canProceed()}
                  className="flex-1 h-12 text-base font-semibold justify-between px-4"
                >
                  <span>
                    {isLastStep || selectedItem.options.length === 0
                      ? "Add to Cart"
                      : "Next"}
                  </span>
                  <span className="font-bold">
                    {currencySymbol}
                    {(calculateItemPrice(selectedItem, selectedOptions) *
                      (isLastStep ? quantity : 1)).toFixed(2)}
                  </span>
                </Button>
              </div>
            )}
            
            {/* Show single button when on first step or no options */}
            {(isFirstStep || selectedItem.options.length === 0) && (
              <Button
                onClick={nextOrAddToCart}
                disabled={!canProceed()}
                className="w-full h-14 text-lg font-semibold justify-between px-6"
              >
                <span>
                  {isLastStep || selectedItem.options.length === 0
                    ? "Add to Cart"
                    : "Next"}
                </span>
                <span className="font-bold">
                  {currencySymbol}
                  {(calculateItemPrice(selectedItem, selectedOptions) *
                    (isLastStep ? quantity : 1)).toFixed(2)}
                </span>
              </Button>
            )}
          </div>
        )
        : (
          cartItems.length > 0 && !showPaymentOptions && (
            <div className="sticky bottom-0 left-0 right-0 bg-white border-t px-6 py-4 space-y-4">
              <div>
                <Label className="text-sm font-medium">
                  Special Instructions
                </Label>
                <Textarea
                  placeholder="Any special requests..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
                {/* Discount */}
                <Label className="text-sm font-medium mt-4">
                  Discount Amount
                </Label>
                <div className="flex items-center gap-2">
                  {/* percent  center all */}
                  <div className="flex items-center">
                    <span className="text-sm mr-1 pt-2">
                      %
                    </span>
                  </div>

                  <Input
                    type="number"
                    placeholder="Enter discount amount"
                    value={(discount || '').toString()}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (isNaN(val)) {
                        setDiscount(0);
                      } else if (val < 0) {
                        setDiscount(0);
                      } else if (val > 100) {
                        setDiscount(100);
                      } else {
                        setDiscount(val);
                      }
                    }}
                    className="mt-2"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Discount Display in Confirm Dialog */}
              {breakdown && breakdown.discount > 0 && (
                <div className="mb-2">
                  <DiscountDisplay
                    discount={breakdown.discount}
                    subTotal={breakdown.subTotal || 0}
                    totalAmount={breakdown.totalAmount}
                    size="sm"
                  />
                </div>
              )}

              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">
                  {currencySymbol}
                  {totalAmount.toFixed(2)}
                </span>
              </div>
              <Button
                onClick={() => {
                  if (isPickupOrder) {
                    // For pickup orders, go directly to payment options
                    setShowPaymentOptions(true);
                  } else {
                    // For table orders, show confirmation dialog first
                    setShowConfirmDialog(true);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-3 text-lg font-semibold"
              >
                {isPickupOrder ? "Choose Payment Method" : "Confirm Order"}
              </Button>
            </div>
          )
        )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 h-screen overflow-hidden">
      <ResizableLayout sidebar={sidebarContent}>{mainContent}</ResizableLayout>

      {/* Order Note Dialog - for pickup orders */}
      {isPickupOrder && (
        <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Note to Order</DialogTitle>
              <DialogDescription>
                Add any special instructions or notes for your order.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="E.g., Delivery instructions, allergies, special requests..."
                value={orderNote}
                onChange={(e) =>
                  setOrderNote(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <DialogFooter>
              <Button
                onClick={() =>
                  setShowNoteDialog(false)}
              >
                Save Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Order Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={isCheckingOut ? undefined : setShowConfirmDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Order</DialogTitle>
            <DialogDescription>
              {isPickupOrder ? "Pickup order" : `Table ${selectedTable}`}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-96">
            <div className="space-y-4">
              {cartItems.map((cartItem: any) => (
                <div
                  key={cartItem.optionsHash}
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {cartItem.menuItem.name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate w-96">
                      {getSelectedChoiceNamesForLocalCartItem(cartItem).join(", ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {cartItem.quantity}
                    </p>
                    {/* Show selected options */}
                    {cartItem.selectedOptions?.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {cartItem.selectedOptions.map((option: any) => {
                          const optionData = cartItem.menuItem.options?.find((
                            opt: any,
                          ) => opt._id === option.optionId);
                          if (!optionData) return null;

                          const choiceNames = option.choiceIds.map(
                            (choiceId: string) => {
                              const choice = optionData.choices?.find((
                                c: any,
                              ) => c._id === choiceId);
                              return choice?.name;
                            },
                          ).filter(Boolean);

                          return choiceNames.length > 0
                            ? `${optionData.name}: ${choiceNames.join(", ")}`
                            : null;
                        }).filter(Boolean).join(" | ")}
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-primary">
                    {currencySymbol}
                    {calculateLocalCartItemTotalPrice(cartItem).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Show notes */}
          {((isPickupOrder && orderNote) || (!isPickupOrder && notes)) && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium mb-1">Special Instructions:</p>
              <p className="text-sm text-muted-foreground">
                {isPickupOrder ? orderNote : notes}
              </p>
            </div>
          )}

          {/* Payment Method Selection for Table Orders (Optional) */}
          {isPickupOrder && (
            <div className="mt-4">
              <Label className="text-sm font-medium mb-3 block">Payment Method (Optional)</Label>
              <RadioGroup value={paymentMethod} onValueChange={(value: "cash" | "card") => setPaymentMethod(value)}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center cursor-pointer flex-1">
                    <Banknote className="mr-2 h-4 w-4" />
                    Cash
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center cursor-pointer flex-1">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Card
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Discount Display in Confirmation Dialog */}
          {breakdown && breakdown.discount > 0 && (
            <div className="mt-4">
              <DiscountDisplay
                discount={breakdown.discount}
                subTotal={breakdown.subTotal || 0}
                totalAmount={breakdown.totalAmount}
                size="md"
              />
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-xl font-bold text-primary">
              {currencySymbol}
              {totalAmount.toFixed(2)}
            </span>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isCheckingOut}
            >
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={isCheckingOut}>
              {isCheckingOut ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {isCheckingOut ? "Processing..." : "Confirm Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

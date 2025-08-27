"use client";

import CategoryChooserDialog from "@/components/CategoriesDialog";
import { Spinner } from "@/components/Spinner";
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
import { useCartOperations, useCheckoutCart } from "@/core/hooks/cart_hooks";
import { useGetMenuCategories } from "@/core/hooks/get-categories-hooks";
import { useGetMenuItems } from "@/core/hooks/get-menu-items";
import type { CartItem } from "@/core/models/dtos/cart-dtos";
import type { IMenuItem } from "@/core/models/IMenuItem";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ResizableLayout } from "../components/resizable-layout";
import {
  useAddToCart,
  useClearCart,
  useGetBreakDown,
  useGetCart,
  useRemovePickupCartItem,
  useUpdateCartItemQuantity,
} from "./cart/hooks/cart-hooks";
import { cartApi } from "./cart/repository/cart_repository";
import { useCurrencyStore } from "./cart/stores/currency-store";
import { useDebounce } from "./cart/stores/use_debounce";

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
  const pendingUpdatesRef = useRef<Set<string>>(new Set());

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<IMenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedTable] = useState("");
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string[]>
  >({});
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);

  // Check if this is a pickup order (no tableId)
  const tableId = new URLSearchParams(window.location.search).get("tableId");
  const tableName = new URLSearchParams(window.location.search).get("name");
  const isPickupOrder = tableName?.toLowerCase().includes("pickup") ?? false;

  // Hooks for categories and menu items
  const { data: categories, isLoading: categoriesLoading } =
    useGetMenuCategories();
  const { data: menuItems, isLoading: menuItemsLoading } = useGetMenuItems();
  const clearPickupCart = useClearCart();

  // Conditional cart hooks based on order type
  const tableCartOps = useCartOperations(tableId ?? "");
  const tableCartCheckout = useCheckoutCart();

  // Pickup cart hooks (only used for pickup orders)
  const pickupCart = useGetCart();
  const addToPickupCart = useAddToCart();
  const updatePickupCartQuantity = useUpdateCartItemQuantity();
  const removeFromPickupCart = useRemovePickupCartItem();
  const { currencySymbol } = useCurrencyStore();

  // Pickup cart state for debounced updates
  const [pickupQuantities, setPickupQuantities] = useState<
    Record<string, number>
  >({});
  const debouncedPickupQuantities = useDebounce(pickupQuantities, 500);

  // Breakdown for pickup orders
  const { data: breakdown } = useGetBreakDown(
    promoCode,
  );

  // Handle debounced pickup cart updates
  useEffect(() => {
    if (isPickupOrder) {
      Object.entries(debouncedPickupQuantities).forEach(
        ([itemId]) => {
          // Only update if we have a pending update for this item
          if (pendingUpdatesRef.current.has(itemId)) {
            pendingUpdatesRef.current.delete(itemId);
            // updatePickupCartQuantity.mutate({ itemId, quantity });
          }
        },
      );
    }
  }, [debouncedPickupQuantities, isPickupOrder, updatePickupCartQuantity]);

  // Get appropriate cart data based on order type
  const cartItems = useMemo(() => {
    if (isPickupOrder) {
      return pickupCart.data?.items || [];
    }
    return (tableCartOps.cart?.items || []) as CartItem[];
  }, [isPickupOrder, pickupCart.data?.items, tableCartOps.cart?.items]);

  const totalAmount = useMemo(() => {
    if (isPickupOrder) {
      return breakdown?.totalAmount
        ? breakdown.totalAmount / 100
        : (pickupCart.data?.totalAmount || 0);
    }
    return tableCartOps.cart?.totalAmount || 0;
  }, [
    isPickupOrder,
    breakdown?.totalAmount,
    pickupCart.data?.totalAmount,
    tableCartOps.cart?.totalAmount,
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

  useEffect(() => {
    if (isPickupOrder && pickupCart.data?.items) {
      const initialQuantities: Record<string, number> = {};
      pickupCart.data.items.forEach((item: any) => {
        initialQuantities[item.optionsHash] = item.quantity;
      });
      setPickupQuantities(initialQuantities);
    }
  }, [isPickupOrder, pickupCart.data?.items]);

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

  const nextOrAddToCart = () => {
    if (!selectedItem) return;

    if (isLastStep || selectedItem.options.length === 0) {
      const cartItemOptions = Object.entries(selectedOptions).map((
        [optionId, choiceIds],
      ) => ({
        optionId,
        choiceIds: Array.isArray(choiceIds) ? choiceIds : [choiceIds],
      }));

      if (isPickupOrder) {
        // Use pickup cart logic
        addToPickupCart.mutate({
          menuItemId: selectedItem._id,
          quantity,
          selectedOptions: cartItemOptions,
        });
      } else {
        // Use table cart logic
        tableCartOps.addItem({
          menuItemId: selectedItem._id,
          quantity,
          selectedOptions: cartItemOptions,
        });
      }

      setSelectedItem(null);
      resetConfiguration();
    } else {
      nextStep();
    }
  };

  const incQty = () => setQuantity((prev) => prev + 1);
  const decQty = () => setQuantity((prev) => Math.max(1, prev - 1));

  // Conditional cart item quantity update
  const updateCartItemQuantity = (
    identifier: string,
    newQuantity: number,
  ) => {
    if (isPickupOrder) {
      if (newQuantity <= 0) {
        removeFromPickupCart.mutate(identifier);
        // Clean up pending updates and local state
        pendingUpdatesRef.current.delete(identifier);
        setPickupQuantities((prev) => {
          const newQuantities = { ...prev };
          delete newQuantities[identifier];
          return newQuantities;
        });
      } else {
        // Mark this item as having a pending update
        pendingUpdatesRef.current.add(identifier);
        setPickupQuantities((prev) => ({ ...prev, quantity: newQuantity }));
        updatePickupCartQuantity.mutate({
          itemId: identifier,
          quantity: newQuantity,
        });
      }
    } else {
      if (newQuantity <= 0) {
        tableCartOps.removeItem(identifier);
      } else {
        tableCartOps.updateItem(identifier, { quantity: newQuantity });
      }
    }
  };

  // Conditional cart item removal
  const handleRemoveItem = (identifier: string) => {
    console.log("Removing item with identifier:", identifier);
    if (isPickupOrder) {
      removeFromPickupCart.mutate(identifier);
      setPickupQuantities((prev) => {
        const newQuantities = { ...prev };
        delete newQuantities[identifier];
        return newQuantities;
      });
    } else {
      tableCartOps.removeItem(identifier);
    }
  };

  // Conditional checkout
  const handleCheckout = () => {
    if (isPickupOrder) {
      // Pickup checkout
      cartApi.postCheckout({
        failUrl: "https://www.secondserving.uk/",
        successUrl: "https://www.secondserving.uk/",
        addressId: "",
        note: notes,
        promoCode: promoCode,
        source: "Dine-in",
      }).then((response) => {
        if (response._id) {
          clearPickupCart.mutate();
        }
      });
    } else {
      // Table checkout
      tableCartCheckout.mutate({ tableId: tableId || "", note: notes });
    }
    setShowConfirmDialog(false);
  };

  if (menuItemsLoading || categoriesLoading) {
    return <Spinner />;
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
              variant={selectedCategory === null
                  ? "default"
                  : "outline"}
              onClick={() => setSelectedCategory(null)}
              className="min-h-12 h-auto rounded-lg p-3"
            >
              <span className="break-words text-left">All</span>
            </Button>
            {categories?.data.slice(0, 9).map((category) => (
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
              {cartItems.length === 0
                ? (
                  <div className="text-center text-muted-foreground py-12">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Your cart is empty</p>
                    <p className="text-sm mt-2">Add items to get started</p>
                  </div>
                )
                : (
                  <div className="space-y-4">
                    {isPickupOrder
                      ? (
                        // Pickup cart items using CartItemCard
                        <div>
                          {cartItems.map((item: any) => (
                            (
                              <Card
                                key={item.optionsHash}
                                className="border-slate-200 my-2"
                              >
                                <CardContent className="">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-medium">
                                      {item.menuItem.name}
                                    </h4>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleRemoveItem(
                                          item.optionsHash,
                                        )}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-primary">
                                      {currencySymbol}
                                      {item.totalPrice.toFixed(2)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          updateCartItemQuantity(
                                            item.optionsHash,
                                            item.quantity - 1,
                                          )}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="w-8 text-center">
                                        {item.quantity}
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          updateCartItemQuantity(
                                            item.optionsHash,
                                            item.quantity + 1,
                                          )}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          ))}
                        </div>
                      )
                      : (
                        // Table cart items
                        cartItems.map((cartItem: CartItem) => (
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
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-primary">
                                  {currencySymbol}
                                  {cartItem.totalPrice.toFixed(2)}
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
                        ))
                      )}
                  </div>
                )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Sticky Bottom Bar */}
      {selectedItem
        ? (
          <div className="sticky bottom-0 left-0 right-0 bg-white border-t px-6 py-4 ">
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
          </div>
        )
        : (
          cartItems.length > 0 && (
            <div className="sticky bottom-0 left-0 right-0 bg-white border-t px-6 py-4 space-y-4">
              {
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
                    Discount Code
                  </Label>
                  <Input
                    type="number"
                    placeholder="Enter discount code"
                    value={discount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDiscount(isNaN(val) ? 0 : val);
                    }}
                    className="mt-2"
                  />
                </div>
              }

              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">
                  {currencySymbol}
                  {totalAmount.toFixed(2)}
                </span>
              </div>
              <Button
                onClick={() => setShowConfirmDialog(true)}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-3 text-lg font-semibold"
              >
                Confirm Order
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
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
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
                  key={isPickupOrder
                    ? cartItem.optionsHash
                    : cartItem.menuItem._id}
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {isPickupOrder
                        ? cartItem.menuItem.name
                        : cartItem.menuItem.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {cartItem.quantity}
                    </p>
                    {/* Show selected options for pickup orders */}
                    {isPickupOrder && cartItem.selectedOptions?.length > 0 && (
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
                    {cartItem.totalPrice.toFixed(2)}
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
            >
              Cancel
            </Button>
            <Button onClick={handleCheckout}>
              <Check className="w-4 h-4 mr-2" />
              Confirm Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

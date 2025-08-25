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
import { useMemo, useState } from "react";
import { ResizableLayout } from "../components/resizable-layout";

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

  // Local state with hooks
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<IMenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [orderType] = useState("pickup");
  const [selectedTable] = useState("");
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string[]>
  >({});

  // params tableId
  const tableId = new URLSearchParams(window.location.search).get("tableId");
  const tableName = new URLSearchParams(window.location.search).get("name");

  const { data: categories, isLoading: categoriesLoading } =
    useGetMenuCategories();
  const { data: menuItems, isLoading: menuItemsLoading } = useGetMenuItems();
  const {
    cart,
    addItem,
    updateItem,
    removeItem,
    // clearCart,
  } = useCartOperations(tableId ?? "");

  const cartCheckout = useCheckoutCart();

  // Computed values using useMemo for performance
  // ✅ robust, headache-free filtering
  const filteredItems = useMemo(() => {
    const items = menuItems?.data ?? [];
    if (!items.length) return [];

    // normalize selected category
    const selected = selectedCategory?.toString().trim();
    const hasCategory = !!selected;

    return items.filter((item: any) => {
      // --- category match (support multiple common shapes) ---
      const itemCat = item.categoryId ??
        item.category?.id ??
        item.category?._id ??
        item.category ??
        item.category_id ??
        item.categoryID;

      const matchCategory = !hasCategory || String(itemCat) === selected;

      // --- search match (name / description safe-lowercase) ---
      const q = (searchQuery || "").trim().toLowerCase();
      const matchSearch = !q ||
        (item.name ?? "").toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q);

      return matchCategory && matchSearch;
    });
  }, [menuItems?.data, selectedCategory, searchQuery]);

  const cartItems = useMemo(() => {
    return (cart?.items || []) as CartItem[];
  }, [cart?.items]);

  const totalAmount = useMemo(() => {
    return cart?.totalAmount || 0;
  }, [cart?.totalAmount]);

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
        // For radio type, replace all selections. For checkbox, add to selections
        const option = selectedItem?.options?.find((opt: any) =>
          opt._id === optionId
        );
        if (option?.type === "radio") {
          return { ...prev, [optionId]: [choiceId] };
        } else {
          return { ...prev, [optionId]: [...currentSelections, choiceId] };
        }
      } else {
        // Remove the choice
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

  const nextOrAddToCart = () => {
    if (!selectedItem) return;

    if (isLastStep || selectedItem.options.length === 0) {
      // Add to cart
      const cartItemOptions = Object.entries(selectedOptions).map((
        [optionId, choiceIds],
      ) => ({
        optionId,
        choiceIds: Array.isArray(choiceIds) ? choiceIds : [choiceIds],
      }));

      addItem({
        menuItemId: selectedItem._id,
        quantity,
        selectedOptions: cartItemOptions,
      });

      setSelectedItem(null);
      resetConfiguration();
    } else {
      // Go to next option
      nextStep();
    }
  };

  const incQty = () => setQuantity((prev) => prev + 1);
  const decQty = () => setQuantity((prev) => Math.max(1, prev - 1));

  const updateCartItemQuantity = (optionsHash: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(optionsHash); // Use optionsHash instead of itemId
    } else {
      updateItem(optionsHash, { quantity: newQuantity });
    }
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
              {tableName ? tableName.replaceAll('"', "") : "Pickup Order"}
            </p>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="grid grid-cols-5 gap-2">
            <CategoryChooserDialog
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={(value) => setSelectedCategory(value)}
              triggerLabel={selectedCategory
                ? "Change Category"
                : "Choose Category"}
            />
            {categories?.data.slice(0, 9).map((category) => (
              <Button
                key={category.id}
                variant={String(selectedCategory) === String(category.id)
                  ? "default"
                  : "outline"}
                onClick={() => setSelectedCategory(String(category.id))}
                className="min-h-12 h-auto rounded-lg p-3"
              >
                <span className="break-words text-left">{category.name}</span>
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
                        £{item.price.toFixed(2)}
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
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="p-6 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Your Order</h2>
          <Badge variant="secondary">
            {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Scrollable Cart Items Section */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-6">
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
                {cartItems.map((cartItem: CartItem) => (
                  <Card key={cartItem.optionsHash} className="border-slate-200">
                    {/* Use optionsHash as key */}
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">
                          {cartItem.menuItem.name}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeItem(cartItem.optionsHash)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-primary">
                          £{cartItem.totalPrice.toFixed(2)}
                        </span>
                        <div className="flex items-center space-x-2">
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
        </ScrollArea>
      </div>

      {/* Fixed Bottom Section - Order Summary */}
      {cartItems.length > 0 && (
        <div className="border-t border-slate-200 p-6 space-y-4 flex-shrink-0 bg-white">
          <div>
            <Label className="text-sm font-medium">Special Instructions</Label>
            <Textarea
              placeholder="Any special requests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-xl font-bold text-primary">
              £{totalAmount.toFixed(2)}
            </span>
          </div>
          <Button
            onClick={() => setShowConfirmDialog(true)}
            className="w-full"
            size="lg"
          >
            Confirm Order
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 h-screen overflow-hidden">
      <ResizableLayout sidebar={sidebarContent}>{mainContent}</ResizableLayout>

      {/* Item Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <img
                    src={selectedItem.photoUrl || "/placeholder.png"}
                    alt={selectedItem.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div>
                    <DialogTitle className="text-xl">
                      {selectedItem.name}
                    </DialogTitle>
                    <DialogDescription className="mt-2">
                      {selectedItem.description}
                    </DialogDescription>
                    <Badge className="mt-2">
                      £{selectedItem.price.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="py-4">
                {selectedItem.options.length === 0
                  ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Ready to add to cart!
                      </p>
                    </div>
                  )
                  : (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">
                          {currentOption?.name}
                          {currentOption?.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </h3>
                        <Badge variant="outline">
                          {currentOptionIndex + 1} of{" "}
                          {selectedItem.options.length}
                        </Badge>
                      </div>

                      {/* Scrollable options section with limited height */}
                      <ScrollArea className="h-64 pr-4">
                        <div className="space-y-3">
                          {currentOption?.type === "radio"
                            ? (
                              <RadioGroup
                                value={selectedOptions[currentOption._id]
                                  ?.[0] || ""}
                                onValueChange={(value) =>
                                  handleOptionChange(
                                    currentOption._id,
                                    value,
                                    true,
                                  )}
                              >
                                {currentOption.choices?.map((choice) => (
                                  <div
                                    key={choice._id}
                                    className="flex items-center space-x-3 p-3 rounded-lg border"
                                  >
                                    <RadioGroupItem
                                      value={choice._id}
                                      id={choice._id}
                                    />
                                    <Label
                                      htmlFor={choice._id}
                                      className="flex-1 cursor-pointer"
                                    >
                                      <div className="flex justify-between items-center">
                                        <span>{choice.name}</span>
                                        {choice.price > 0 && (
                                          <span className="text-primary font-medium">
                                            £{choice.price.toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            )
                            : (
                              <div className="space-y-3">
                                {currentOption?.choices?.map((choice) => {
                                  const isSelected =
                                    selectedOptions[currentOption._id]
                                      ?.includes(
                                        choice._id,
                                      ) || false;
                                  return (
                                    <div
                                      key={choice._id}
                                      className="flex items-center space-x-3 p-3 rounded-lg border"
                                    >
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
                                      <Label
                                        htmlFor={choice._id}
                                        className="flex-1 cursor-pointer"
                                      >
                                        <div className="flex justify-between items-center w-full">
                                          <span className="w-72">
                                            {choice.name}
                                          </span>
                                          {choice.price > 0 && (
                                            <span className="text-primary font-medium">
                                              £{choice.price.toFixed(2)}
                                            </span>
                                          )}
                                        </div>
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                {(isLastStep || selectedItem.options.length === 0) && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={decQty}
                        className="h-10 w-10 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-xl font-bold min-w-[3rem] text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={incQty}
                        className="h-10 w-10 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  onClick={() => {
                    if (isLastStep || selectedItem.options.length === 0) {
                      nextOrAddToCart();
                    } else {
                      nextStep();
                    }
                  }}
                  disabled={!canProceed()}
                  className="w-full"
                  size="lg"
                >
                  <span>
                    {isLastStep || selectedItem.options.length === 0
                      ? "Add to Cart"
                      : "Next"}
                  </span>
                  <span className="ml-2 font-bold">
                    £{(
                      calculateItemPrice(
                        selectedItem,
                        selectedOptions,
                      ) * quantity
                    ).toFixed(2)}
                  </span>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Order Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Order</DialogTitle>
            <DialogDescription>
              {orderType === "pickup"
                ? "Pickup order"
                : `Table ${selectedTable}`}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-96">
            <div className="space-y-4">
              {cartItems.map((cartItem) => (
                <div
                  key={cartItem.menuItem._id}
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{cartItem.menuItem.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {cartItem.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-primary">
                    £{cartItem.totalPrice.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>

          {notes && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium mb-1">Special Instructions:</p>
              <p className="text-sm text-muted-foreground">{notes}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-xl font-bold text-primary">
              £{totalAmount.toFixed(2)}
            </span>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowConfirmDialog(false);
                cartCheckout.mutate({ tableId: tableId || "", note: notes });
              }}
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

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
import { useGetMenuCategories } from "@/core/hooks/get-categories-hooks";
import { useGetMenuItems } from "@/core/hooks/get-menu-items";
import { useMenuStore } from "@/core/store/menu-store";
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
import { useEffect } from "react";
import { toast } from "sonner";
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

  const { data: categories, isLoading: categoriesLoading } = useGetMenuCategories();
  const { data: menuItems, isLoading: menuItemsLoading } = useGetMenuItems();

  const {
    // data + wiring
    setData,
    hydrateOrderContextFromStorage,

    // ui state
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedItem,
    setSelectedItem,
    currentOption,
    filteredItems,
    isLastStep,
    canProceed,
    calculateItemPrice,
    nextOrAddToCart,
    incQty,
    decQty,
    quantity,

    // cart + notes
    cartItems,
    removeFromCart,
    updateCartItemQuantity,
    totalAmount,
    notes,
    setNotes,
    showConfirmDialog,
    setShowConfirmDialog,
    clearCart,

    // order context
    orderType,
    selectedTable,

    // option changes
    handleOptionChange,
    startConfigForItem,
  } = useMenuStore();

  // push fetched data into store
  useEffect(() => {
    if (categories?.data || menuItems?.data) {
      setData({
        categories: categories?.data ?? undefined,
        menuItems: menuItems?.data ?? undefined,
      });
    }
  }, [categories?.data, menuItems?.data, setData]);

  // hydrate order context once
  useEffect(() => {
    hydrateOrderContextFromStorage();
  }, [hydrateOrderContextFromStorage]);

  const items = filteredItems();
  const total = totalAmount();
  const curOption = currentOption();
  const lastStep = isLastStep();

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
              {orderType === "pickup" ? "Pickup Order" : `Table ${selectedTable}`}
            </p>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex flex-wrap gap-2">
            {categories?.data.map((category) => (
              <Button
                key={category.id}
                variant={String(selectedCategory) === String(category.id) ? "default" : "outline"}
                onClick={() => setSelectedCategory(String(category.id))}
                className="whitespace-nowrap"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-4 mb-2 border border-gray-200 rounded-lg cursor-pointer hover:shadow-md hover:bg-gray-50 transition-all"
                onClick={() => startConfigForItem(item)}
                role="button"
              >
                <div className="flex items-center min-w-0">
                  <div className="relative flex-shrink-0 w-20 h-20 overflow-hidden rounded-md ring-1 ring-gray-200">
                    <img
                      src={item.photoUrl || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="ml-4 font-semibold text-base md:text-lg">
                    {item.name}
                  </h3>
                </div>

                <div className="flex-shrink-0">
                  <span className="inline-block px-3 py-4 border rounded-md bg-white text-sm md:text-base">
                    £{item.price.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Your Order</h2>
          <Badge variant="secondary">
            {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        {cartItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Your cart is empty</p>
            <p className="text-sm mt-2">Add items to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((cartItem) => (
              <Card key={cartItem.id} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{cartItem.menuItem.name}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => useMenuStore.getState().removeFromCart(cartItem.id)}
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
                          updateCartItemQuantity(cartItem.id, cartItem.quantity - 1)
                        }
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{cartItem.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateCartItemQuantity(cartItem.id, cartItem.quantity + 1)
                        }
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

      {cartItems.length > 0 && (
        <div className="border-t border-slate-200 p-6 space-y-4">
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
            <span className="text-xl font-bold text-primary">£{total.toFixed(2)}</span>
          </div>
          <Button onClick={() => setShowConfirmDialog(true)} className="w-full" size="lg">
            Confirm Order
          </Button>
        </div>
      )}
    </>
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
                    src={selectedItem.photoUrl || "/placeholder.svg"}
                    alt={selectedItem.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div>
                    <DialogTitle className="text-xl">{selectedItem.name}</DialogTitle>
                    <DialogDescription className="mt-2">
                      {selectedItem.description}
                    </DialogDescription>
                    <Badge className="mt-2">£{selectedItem.price.toFixed(2)}</Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="py-4">
                {selectedItem.options.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Ready to add to cart!</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        {curOption?.name}
                        {curOption?.required && <span className="text-destructive ml-1">*</span>}
                      </h3>
                      <Badge variant="outline">
                        {useMenuStore.getState().currentOptionIndex + 1} of{" "}
                        {selectedItem.options.length}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {curOption?.type === "radio" ? (
                        <RadioGroup
                          value={
                            useMenuStore.getState().selectedOptions[curOption._id]?.[0] || ""
                          }
                          onValueChange={(value) => handleOptionChange(curOption._id, value, true)}
                        >
                          {curOption.choices?.map((choice) => (
                            <div key={choice._id} className="flex items-center space-x-3 p-3 rounded-lg border">
                              <RadioGroupItem value={choice._id} id={choice._id} />
                              <Label htmlFor={choice._id} className="flex-1 cursor-pointer">
                                <div className="flex justify-between items-center">
                                  <span>{choice.name}</span>
                                  {choice.price > 0 && (
                                    <span className="text-primary font-medium">
                                      +£{choice.price.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      ) : (
                        <div className="space-y-3">
                          {curOption?.choices?.map((choice) => {
                            const isSelected =
                              useMenuStore
                                .getState()
                                .selectedOptions[curOption._id]?.includes(choice._id) || false;
                            return (
                              <div key={choice._id} className="flex items-center space-x-3 p-3 rounded-lg border">
                                <Checkbox
                                  id={choice._id}
                                  checked={isSelected}
                                  onCheckedChange={(checked) =>
                                    handleOptionChange(curOption._id, choice._id, !!checked)
                                  }
                                />
                                <Label htmlFor={choice._id} className="flex-1 cursor-pointer">
                                  <div className="flex justify-between items-center">
                                    <span>{choice.name}</span>
                                    {choice.price > 0 && (
                                      <span className="text-primary font-medium">
                                        +£{choice.price.toFixed(2)}
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
                  </div>
                )}

                {(lastStep || selectedItem.options.length === 0) && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-center space-x-4">
                      <Button variant="outline" size="sm" onClick={decQty} className="h-10 w-10 p-0">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-xl font-bold min-w-[3rem] text-center">{quantity}</span>
                      <Button variant="outline" size="sm" onClick={incQty} className="h-10 w-10 p-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  onClick={() => {
                    nextOrAddToCart();
                    if (lastStep || selectedItem.options.length === 0) {
                      toast.success("Item added to cart!");
                    }
                  }}
                  disabled={!canProceed()}
                  className="w-full"
                  size="lg"
                >
                  <span>{lastStep || selectedItem.options.length === 0 ? "Add to Cart" : "Next"}</span>
                  <span className="ml-2 font-bold">
                    £{(
                      calculateItemPrice(
                        selectedItem,
                        useMenuStore.getState().selectedOptions
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
              {orderType === "pickup" ? "Pickup order" : `Table ${selectedTable}`}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-96">
            <div className="space-y-4">
              {cartItems.map((cartItem) => (
                <div
                  key={cartItem.id}
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{cartItem.menuItem.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {cartItem.quantity}</p>
                  </div>
                  <p className="font-bold text-primary">£{cartItem.totalPrice.toFixed(2)}</p>
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
            <span className="text-xl font-bold text-primary">£{total.toFixed(2)}</span>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.success("Order confirmed! Sent to kitchen.");
                setShowConfirmDialog(false);
                clearCart();
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

"use client";

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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ResizableLayout } from "../components/resizable-layout";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  options: {
    id: string;
    name: string;
    type: "single" | "multiple";
    required: boolean;
    choices: {
      id: string;
      name: string;
      price: number;
    }[];
  }[];
}

interface CartItem {
  id: string;
  menuItem: MenuItem;
  selectedOptions: { [optionId: string]: string[] };
  quantity: number;
  totalPrice: number;
}

const mockMenuItems: MenuItem[] = [
  {
    id: "1",
    name: "Classic Burger",
    price: 12.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Burgers",
    description:
      "Juicy beef patty with fresh lettuce, tomatoes, and our special sauce",
    options: [
      {
        id: "size",
        name: "Size",
        type: "single",
        required: true,
        choices: [
          { id: "regular", name: "Regular", price: 0 },
          { id: "large", name: "Large", price: 2.5 },
        ],
      },
      {
        id: "extras",
        name: "Extras",
        type: "multiple",
        required: false,
        choices: [
          { id: "cheese", name: "Extra Cheese", price: 1.5 },
          { id: "bacon", name: "Bacon", price: 2.0 },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "Margherita Pizza",
    price: 14.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Pizza",
    description:
      "Fresh mozzarella, basil, and tomato sauce on our signature dough",
    options: [
      {
        id: "size",
        name: "Size",
        type: "single",
        required: true,
        choices: [
          { id: "small", name: 'Small (10")', price: 0 },
          { id: "medium", name: 'Medium (12")', price: 3.0 },
          { id: "large", name: 'Large (14")', price: 6.0 },
        ],
      },
    ],
  },
  {
    id: "3",
    name: "Caesar Salad",
    price: 9.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Salads",
    description: "Crisp romaine lettuce with parmesan cheese and croutons",
    options: [
      {
        id: "protein",
        name: "Add Protein",
        type: "single",
        required: false,
        choices: [
          { id: "chicken", name: "Grilled Chicken", price: 4.0 },
          { id: "salmon", name: "Grilled Salmon", price: 6.0 },
        ],
      },
    ],
  },
];

const categories = ["All", "Burgers", "Pizza", "Salads", "Drinks", "Desserts"];

export const Route = createFileRoute("/menu")({
  component: Menu,
  beforeLoad: ({ context }: {
    context: any;
  }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/",
        search: {
          redirect: "/tables",
        },
      });
    }
  },
});

export default function Menu() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<
    { [optionId: string]: string[] }
  >({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<"table" | "pickup">("table");

  useEffect(() => {
    const tableNumber = localStorage.getItem("selectedTable");
    const storedOrderType = localStorage.getItem("orderType");
    if (storedOrderType === "pickup") {
      setOrderType("pickup");
      setSelectedTable(null);
    } else if (tableNumber) {
      setOrderType("table");
      setSelectedTable(tableNumber);
    }
  }, []);

  const filteredItems = mockMenuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(
      searchQuery.toLowerCase(),
    );
    const matchesCategory = selectedCategory === "All" ||
      item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setCurrentOptionIndex(0);
    setSelectedOptions({});
    setQuantity(1);
  };

  const handleOptionChange = (
    optionId: string,
    choiceId: string,
    checked: boolean,
  ) => {
    const option = selectedItem?.options.find((opt) => opt.id === optionId);
    if (!option) return;

    setSelectedOptions((prev) => {
      const current = prev[optionId] || [];
      if (option.type === "single") {
        return { ...prev, [optionId]: checked ? [choiceId] : [] };
      } else {
        if (checked) {
          return { ...prev, [optionId]: [...current, choiceId] };
        } else {
          return {
            ...prev,
            [optionId]: current.filter((id) => id !== choiceId),
          };
        }
      }
    });
  };

  const canProceed = () => {
    if (!selectedItem) return false;
    const currentOption = selectedItem.options[currentOptionIndex];
    if (!currentOption) return true;
    if (currentOption.required) {
      const selected = selectedOptions[currentOption.id] || [];
      return selected.length > 0;
    }
    return true;
  };

  const calculateItemPrice = (
    item: MenuItem,
    options: { [optionId: string]: string[] },
  ) => {
    let price = item.price;
    item.options.forEach((option) => {
      const selectedChoiceIds = options[option.id] || [];
      selectedChoiceIds.forEach((choiceId) => {
        const choice = option.choices.find((c) => c.id === choiceId);
        if (choice) price += choice.price;
      });
    });
    return price;
  };

  const handleNext = () => {
    if (!selectedItem) return;
    if (currentOptionIndex < selectedItem.options.length - 1) {
      setCurrentOptionIndex(currentOptionIndex + 1);
    } else {
      addToCart();
    }
  };

  const addToCart = () => {
    if (!selectedItem) return;
    const totalPrice = calculateItemPrice(selectedItem, selectedOptions) *
      quantity;
    const cartItem: CartItem = {
      id: Date.now().toString(),
      menuItem: selectedItem,
      selectedOptions,
      quantity,
      totalPrice,
    };
    setCartItems((prev) => [...prev, cartItem]);
    setSelectedItem(null);
    toast.success("Item added to cart!");
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateCartItemQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId
          ? {
            ...item,
            quantity: newQuantity,
            totalPrice: (item.totalPrice / item.quantity) * newQuantity,
          }
          : item
      )
    );
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleConfirmOrder = () => {
    toast.success("Order confirmed! Sent to kitchen.");
    setShowConfirmDialog(false);
    setCartItems([]);
    setNotes("");
  };

  const currentOption = selectedItem?.options[currentOptionIndex];
  const isLastStep = selectedItem &&
    currentOptionIndex === selectedItem.options.length - 1;

  const mainContent = (
    <>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
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
              {orderType === "pickup"
                ? "Pickup Order"
                : `Table ${selectedTable}`}
            </p>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Menu Items */}
      <ScrollArea className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleItemClick(item)}
            >
              <CardContent className="p-0">
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-2 right-2 bg-white text-slate-900">
                    £{item.price.toFixed(2)}
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {item.category}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </>
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
              {cartItems.map((cartItem) => (
                <Card key={cartItem.id} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{cartItem.menuItem.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeFromCart(cartItem.id)}
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
                              cartItem.id,
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
                              cartItem.id,
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
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <ResizableLayout sidebar={sidebarContent}>{mainContent}</ResizableLayout>

      {/* Item Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <img
                    src={selectedItem.image || "/placeholder.svg"}
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

                      <div className="space-y-3">
                        {currentOption?.type === "single"
                          ? (
                            <RadioGroup
                              value={selectedOptions[currentOption.id]?.[0] ||
                                ""}
                              onValueChange={(value) =>
                                handleOptionChange(
                                  currentOption.id,
                                  value,
                                  true,
                                )}
                            >
                              {currentOption.choices.map((choice) => (
                                <div
                                  key={choice.id}
                                  className="flex items-center space-x-3 p-3 rounded-lg border"
                                >
                                  <RadioGroupItem
                                    value={choice.id}
                                    id={choice.id}
                                  />
                                  <Label
                                    htmlFor={choice.id}
                                    className="flex-1 cursor-pointer"
                                  >
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
                          )
                          : (
                            <div className="space-y-3">
                              {currentOption?.choices.map((choice) => {
                                const isSelected =
                                  selectedOptions[currentOption.id]?.includes(
                                    choice.id,
                                  ) || false;
                                return (
                                  <div
                                    key={choice.id}
                                    className="flex items-center space-x-3 p-3 rounded-lg border"
                                  >
                                    <Checkbox
                                      id={choice.id}
                                      checked={isSelected}
                                      onCheckedChange={(checked) =>
                                        handleOptionChange(
                                          currentOption.id,
                                          choice.id,
                                          checked as boolean,
                                        )}
                                    />
                                    <Label
                                      htmlFor={choice.id}
                                      className="flex-1 cursor-pointer"
                                    >
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

                {(isLastStep || selectedItem.options.length === 0) && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
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
                        onClick={() => setQuantity(quantity + 1)}
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
                  onClick={handleNext}
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
                    £{(calculateItemPrice(selectedItem, selectedOptions) *
                      quantity).toFixed(2)}
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
                  key={cartItem.id}
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
            <Button onClick={handleConfirmOrder}>
              <Check className="w-4 h-4 mr-2" />
              Confirm Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

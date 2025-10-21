"use client";

import TawilaShimmer from "@/components/LoadingBranded";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  useCartOperations,
  useCheckoutCart,
  useClearCart
} from "@/core/hooks/cart_hooks";
import { useGetRestaurantByIdParams } from "@/core/hooks/use-restaurant-hooks";
import { useGetTables } from "@/core/hooks/use-tables-hooks";
import type { Table } from "@/core/models/TableModel";
import { useAuthStore } from "@/stores/auth-store";
import {
  clearTableCheckoutData,
  getTableCheckoutData,
  setTableCheckoutData,
} from "@/utils/table-checkout-storage";

import { DiscountDisplay } from "@/components/DiscountDisplay";
import { authApi } from "@/core/repositories/auth-repository";
import { useCurrencyStore } from "@/features/cart/cart/stores/currency-store";
import type { Delegation } from "@/features/foundations/dtos/dtos";
import { useFoundationStore } from "@/features/foundations/store/foundation-store";
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  Minus,
  RefreshCcw,
  Trash2
} from "lucide-react";
import { getSelectedChoiceNamesForItem } from "../features/cart/cart/models/cart-item-model";

export const Route = createFileRoute("/tables")({
  component: TableSelection,
  beforeLoad: () => {
    // Check if user has valid authentication using Zustand store
    const { checkAuthValidity, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !checkAuthValidity()) {
      throw redirect({
        to: "/",
        search: { redirect: "/tables" },
      });
    }
  },
});

export default function TableSelection() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const clearSelectedFoundation = useFoundationStore(state => state.clearSelectedFoundation);
  const {
    data: restaurant,
    isLoading: isRestaurantLoading,
  } = useGetRestaurantByIdParams();
  const { currencySymbol } = useCurrencyStore();

  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const updateCartItemQuantity = (
    identifier: string,
    newQuantity: number,
    itemName: string
  ) => {
    if (newQuantity <= 0) {
      handleRemoveItem(
        identifier,
        itemName,
      );
    } else {
      tableCartOps.updateItem(identifier, { quantity: newQuantity });
    }
  };




  // Fetch delegations on component mount
  useEffect(() => {
    const fetchDelegations = async () => {
      try {
        if (!user?.id) return;
        const response = await authApi.getUserDelegations(user?.id);
        setDelegations(response.data);
      } catch (err) {
        console.log(
          "Failed to load delegations. Please try again later." + err,
        );
      } finally {
        console.log(false);
      }
    };

    fetchDelegations();
  }, [user?.id]);

  const [itemToRemove, setItemToRemove] = useState<{
    identifier: string;
    name: string;
  } | null>(null);

  const {
    data: tables,
    isLoading: isTablesLoading,
    refetch: refetchTables,
  } = useGetTables();


  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [restaurantData, setRestaurantData] = useState<any>(null);
  // toggle state (tab look)
  const [mode, setMode] = useState<"dine-in" | "pickup">("dine-in");
  const tableCartOps = useCartOperations(selectedTable?.id || "");

  // sidebar size persist (like your source styling)
  const getSidebarSize = () => {
    const saved = localStorage.getItem("sidebarSize");
    return saved ? parseInt(saved) : 28; // slightly wider to match screenshot
  };
  const [sidebarSize, setSidebarSize] = useState<number>(getSidebarSize());
  const handleSidebarResize = (size: number) => {
    setSidebarSize(size);
    localStorage.setItem("sidebarSize", size.toString());
  };

  const { cart, getCart } = useCartOperations(
    selectedTable?.id || "",
  );

  const clearCartMutation = useClearCart();
  const cartCheckout = useCheckoutCart();

  // Calculate breakdown manually for table carts (since useGetBreakDown is for pickup carts)
  const breakdown = useMemo(() => {
    if ((discount || 0) <= 0 || !cart?.totalAmount) return null;

    const cartTotal = cart.totalAmount;
    const discountAmount = cartTotal * ((discount || 0) / 100);
    const newTotal = Math.max(0, cartTotal - discountAmount);

    return {
      discount: discountAmount * 100, // Convert to cents for consistency
      subTotal: cartTotal * 100, // Convert to cents
      totalAmount: newTotal * 100, // Convert to cents
      tax: 0,
      shippingCost: 0,
      applicationFeeAmount: 0,
    };
  }, [discount, cart?.totalAmount, cart?.items?.length]);

  useEffect(() => {
    if (restaurant?.data) {
      setRestaurantData(restaurant.data);
      refetchTables();
    }
  }, [restaurant?.data, refetchTables]);

  useEffect(() => {
    if (!restaurantData) return;
    if (!restaurantData.hasDineIn && restaurantData.hasPickup) {
      setMode("pickup");
    } else {
      setMode("dine-in");
    }
  }, [restaurantData]);

  // Load checkout data from local storage when a table is selected
  useEffect(() => {
    if (selectedTable) {
      const checkoutData = getTableCheckoutData(selectedTable.id);
      setOrderNotes(checkoutData.notes);
      setDiscount(checkoutData.discount);
    } else {
      // Clear when no table is selected
      setOrderNotes("");
      setDiscount(0);
    }
  }, [selectedTable]);


  const handleRemoveItem = (identifier: string, itemName: string) => {
    setItemToRemove({ identifier, name: itemName });
  };

  const handleClearDiscount = () => {
    if (selectedTable) {
      setDiscount(0);
      // Clear from localStorage too
      const currentData = getTableCheckoutData(selectedTable.id);
      setTableCheckoutData(selectedTable.id, { ...currentData, discount: 0 });
    }
  };

  const confirmRemoveItem = () => {
    if (itemToRemove) {
      console.log("Removing item with identifier:", itemToRemove.identifier);
      tableCartOps.removeItem(itemToRemove.identifier)
      setItemToRemove(null);
    }
  };
  // EXACT tile colors per screenshot
  const getTableColor = (status: string) => {
    switch (status) {
      case "occupied":
        return "bg-primary hover:bg-primary/90 text-white";
      case "free":
        return "bg-white text-[#010101] border-2 border-[#010101] hover:bg-primary/5";
      case "reserved":
        return "bg-[#d9d9d9] text-[#010101] hover:bg-[#d9d9d9]/90";
      default:
        return "bg-[#d9d9d9] text-[#010101]";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "occupied":
        return (
          <Badge variant="default" className="bg-green-500">
            Active
          </Badge>
        );
      case "free":
        return <Badge variant="outline">Available</Badge>;
      case "reserved":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            Reserved
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleTableClick = (table: Table) => {
    if (table.status === "free") {
      navigate({
        to: "/menu",
        search: { tableId: table.id, name: table.name },
      });
    } else {
      setSelectedTable(table);
      setShowPaymentOptions(false);
    }
    getCart();
  };

  const handleOrderForTable = (tableId: string) =>
    navigate({ to: "/menu", search: { tableId, name: selectedTable?.name } });

  const handlePickupOrder = () =>
    navigate({ to: "/menu", search: { name: "pickup" } });

  const handlePaymentMethodSelect = (method: string) => {
    if (method === "cash") {
      // Process cash payment
      handleConfirmOrder(method);
    } else if (method === "credit") {
      handleConfirmOrder(method);
    }
  };

  const handleConfirmOrder = (paymentMethod: "cash" | "credit") => {
    if (!selectedTable) return;
    cartCheckout.mutate({
      tableId: selectedTable.id,
      note: orderNotes,
      discount: discount,
      paymentMethod: paymentMethod,
    });

    // Clear the stored checkout data for this table after payment
    clearTableCheckoutData(selectedTable.id);

    setShowPaymentOptions(false);
    setOrderNotes("");
    setDiscount(0);
    setTimeout(() => {
      getCart();
      refetchTables();
      setSelectedTable(null);
    }, 1000);
  };

  // Calculate final total amount considering discount - force recalculation on cart changes
  const totalAmount = useMemo(() => {
    // If discount is 0 or negative, always use cart total regardless of breakdown
    if (discount <= 0) {
      return cart?.totalAmount || 0;
    }

    // Only use breakdown if we have a valid discount greater than 0 AND valid breakdown data
    if (breakdown && breakdown.totalAmount !== undefined && breakdown.totalAmount !== null) {
      return breakdown.totalAmount / 100;
    }

    // Fallback to cart total if breakdown is invalid
    return cart?.totalAmount || 0;
  }, [breakdown, discount, cart?.totalAmount, cart?.items?.length]);
  const cartItems = cart?.items || [];

  if (isRestaurantLoading || isTablesLoading) {
    return <TawilaShimmer />;
  }

  return (
    <div className="min-h-screen bg-white">
      <ResizablePanelGroup direction="horizontal" className="min-h-screen">
        {/* MAIN */}
        <ResizablePanel
          defaultSize={100 - sidebarSize}
          minSize={60}
          maxSize={85}
        >
          {/* HEADER (exact look) */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-12 w-12 rounded-full p-0"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={restaurantData?.logo} alt="Profile" />
                        <AvatarFallback className="bg-slate-100" />
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <div className="px-2 py-1.5">
                      <div className="font-medium">
                        {user?.firstName} {user?.lastName}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    {delegations.length > 1 && (
                      <DropdownMenuItem
                        onClick={() => {
                          clearSelectedFoundation();
                          navigate({ to: "/foundations" });
                        }}
                      >
                        Change Restaurant
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => {
                        signOut();
                        navigate({ to: "/" });
                      }}
                    >
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <h1 className="text-3xl font-bold text-primary">
                  {restaurant?.data?.name}
                </h1>
              </div>
              <div className=" h-20">
                <div className="px-4">
                  <div className="flex items-end justify-end mb-4">
                    <Button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 py-3 flex items-center gap-2 text-sm font-medium shadow-lg transition-all duration-200 hover:shadow-xl"
                      onClick={() => navigate({
                        reloadDocument: true
                      })}
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-md bg-primary">
                      </span>
                      <span>Occupied</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-md border border-[#010101] bg-white">
                      </span>
                      <span>Free</span>
                    </div>
                    {
                      /* <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-md bg-[#d9d9d9]">
                          </span>
                          <span>Reserved</span>
                        </div> */
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              {/* PILL TOGGLE exactly like screenshot */}
              <ToggleGroup
                type="single"
                value={mode}
                onValueChange={(v) => {
                  if (!v) return;
                  if (v === "dine-in" && !restaurantData?.hasDineIn) return;
                  if (v === "pickup" && !restaurantData?.hasPickup) return;
                  setMode(v as "dine-in" | "pickup");
                }}
                className="grid w-full grid-cols-2 rounded-xl bg-slate-100 p-2"
              >
                <ToggleGroupItem
                  value="dine-in"
                  disabled={!restaurantData?.hasDineIn}
                  className="rounded-lg h-12 text-base data-[state=on]:bg-primary data-[state=on]:shadow-sm data-[state=on]:text-primary-foreground"
                >
                  Dine-in
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="pickup"
                  disabled={!restaurantData?.hasPickup}
                  className="rounded-lg h-12 text-base data-[state=on]:bg-primary data-[state=on]:shadow-sm data-[state=on]:text-primary-foreground"
                >
                  Pickup
                </ToggleGroupItem>
              </ToggleGroup>

              {/* GRID like screenshot: big squares, generous gap */}
              {mode === "dine-in" && restaurantData?.hasDineIn && (
                <div className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {tables?.data?.map((table) => (
                      <Card
                        key={table.id}
                        onClick={() => handleTableClick(table)}
                        className={`cursor-pointer rounded-2xl overflow-hidden h-36 flex ${
                          getTableColor(
                            table.status,
                          )
                        } items-center justify-center transition-colors`}
                      >
                        <CardContent className="p-0 text-center w-full h-full flex items-center justify-center">
                          <h3 className="text-lg md:text-xl font-normal">
                            {table.name}
                          </h3>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {mode === "pickup" && restaurantData?.hasPickup && (
                <div className="pt-6">
                  <div className="text-center py-10">
                    <div className="max-w-md mx-auto bg-gray-50 p-8 rounded-xl shadow-sm">
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Pickup Order
                      </h2>
                      <p className="text-gray-600 mb-8">
                        Ready to order for pickup? Click below to go straight to
                        the menu.
                      </p>
                      <Button
                        onClick={handlePickupOrder}
                        className="w-full bg-primary hover:bg-primary/90 text-white h-14 text-lg font-semibold rounded-lg"
                      >
                        Start Pickup Order
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>

        {/* HANDLE */}
        <ResizableHandle
          withHandle
          className="w-3 bg-border hover:bg-primary/20 active:bg-primary/30 transition-colors cursor-col-resize"
        />

        {/* SIDEBAR (title + helper text, same tone) */}
        <ResizablePanel
          defaultSize={sidebarSize}
          minSize={15}
          maxSize={40}
          onResize={handleSidebarResize}
        >
          <div
            className="h-full bg-white border-l border-gray-200 shadow-lg"
            style={{ width: `${sidebarSize}vw` }}
          >
            {selectedTable
              ? (
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedTable.name}
                      </h2>
                      {getStatusBadge(selectedTable.status)}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 capitalize">
                      {selectedTable.status}
                    </p>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="p-6">
                      <Button
                          variant="outline"
                          className="mb-4 w-full"
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to clear this table?",
                              )
                            ) {
                              clearCartMutation.mutate(selectedTable.id);
                            }
                          }}
                        >
                          Clear Table
                      </Button>

                      <Button
                          variant="outline"
                          className="mb-4 w-full"
                          onClick={handleClearDiscount}
                        >
                          Clear Discount ({discount}%)
                      </Button>

                      {showPaymentOptions
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
                              Payment
                            </h3>

                            {/* Payment Method Buttons */}
                            <div className="space-y-3">
                              <Button
                                variant="outline"
                                className="w-full justify-start h-14 text-base font-medium"
                                onClick={() =>
                                  handlePaymentMethodSelect("credit")}
                              >
                                <CreditCard className="mr-3 h-5 w-5" />
                                Card
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full justify-start h-14 text-base font-medium"
                                onClick={() =>
                                  handlePaymentMethodSelect("cash")}
                              >
                                <Banknote className="mr-3 h-5 w-5" />
                                Cash
                              </Button>
                            </div>
                          </div>
                        )
                        : (
                          <ScrollArea className="max-h-64">
                            <div className="space-y-4">
                            {cartItems.map((item) => (
                              <Card
                                key={item.optionsHash}
                                className="border-slate-200 my-2"
                              >
                                <CardContent className="">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-medium">
                                      {item.menuItem.name}
                                    </h4>

                                  </div>
                                  <p className="text-xs text-gray-600 truncate w-64">
                                    {getSelectedChoiceNamesForItem(item)
                                      .join(", ")}
                                  </p>
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
                                            item.menuItem.name
                                          )}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="w-8 text-center">
                                        {item.quantity}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleRemoveItem(
                                            item.optionsHash,
                                            item.menuItem.name
                                          )}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>

                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                            </div>
                          </ScrollArea>
                        )}
                    </div>
                  </ScrollArea>

                  <div className="border-t border-gray-200">
                    {(selectedTable.status === "reserved" ||
                      (selectedTable.status === "occupied" &&
                        cartItems.length > 0)) && (
                      <div className="p-2 border-b border-gray-200 space-y-4">
                        {/* Discount Display */}
                        {breakdown && discount > 0 && (
                          <DiscountDisplay
                            discount={breakdown.discount}
                            subTotal={breakdown.subTotal || 0}
                            totalAmount={breakdown.totalAmount}
                            size="sm"
                          />
                        )}

                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900">
                            Total
                          </span>
                          <span className="text-xl font-bold text-primary">
                            {currencySymbol}{totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {!showPaymentOptions && (
                      <div className="p-6 space-y-3">
                        {selectedTable.status !== "reserved" && (
                          <Button
                            onClick={() =>
                              handleOrderForTable(selectedTable.id)}
                            className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-14 text-lg font-semibold"
                          >
                            {selectedTable.status === "occupied"
                              ? "Order more for"
                              : "Order for"} {selectedTable.name}
                          </Button>
                        )}

                        {(selectedTable.status === "occupied" ||
                          selectedTable.status === "reserved") &&
                          cartItems.length > 0 && (
                          <Button
                            onClick={() => setShowPaymentOptions(true)}
                            variant="outline"
                            className="w-full border-primary text-primary hover:bg-primary hover:text-white rounded-xl h-14 text-lg font-semibold"
                          >
                            Payment
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
              : (
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Table Details
                  </h2>
                  <p className="text-gray-500">
                    Select a table to view details
                  </p>
                </div>
              )}
          </div>

        </ResizablePanel>
      </ResizablePanelGroup>

      <AlertDialog open={!!itemToRemove} onOpenChange={() => setItemToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{itemToRemove?.name}" from the order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

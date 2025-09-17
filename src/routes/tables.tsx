"use client";

import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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
  useClearCart,
} from "@/core/hooks/cart_hooks";
import { useAuth } from "@/core/hooks/use-auth";
import { useGetRestaurantById } from "@/core/hooks/use-restaurant-hooks";
import { useGetTables } from "@/core/hooks/use-tables-hooks";
import type { Table } from "@/core/models/TableModel";
import { clearTableCheckoutData, getTableCheckoutData } from "@/utils/table-checkout-storage";

import { ArrowLeft, Banknote, ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import { getSelectedChoiceNamesForItem } from "./cart/models/cart-item-model";

export const Route = createFileRoute("/tables")({
  component: TableSelection,
  beforeLoad: ({ context }: { context: any }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/",
        search: { redirect: "/tables" },
      });
    }
  },
});

export default function TableSelection() {
  const auth = useAuth();
  const navigate = useNavigate();

  const { data: restaurant, isLoading: isRestaurantLoading } =
    useGetRestaurantById();

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const xFoundationId = localStorage.getItem("x-foundation-id");
    if (restaurant?.data) {
      if (xFoundationId !== restaurant.data.id || !xFoundationId) {
        localStorage.setItem("x-foundation-id", restaurant.data.id);
      }
    }
  }, [restaurant]);

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
    } else if (method === "card") {
      handleConfirmOrder(method);
    }

  };

  const handleConfirmOrder = (paymentMethod: "cash" | "card") => {
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

  const totalAmount = cart?.totalAmount || 0;
  const cartItems = cart?.items || [];

  if (isRestaurantLoading || isTablesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">
          Loading restaurant data...
        </p>
      </div>
    );
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
                        {auth.user?.firstName} {auth.user?.lastName}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        auth.signOut();
                        navigate({ to: "/" });
                      }}
                    >
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <h1 className="text-3xl font-bold text-primary">{ restaurant?.data?.name}</h1>
              </div>
              <div className=" h-20">
                <div className="px-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Note:
                  </h3>
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
                      {selectedTable.status === "occupied" &&
                        (cartItems?.length ?? 0) > 0 && (
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
                      )}

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
                                  handlePaymentMethodSelect("card")}
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
                          <div className="">
                            {cartItems.map((cartItem) => (
                              <Card
                                key={cartItem.optionsHash}
                                className="border border-gray-200 mb-3"
                              >
                                <CardContent className="p-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium text-sm">
                                        {cartItem.menuItem?.name ?? "Item"}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Qty: {cartItem.quantity}
                                      </p>
                                    {getSelectedChoiceNamesForItem(cartItem).length >
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
                                    <span className="max-w-62 truncate inline-block text-left">
                                      {getSelectedChoiceNamesForItem(cartItem)
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
                                        {getSelectedChoiceNamesForItem(cartItem)
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
                                    </div>
                                    <div className="flex items-center">
                                      <span className="font-bold text-primary">
                                        £{Number(cartItem.totalPrice).toFixed(
                                          2,
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                    </div>
                  </ScrollArea>

                  <div className="border-t border-gray-200">
                    {(selectedTable.status === "reserved" ||
                      (selectedTable.status === "occupied" &&
                        cartItems.length > 0)) && (
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900">
                            Total
                          </span>
                          <span className="text-xl font-bold text-primary">
                            £{totalAmount.toFixed(2)}
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
    </div>
  );
}
